'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import { useActionFeedback } from '@/features/action-feedback';

import type {
  ShoppingList,
  ShoppingListMutationResponse,
  ShoppingListPublicationAction
} from '../shoppingListTypes';

import {
  addShoppingListItem,
  archiveShoppingList,
  createShoppingList,
  getShoppingLists,
  removeShoppingListItem,
  ShoppingListRequestError,
  updateShoppingList,
  updateShoppingListItem,
  updateShoppingListPublication,
  type AddShoppingListItemInput,
  type CreateShoppingListInput,
  type UpdateShoppingListInput,
  type UpdateShoppingListItemInput
} from './shoppingListService';

type ShoppingListContextValue = {
  lists: ShoppingList[];

  loading: boolean;
  mutating: boolean;

  error: string | null;

  refresh: () => Promise<void>;

  createList: (input: Omit<CreateShoppingListInput, 'workspaceId'>) => Promise<ShoppingListMutationResponse>;

  updateList: (
    listId: string,
    input: Omit<UpdateShoppingListInput, 'workspaceId'>
  ) => Promise<ShoppingListMutationResponse>;

  setPublication: (
    listId: string,
    action: ShoppingListPublicationAction
  ) => Promise<ShoppingListMutationResponse>;

  archiveList: (listId: string) => Promise<ShoppingListMutationResponse>;

  addItem: (
    listId: string,
    input: Omit<AddShoppingListItemInput, 'workspaceId'>
  ) => Promise<ShoppingListMutationResponse>;

  updateItem: (
    listId: string,
    itemId: string,
    input: Omit<UpdateShoppingListItemInput, 'workspaceId'>
  ) => Promise<ShoppingListMutationResponse>;

  removeItem: (listId: string, itemId: string) => Promise<ShoppingListMutationResponse>;
};

type ShoppingListProviderProps = {
  workspaceId: string | null;
  children: ReactNode;
};

type MutationFeedback = {
  successTitle: string;
  successDescription?: string | ((response: ShoppingListMutationResponse) => string | undefined);
  errorTitle: string;
  groupKey?: string;
};

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete the shopping list request.';
}

