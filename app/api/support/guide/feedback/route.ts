import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  recordSupportKnowledgeFeedback
} from '@/features/support/server/supportKnowledgeRepository';
import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';
import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';
import {
  auth
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0'
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user?.id) {
    return response(
      { error: 'Sign in to give AJ Support Intelligence feedback.' },
      401
    );
  }

  const requestedWorkspaceId =
    request.nextUrl.searchParams.get('workspaceId')?.trim() ||
    request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value ||
    null;
  const workspaceRuntime = await getUserWorkspaces(
    session.user.id,
    requestedWorkspaceId
  );

  if (!workspaceRuntime.activeWorkspace) {
    return response({ error: 'An active workspace is required.' }, 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const interactionId =
      typeof body.interactionId === 'string' ? body.interactionId.trim() : '';

    if (!interactionId || interactionId.length > 180) {
      return response(
        { error: 'A valid AJ Intelligence interaction is required.' },
        400
      );
    }

    if (typeof body.helpful !== 'boolean') {
      return response({ error: 'Helpful feedback must be true or false.' }, 400);
    }

    const reason =
      typeof body.reason === 'string'
        ? body.reason.trim().slice(0, 500) || null
        : null;
    const recorded = await recordSupportKnowledgeFeedback({
      workspaceId: workspaceRuntime.activeWorkspace.id,
      customerId: session.user.id,
      interactionId,
      helpful: body.helpful,
      reason
    });

    return recorded
      ? response({ recorded: true })
      : response(
          { error: 'That AJ Intelligence interaction could not be found.' },
          404
        );
  } catch (cause) {
    return response(
      {
        error:
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not record this feedback.'
      },
      400
    );
  }
}
