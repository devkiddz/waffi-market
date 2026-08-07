import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ACTIVE_WORKSPACE_COOKIE } from '@/features/workspace/workspaceConstants';
import { getUserWorkspaces } from '@/features/workspace/services/get-user-workspaces';
import { auth } from '@/lib/auth';

export async function resolveShoppingListWorkspace(returnTo: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const cookieStore = await cookies();
  const preferredWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
  const runtime = await getUserWorkspaces(session.user.id, preferredWorkspaceId);

  if (!runtime.activeWorkspace) {
    throw new Error('Shelsea could not resolve an active workspace for Shopping Lists.');
  }

  return {
    userId: session.user.id,
    workspace: runtime.activeWorkspace
  };
}
