import { cookies, headers } from 'next/headers';

import { redirect } from 'next/navigation';

import {
  CustomerDashboard,
  CustomerDashboardProvider,
  getCustomerDashboardData,
  resolveCustomerDashboard
} from '@/features/customer-dashboard';

import { ShoppingListProvider } from '@/features/shopping-lists/client';

import { ACTIVE_WORKSPACE_COOKIE } from '@/features/workspace/workspaceConstants';

import { getUserWorkspaces } from '@/features/workspace/services/get-user-workspaces';

import { auth } from '@/lib/auth';

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user?.id) {
    redirect('/sign-in?returnTo=%2Faccount');
  }

  const cookieStore = await cookies();

  const preferredWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;

  const workspaceRuntime = await getUserWorkspaces(session.user.id, preferredWorkspaceId);

  const activeWorkspace = workspaceRuntime.activeWorkspace;

  if (!activeWorkspace) {
    throw new Error('Shelsea could not resolve an active workspace for this dashboard.');
  }

  const dashboardData = await getCustomerDashboardData(session.user.id, activeWorkspace);

  const resolvedDashboard = resolveCustomerDashboard(dashboardData);

  return (
    <CustomerDashboardProvider initialDashboard={resolvedDashboard}>
      <ShoppingListProvider workspaceId={activeWorkspace.id}>
        <CustomerDashboard />
      </ShoppingListProvider>
    </CustomerDashboardProvider>
  );
}
