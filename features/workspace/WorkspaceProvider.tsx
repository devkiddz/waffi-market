'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { resolveCommerceCapabilities } from '@/features/commerce-mode';

import type { Workspace, WorkspaceRuntime } from './workspaceTypes';

type WorkspaceContextValue = WorkspaceRuntime & {
  loading: boolean;

  refreshWorkspaces: () => Promise<void>;

  switchWorkspace: (workspaceId: string) => Promise<void>;
};

type WorkspaceProviderProps = {
  children: ReactNode;
};

const defaultRuntime: WorkspaceRuntime = {
  activeWorkspace: null,
  availableWorkspaces: [],

  isLive: false,
  isDemo: false,
  isPractice: false,
  isSandbox: false,

  switchingWorkspace: false,
  error: null
};

const guestWorkspace: Workspace = {
  id: 'guest-live',
  slug: 'aj-logik-guest',
  name: 'Shelsea',

  mode: 'LIVE',
  commerceMode: 'SINGLE_MERCHANT',
  commerceCapabilities: resolveCommerceCapabilities('SINGLE_MERCHANT'),
  vendorApplicationsOpen: false,
  currency: 'NGN',
  timezone: 'Africa/Lagos',

  active: true,
  resettable: false,

  membership: {
    role: 'MEMBER',
    active: true
  },

  wallet: null
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

async function readJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? 'Workspace request failed.');
  }

  return data;
}

function createGuestRuntime(): WorkspaceRuntime {
  return {
    activeWorkspace: guestWorkspace,
    availableWorkspaces: [guestWorkspace],

    isLive: true,
    isDemo: false,
    isPractice: false,
    isSandbox: false,

    switchingWorkspace: false,
    error: null
  };
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const router = useRouter();

  const [runtime, setRuntime] = useState<WorkspaceRuntime>(defaultRuntime);

  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (response.status === 401) {
        setRuntime(createGuestRuntime());

        return;
      }

      const serverRuntime = await readJsonResponse<WorkspaceRuntime>(response);

      setRuntime(serverRuntime);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load Shelsea.';

      setRuntime(current => ({
        ...current,
        switchingWorkspace: false,
        error: message
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const nextWorkspace = runtime.availableWorkspaces.find(workspace => workspace.id === workspaceId);

      if (!nextWorkspace) {
        setRuntime(current => ({
          ...current,
          error: 'The selected workspace is unavailable.'
        }));

        return;
      }

      if (nextWorkspace.id === runtime.activeWorkspace?.id) {
        return;
      }

      setRuntime(current => ({
        ...current,
        switchingWorkspace: true,
        error: null
      }));

      try {
        const response = await fetch('/api/workspaces', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            workspaceId
          })
        });

        const serverRuntime = await readJsonResponse<WorkspaceRuntime>(response);

        setRuntime(serverRuntime);

        window.dispatchEvent(
          new CustomEvent('aj:workspace-switched', {
            detail: {
              workspaceId: serverRuntime.activeWorkspace?.id ?? workspaceId,

              mode: serverRuntime.activeWorkspace?.mode ?? nextWorkspace.mode
            }
          })
        );

        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to switch workspace.';

        setRuntime(current => ({
          ...current,
          switchingWorkspace: false,
          error: message
        }));
      }
    },
    [router, runtime.activeWorkspace?.id, runtime.availableWorkspaces]
  );

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...runtime,

      loading,

      refreshWorkspaces,
      switchWorkspace
    }),
    [runtime, loading, refreshWorkspaces, switchWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider.');
  }

  return context;
}