export function ShoppingListProvider({ workspaceId, children }: ShoppingListProviderProps) {
  const feedback = useActionFeedback();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyMutation = useCallback((response: ShoppingListMutationResponse) => {
    setLists(response.lists);
    setError(null);

    return response;
  }, []);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setLists([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLists(await getShoppingLists(workspaceId));
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setLists([]);
      setError(message);
      if (!(requestError instanceof ShoppingListRequestError && requestError.status === 401)) {
        feedback.error({
          title: 'Shopping plans unavailable',
          description: message,
          groupKey: 'shopping-lists:load'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [feedback, workspaceId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) void refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const runMutation = useCallback(
    async (
      operation: () => Promise<ShoppingListMutationResponse>,
      notice: MutationFeedback
    ) => {
      setMutating(true);
      setError(null);

      try {
        const response = applyMutation(await operation());
        const description =
          typeof notice.successDescription === 'function'
            ? notice.successDescription(response)
            : notice.successDescription;

        feedback.success({
          title: notice.successTitle,
          ...(description ? { description } : {}),
          ...(notice.groupKey ? { groupKey: notice.groupKey } : {})
        });

        return response;
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);

        feedback.error({
          title: notice.errorTitle,
          description: message,
          ...(notice.groupKey ? { groupKey: notice.groupKey } : {})
        });

        throw requestError;
      } finally {
        setMutating(false);
      }
    },
    [applyMutation, feedback]
  );

  const requireWorkspaceId = useCallback(() => {
    if (!workspaceId) throw new Error('No active workspace is available.');
    return workspaceId;
  }, [workspaceId]);

  const createList = useCallback(
    (input: Omit<CreateShoppingListInput, 'workspaceId'>) =>
      runMutation(
        () => createShoppingList({ ...input, workspaceId: requireWorkspaceId() }),
        {
          successTitle: 'Shopping list created',
          successDescription: response => response.affectedList
            ? `${response.affectedList.name} is ready for products.`
            : 'Your shopping plan is ready.',
          errorTitle: 'List could not be created',
          groupKey: 'shopping-list:create'
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const updateList = useCallback(
    (listId: string, input: Omit<UpdateShoppingListInput, 'workspaceId'>) =>
      runMutation(
        () => updateShoppingList(listId, { ...input, workspaceId: requireWorkspaceId() }),
        {
          successTitle: 'Shopping list saved',
          successDescription: response => response.affectedList
            ? `${response.affectedList.name} has been updated.`
            : 'Your changes were saved.',
          errorTitle: 'Changes were not saved',
          groupKey: `shopping-list:${listId}:save`
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const setPublication = useCallback(
    (listId: string, action: ShoppingListPublicationAction) =>
      runMutation(
        () => updateShoppingListPublication(listId, {
          workspaceId: requireWorkspaceId(),
          action
        }),
        action === 'SUBMIT'
          ? {
              successTitle: 'Submitted for approval',
              successDescription: 'The list remains private to the Store until an administrator approves it.',
              errorTitle: 'Publication request unsuccessful',
              groupKey: `shopping-list:${listId}:publication`
            }
          : {
              successTitle: 'List made private',
              successDescription: 'The public request has been withdrawn and the list is visible only to you.',
              errorTitle: 'Privacy change unsuccessful',
              groupKey: `shopping-list:${listId}:publication`
            }
      ),
    [requireWorkspaceId, runMutation]
  );

  const archiveList = useCallback(
    (listId: string) =>
      runMutation(
        () => archiveShoppingList(listId, requireWorkspaceId()),
        {
          successTitle: 'Shopping list archived',
          successDescription: 'The list has been removed from your active plans.',
          errorTitle: 'List could not be archived',
          groupKey: `shopping-list:${listId}:archive`
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const addItem = useCallback(
    (listId: string, input: Omit<AddShoppingListItemInput, 'workspaceId'>) =>
      runMutation(
        () => addShoppingListItem(listId, { ...input, workspaceId: requireWorkspaceId() }),
        {
          successTitle: 'Product saved to list',
          successDescription: response => {
            const productName = response.affectedItem?.product.name;
            const listName = response.affectedList?.name;
            return productName && listName ? `${productName} is now in ${listName}.` : 'The product was added to your plan.';
          },
          errorTitle: 'Product was not saved',
          groupKey: `shopping-list:${listId}:items`
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const updateItem = useCallback(
    (listId: string, itemId: string, input: Omit<UpdateShoppingListItemInput, 'workspaceId'>) =>
      runMutation(
        () => updateShoppingListItem(listId, itemId, { ...input, workspaceId: requireWorkspaceId() }),
        {
          successTitle: 'Planned quantity saved',
          successDescription: 'Your shopping list has been updated.',
          errorTitle: 'Item change was not saved',
          groupKey: `shopping-list-item:${itemId}`
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const removeItem = useCallback(
    (listId: string, itemId: string) =>
      runMutation(
        () => removeShoppingListItem(listId, itemId, requireWorkspaceId()),
        {
          successTitle: 'Product removed from list',
          successDescription: 'Your shopping plan has been updated.',
          errorTitle: 'Product could not be removed',
          groupKey: `shopping-list-item:${itemId}`
        }
      ),
    [requireWorkspaceId, runMutation]
  );

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      lists,
      loading,
      mutating,
      error,
      refresh,
      createList,
      updateList,
      setPublication,
      archiveList,
      addItem,
      updateItem,
      removeItem
    }),
    [
      lists,
      loading,
      mutating,
      error,
      refresh,
      createList,
      updateList,
      setPublication,
      archiveList,
      addItem,
      updateItem,
      removeItem
    ]
  );

  return <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>;
}

export function useOptionalShoppingLists(): ShoppingListContextValue | null {
  return useContext(ShoppingListContext);
}

export function useShoppingLists(): ShoppingListContextValue {
  const context = useContext(ShoppingListContext);

  if (!context) throw new Error('useShoppingLists must be used inside ShoppingListProvider.');

  return context;
}
