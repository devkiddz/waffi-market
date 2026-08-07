import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getAdminApiAccess
} from '@/features/admin/auth/adminPermissions';
import {
  SupportKnowledgeManagementError,
  mutateSupportKnowledgeEntry
} from '@/features/support/server/supportKnowledgeManagementService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    entryId: string;
  }>;
};

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0'
    }
  });
}

function errorStatus(error: SupportKnowledgeManagementError) {
  if (error.code === 'NOT_FOUND') return 404;
  if (error.code === 'CONFLICT') return 409;
  return 400;
}

export async function PATCH(
  request: NextRequest,
  routeContext: RouteContext
) {
  try {
    const access = await getAdminApiAccess(request.headers);

    if (!access || !access.permissions.has('support:configure')) {
      return response(
        { error: 'Support configuration permission is required.' },
        403
      );
    }

    const { entryId } = await routeContext.params;

    return response(
      await mutateSupportKnowledgeEntry({
        workspaceId: access.membership.workspace.id,
        actorId: access.actor.id,
        entryId,
        payload: await request.json()
      })
    );
  } catch (cause) {
    if (cause instanceof SupportKnowledgeManagementError) {
      return response(
        { error: cause.message, code: cause.code },
        errorStatus(cause)
      );
    }

    return response(
      { error: 'Shelsea could not update Support Knowledge.' },
      500
    );
  }
}
