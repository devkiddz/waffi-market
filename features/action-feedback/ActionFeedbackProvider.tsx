'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useIdentity } from '@/providers/IdentityProvider';

import { ActionFeedbackContext } from './actionFeedbackContext';
import { ActionFeedbackViewport } from './ActionFeedbackViewport';
import { AuthenticationGateDialog } from './AuthenticationGateDialog';
import { StoreExperienceOnboarding } from './StoreExperienceOnboarding';

import { readPendingAction, writePendingAction } from './actionFeedbackStorage';

import { buildAuthHref, getCurrentReturnTo, sanitizeInternalReturnTo } from './authNavigation';

import type {
  ActionFeedbackCartItem,
  ActionFeedbackCartPreview,
  ActionFeedbackContextValue,
  ActionFeedbackInput,
  ActionFeedbackMessage,
  ActionFeedbackTone,
  AuthenticationGateRequest,
  CreateProtectedActionInput,
  ProtectedActionDescriptor,
  ProtectedActionHandler,
  RunProtectedActionInput
} from './actionFeedbackTypes';

type ActionFeedbackProviderProps = {
  children: ReactNode;
};

const defaultDurations = {
  success: 3500,
  error: 6000,
  warning: 5000,
  info: 4500
} satisfies Record<ActionFeedbackTone, number>;

