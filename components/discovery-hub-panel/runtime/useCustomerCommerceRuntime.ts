'use client';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import type {
  CommerceOrder
} from '@/features/customer-dashboard';

import {
  useWorkspace
} from '@/features/workspace';

import {
  useIdentity
} from '@/providers/IdentityProvider';

export type CustomerCommerceRuntime = {
  workspaceId: string;
  generatedAt: string;

  pulse: {
    paidOrderCount: number;
    activeOrderCount: number;
    deliveredOrderCount: number;
  };

  orders: CommerceOrder[];
};

type RuntimeState = {
  data:
    | CustomerCommerceRuntime
    | null;

  loading: boolean;
  error:
    | string
    | null;
};

const runtimeCache =
  new Map<
    string,
    CustomerCommerceRuntime
  >();

const runtimeRequests =
  new Map<
    string,
    Promise<CustomerCommerceRuntime>
  >();

async function requestRuntime(
  workspaceId: string,
  force = false
): Promise<CustomerCommerceRuntime> {
  if (
    !force
  ) {
    const cached =
      runtimeCache.get(
        workspaceId
      );

    if (cached) {
      return cached;
    }

    const pending =
      runtimeRequests.get(
        workspaceId
      );

    if (pending) {
      return pending;
    }
  }

  const request =
    fetch(
      `/api/customer-commerce-runtime?workspaceId=${encodeURIComponent(
        workspaceId
      )}`,
      {
        cache:
          'no-store',

        credentials:
          'same-origin'
      }
    ).then(
      async response => {
        const payload:
          | (Partial<CustomerCommerceRuntime> & {
              error?: string;
            })
          | null =
          await response
            .json()
            .catch(
              () =>
                null
            );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ??
              'Customer commerce activity could not be loaded.'
          );
        }

        if (
          !payload ||
          typeof payload.workspaceId !==
            'string' ||
          !Array.isArray(
            payload.orders
          )
        ) {
          throw new Error(
            'Shelsea returned an invalid customer commerce response.'
          );
        }

        const runtime =
          payload as CustomerCommerceRuntime;

        runtimeCache.set(
          workspaceId,
          runtime
        );

        return runtime;
      }
    ).finally(
      () => {
        runtimeRequests.delete(
          workspaceId
        );
      }
    );

  runtimeRequests.set(
    workspaceId,
    request
  );

  return request;
}

export function useCustomerCommerceRuntime() {
  const {
    activeWorkspace,
    loading:
      workspaceLoading
  } = useWorkspace();

  const {
    isAuthenticated,
    isPending:
      identityPending
  } = useIdentity();

  const workspaceId =
    activeWorkspace?.id ??
    null;

  const [
    state,
    setState
  ] =
    useState<RuntimeState>({
      data:
        null,

      loading:
        true,

      error:
        null
    });

  const load =
    useCallback(
      async (
        force = false
      ) => {
        if (
          identityPending ||
          workspaceLoading
        ) {
          return;
        }

        if (
          !isAuthenticated ||
          !workspaceId ||
          workspaceId ===
            'guest-live'
        ) {
          setState({
            data:
              null,

            loading:
              false,

            error:
              null
          });

          return;
        }

        setState(
          current => ({
            ...current,
            loading:
              true,
            error:
              null
          })
        );

        try {
          const data =
            await requestRuntime(
              workspaceId,
              force
            );

          setState({
            data,
            loading:
              false,
            error:
              null
          });
        } catch (
          error
        ) {
          setState({
            data:
              null,

            loading:
              false,

            error:
              error instanceof
              Error
                ? error.message
                : 'Customer commerce activity could not be loaded.'
          });
        }
      },
      [
        identityPending,
        isAuthenticated,
        workspaceId,
        workspaceLoading
      ]
    );

  useEffect(() => {
    void load();
  }, [
    load
  ]);

  useEffect(() => {
    const refresh =
      () => {
        void load(
          true
        );
      };

    window.addEventListener(
      'rcentz:order-updated',
      refresh
    );

    window.addEventListener(
      'rcentz:delivery-updated',
      refresh
    );

    window.addEventListener(
      'rcentz:checkout-completed',
      refresh
    );

    return () => {
      window.removeEventListener(
        'rcentz:order-updated',
        refresh
      );

      window.removeEventListener(
        'rcentz:delivery-updated',
        refresh
      );

      window.removeEventListener(
        'rcentz:checkout-completed',
        refresh
      );
    };
  }, [
    load
  ]);

  return {
    ...state,

    signedOut:
      !identityPending &&
      !isAuthenticated,

    refresh:
      () =>
        load(
          true
        )
  };
}
