'use client';

import type { ReactNode } from 'react';

import { useWorkspace } from '@/features/workspace';
import { useIdentity } from '@/providers/IdentityProvider';

import { ShoppingListProvider } from './ShoppingListProvider';

type ShoppingListRuntimeProviderProps = {
  children: ReactNode;
};

export function ShoppingListRuntimeProvider({ children }: ShoppingListRuntimeProviderProps) {
  const { activeWorkspace, loading } = useWorkspace();
  const { isAuthenticated, isPending } = useIdentity();

  /*
   * Do not mount the database-backed Shopping List provider
   * while the workspace runtime is still resolving.
   */
  if (loading || isPending || !activeWorkspace || !isAuthenticated) {
    return children;
  }

  /*
   * Guest users currently receive the local guest workspace.
   * Shopping Lists are customer-owned database records, so we
   * leave the action unavailable until the user signs in.
   */
  if (activeWorkspace.id === 'guest-live') {
    return children;
  }

  return <ShoppingListProvider workspaceId={activeWorkspace.id}>{children}</ShoppingListProvider>;
}