const MAX_VISIBLE_MESSAGES = 4;

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function createProtectedAction(input: CreateProtectedActionInput): ProtectedActionDescriptor {
  return {
    id: input.id ?? createId('action'),
    type: input.type,
    payload: input.payload,
    title: input.title,
    description: input.description,
    successTitle: input.successTitle,
    successDescription: input.successDescription,
    returnTo: sanitizeInternalReturnTo(input.returnTo ?? getCurrentReturnTo(), '/store'),
    createdAt: Date.now()
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function getCartItemKey(item: ActionFeedbackCartItem): string {
  return `${item.productId}:${item.variantId}`;
}

function mergeCartPreviews(
  existingPreview: ActionFeedbackCartPreview | undefined,
  incomingPreview: ActionFeedbackCartPreview | undefined
): ActionFeedbackCartPreview | undefined {
  if (!incomingPreview) {
    return existingPreview;
  }

  const mergedItems = new Map<string, ActionFeedbackCartItem>();

  for (const item of existingPreview?.items ?? []) {
    mergedItems.set(getCartItemKey(item), {
      ...item
    });
  }

  for (const incomingItem of incomingPreview.items) {
    const itemKey = getCartItemKey(incomingItem);

    const existingItem = mergedItems.get(itemKey);

    if (!existingItem) {
      mergedItems.set(itemKey, {
        ...incomingItem
      });

      continue;
    }

    const variantLabel = incomingItem.variantLabel ?? existingItem.variantLabel;

    const price = typeof incomingItem.price === 'number' ? incomingItem.price : existingItem.price;

    mergedItems.set(itemKey, {
      id: incomingItem.id || existingItem.id,

      productId: incomingItem.productId,
      variantId: incomingItem.variantId,

      name: incomingItem.name,
      image: incomingItem.image,

      quantity: existingItem.quantity + incomingItem.quantity,

      ...(variantLabel
        ? {
            variantLabel
          }
        : {}),

      ...(typeof price === 'number'
        ? {
            price
          }
        : {})
    });
  }

  const items = Array.from(mergedItems.values());

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  const allItemsHavePrices = items.length > 0 && items.every(item => typeof item.price === 'number');

  const calculatedTotalAmount = allItemsHavePrices
    ? items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0)
    : undefined;

  const combinedFallbackAmount =
    typeof existingPreview?.totalAmount === 'number' && typeof incomingPreview.totalAmount === 'number'
      ? existingPreview.totalAmount + incomingPreview.totalAmount
      : (incomingPreview.totalAmount ?? existingPreview?.totalAmount);

  const totalAmount = calculatedTotalAmount ?? combinedFallbackAmount;

  const locale = incomingPreview.locale ?? existingPreview?.locale;

  const currency = incomingPreview.currency ?? existingPreview?.currency;

  return {
    items,
    totalQuantity,

    ...(typeof totalAmount === 'number'
      ? {
          totalAmount
        }
      : {}),

    ...(locale
      ? {
          locale
        }
      : {}),

    ...(currency
      ? {
          currency
        }
      : {})
  };
}

function createFeedbackMessage({
  id,
  input,
  tone,
  duration,
  groupKey
}: {
  id: string;
  input: ActionFeedbackInput;
  tone: ActionFeedbackTone;
  duration: number;
  groupKey?: string;
}): ActionFeedbackMessage {
  return {
    id,

    tone,

    title: input.title,

    duration,
    createdAt: Date.now(),

    revision: 0,

    ...(input.description !== undefined
      ? {
          description: input.description
        }
      : {}),

    ...(input.banner !== undefined
      ? {
          banner: input.banner
        }
      : {}),

    ...(input.action !== undefined
      ? {
          action: input.action
        }
      : {}),

    ...(input.cartPreview !== undefined
      ? {
          cartPreview: mergeCartPreviews(undefined, input.cartPreview)
        }
      : {}),

    ...(groupKey
      ? {
          groupKey
        }
      : {})
  };
}

export function ActionFeedbackProvider({ children }: ActionFeedbackProviderProps) {
  const router = useRouter();

  const { isAuthenticated, isPending } = useIdentity();

  const [messages, setMessages] = useState<ActionFeedbackMessage[]>([]);

  const [authenticationRequest, setAuthenticationRequest] = useState<AuthenticationGateRequest | null>(null);

  const [pendingAction, setPendingAction] = useState<ProtectedActionDescriptor | null>(null);

  const [resumingAction, setResumingAction] = useState(false);

  const [handlerVersion, setHandlerVersion] = useState(0);

  const dismissalTimers = useRef(new Map<string, number>());

  /**
   * Maps a group key such as "cart-activity"
   * to the notification currently representing it.
   */
  const groupedMessageIds = useRef(new Map<string, string>());

  /**
   * Reverse lookup used when a notification is dismissed.
   */
  const messageGroupKeys = useRef(new Map<string, string>());

  const protectedActionHandlers = useRef(new Map<string, ProtectedActionHandler>());

  const dismiss = useCallback((messageId: string) => {
    const timer = dismissalTimers.current.get(messageId);

    if (timer) {
      window.clearTimeout(timer);

      dismissalTimers.current.delete(messageId);
    }

    const groupKey = messageGroupKeys.current.get(messageId);

    if (groupKey) {
      const groupedMessageId = groupedMessageIds.current.get(groupKey);

      if (groupedMessageId === messageId) {
        groupedMessageIds.current.delete(groupKey);
      }

      messageGroupKeys.current.delete(messageId);
    }

    setMessages(currentMessages => currentMessages.filter(message => message.id !== messageId));
  }, []);

  const restartDismissalTimer = useCallback(
    (messageId: string, duration: number): void => {
      const existingTimer = dismissalTimers.current.get(messageId);

      if (existingTimer) {
        window.clearTimeout(existingTimer);

        dismissalTimers.current.delete(messageId);
      }

      if (duration <= 0) {
        return;
      }

      const timer = window.setTimeout(() => {
        dismiss(messageId);
      }, duration);

      dismissalTimers.current.set(messageId, timer);
    },
    [dismiss]
  );

  const dismissAll = useCallback(() => {
    dismissalTimers.current.forEach(timer => {
      window.clearTimeout(timer);
    });

    dismissalTimers.current.clear();
    groupedMessageIds.current.clear();
    messageGroupKeys.current.clear();

    setMessages([]);
  }, []);

  const notify = useCallback(
    (input: ActionFeedbackInput): string => {
      const tone = input.tone ?? 'info';

      const duration = input.duration ?? defaultDurations[tone];

      const normalizedGroupKey = input.groupKey?.trim() || undefined;

      const existingGroupedMessageId = normalizedGroupKey
        ? groupedMessageIds.current.get(normalizedGroupKey)
        : undefined;

      const messageId = existingGroupedMessageId ?? createId('feedback');

      if (normalizedGroupKey) {
        groupedMessageIds.current.set(normalizedGroupKey, messageId);

        messageGroupKeys.current.set(messageId, normalizedGroupKey);
      }

      setMessages(currentMessages => {
        const existingMessageIndex = currentMessages.findIndex(message => message.id === messageId);

        if (existingMessageIndex >= 0) {
          const existingMessage = currentMessages[existingMessageIndex];

          const mergedCartPreview = mergeCartPreviews(existingMessage.cartPreview, input.cartPreview);

          const updatedMessage: ActionFeedbackMessage = {
            ...existingMessage,

            tone,

            title: input.title,

            duration,
            createdAt: Date.now(),

            revision: existingMessage.revision + 1
          };

          if (input.description !== undefined) {
            updatedMessage.description = input.description;
          }

          if (input.banner !== undefined) {
            updatedMessage.banner = input.banner;
          }

          if (input.action !== undefined) {
            updatedMessage.action = input.action;
          }

          if (mergedCartPreview) {
            updatedMessage.cartPreview = mergedCartPreview;
          }

          if (normalizedGroupKey) {
            updatedMessage.groupKey = normalizedGroupKey;
          }

          return currentMessages.map(message => (message.id === messageId ? updatedMessage : message));
        }

        const message = createFeedbackMessage({
          id: messageId,
          input,
          tone,
          duration,
          groupKey: normalizedGroupKey
        });

        return [...currentMessages.slice(-(MAX_VISIBLE_MESSAGES - 1)), message];
      });

      restartDismissalTimer(messageId, duration);

      return messageId;
    },
    [restartDismissalTimer]
  );

  const success = useCallback(
    (input: Omit<ActionFeedbackInput, 'tone'>) =>
      notify({
        ...input,
        tone: 'success'
      }),
    [notify]
  );

  const error = useCallback(
    (input: Omit<ActionFeedbackInput, 'tone'>) =>
      notify({
        ...input,
        tone: 'error'
      }),
    [notify]
  );

  const warning = useCallback(
    (input: Omit<ActionFeedbackInput, 'tone'>) =>
      notify({
        ...input,
        tone: 'warning'
      }),
    [notify]
  );

  const info = useCallback(
    (input: Omit<ActionFeedbackInput, 'tone'>) =>
      notify({
        ...input,
        tone: 'info'
      }),
    [notify]
  );

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    writePendingAction(null);
  }, []);

  const preservePendingAction = useCallback((action: ProtectedActionDescriptor) => {
    setPendingAction(action);
    writePendingAction(action);
  }, []);

  const executeAction = useCallback(
    async (action: ProtectedActionDescriptor, handler: ProtectedActionHandler): Promise<boolean> => {
      try {
        await handler(action.payload, action);

        success({
          title: action.successTitle ?? 'Action completed',

          description: action.successDescription ?? 'Your Shelsea experience has been updated.'
        });

        return true;
      } catch (actionError) {
        error({
          title: 'Unable to complete action',

          description: getErrorMessage(
            actionError,
            'Shelsea could not complete that action. Please try again.'
          )
        });

        return false;
      }
    },
    [error, success]
  );

  const runProtectedAction = useCallback(
    async ({ action: actionInput, execute, gate }: RunProtectedActionInput): Promise<boolean> => {
      if (isPending) {
        info({
          title: 'Checking your account',

          description: 'Please wait a moment while Shelsea confirms your session.'
        });

        return false;
      }

      const action = createProtectedAction(actionInput);

      if (!isAuthenticated) {
        preservePendingAction(action);

        setAuthenticationRequest({
          action,
          copy: gate
        });

        return false;
      }

      return executeAction(action, execute);
    },
    [executeAction, info, isAuthenticated, isPending, preservePendingAction]
  );

  const registerProtectedActionHandler = useCallback(
    (actionType: string, handler: ProtectedActionHandler) => {
      protectedActionHandlers.current.set(actionType, handler);

      setHandlerVersion(currentVersion => currentVersion + 1);

      return () => {
        const currentHandler = protectedActionHandlers.current.get(actionType);

        if (currentHandler === handler) {
          protectedActionHandlers.current.delete(actionType);

          setHandlerVersion(currentVersion => currentVersion + 1);
        }
      };
    },
    []
  );

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const storedAction = readPendingAction();

      if (storedAction) {
        setPendingAction(storedAction);
      }
    }, 0);

    return () => {
      window.clearTimeout(hydrationTimer);
    };
  }, []);

  useEffect(() => {
    if (isPending || !isAuthenticated || !pendingAction || resumingAction) {
      return;
    }

    const handler = protectedActionHandlers.current.get(pendingAction.type);

    if (!handler) {
      return;
    }

    const actionToResume = pendingAction;

    const resumeTimer = window.setTimeout(() => {
      setResumingAction(true);

      /*
       * Remove the action before execution so a failed
       * handler cannot enter an automatic retry loop.
       */
      clearPendingAction();

      void executeAction(actionToResume, handler).finally(() => {
        setResumingAction(false);
      });
    }, 0);

    return () => {
      window.clearTimeout(resumeTimer);
    };
  }, [
    clearPendingAction,
    executeAction,
    handlerVersion,
    isAuthenticated,
    isPending,
    pendingAction,
    resumingAction
  ]);

  useEffect(() => {
    const timers = dismissalTimers.current;

    const groupedMessages = groupedMessageIds.current;

    const messageGroups = messageGroupKeys.current;

    return () => {
      timers.forEach(timer => {
        window.clearTimeout(timer);
      });

      timers.clear();
      groupedMessages.clear();
      messageGroups.clear();
    };
  }, []);

  const dismissAuthenticationGate = useCallback(() => {
    setAuthenticationRequest(null);
    clearPendingAction();
  }, [clearPendingAction]);

  const navigateToAuthentication = useCallback(
    (route: '/sign-in' | '/sign-up') => {
      const returnTo = authenticationRequest?.action.returnTo ?? getCurrentReturnTo('/store');

      /*
       * Preserve the pending action, but close the
       * current dialog before navigating.
       */
      setAuthenticationRequest(null);

      router.push(buildAuthHref(route, returnTo));
    },
    [authenticationRequest, router]
  );

  const value = useMemo<ActionFeedbackContextValue>(
    () => ({
      success,
      error,
      warning,
      info,
      notify,
      dismiss,
      dismissAll,

      runProtectedAction,
      registerProtectedActionHandler,

      pendingAction,
      clearPendingAction,

      authenticationGateOpen: Boolean(authenticationRequest),

      resumingAction
    }),
    [
      authenticationRequest,
      clearPendingAction,
      dismiss,
      dismissAll,
      error,
      info,
      notify,
      pendingAction,
      registerProtectedActionHandler,
      resumingAction,
      runProtectedAction,
      success,
      warning
    ]
  );

  return (
    <ActionFeedbackContext.Provider value={value}>
      {children}

      <StoreExperienceOnboarding suppressed={Boolean(authenticationRequest)} />

      <AuthenticationGateDialog
        request={authenticationRequest}
        onDismiss={dismissAuthenticationGate}
        onSignIn={() => navigateToAuthentication('/sign-in')}
        onSignUp={() => navigateToAuthentication('/sign-up')}
      />

      <ActionFeedbackViewport messages={messages} onDismiss={dismiss} />
    </ActionFeedbackContext.Provider>
  );
}
