import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getCustomerQuickSupportSummary
} from '@/features/support/server/quickSupportSummaryRepository';

import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';

import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';

import {
  auth
} from '@/lib/auth';

export const dynamic =
  'force-dynamic';

export const revalidate =
  0;

async function resolveContext(
  request: NextRequest
) {
  const session =
    await auth.api.getSession({
      headers:
        request.headers
    });

  if (
    !session?.user?.id
  ) {
    return null;
  }

  const requestedWorkspaceId =
    request.nextUrl
      .searchParams
      .get(
        'workspaceId'
      )
      ?.trim() ||
    request.cookies.get(
      ACTIVE_WORKSPACE_COOKIE
    )?.value ||
    null;

  const runtime =
    await getUserWorkspaces(
      session.user.id,
      requestedWorkspaceId
    );

  if (
    !runtime.activeWorkspace
  ) {
    return null;
  }

  return {
    userId:
      session.user.id,
    workspaceId:
      runtime.activeWorkspace.id
  };
}

function response(
  data: unknown,
  status = 200
) {
  return NextResponse.json(
    data,
    {
      status,
      headers: {
        'Cache-Control':
          'private, no-store, max-age=0'
      }
    }
  );
}

export async function GET(
  request: NextRequest
) {
  const context =
    await resolveContext(
      request
    );

  if (!context) {
    return response(
      {
        error:
          'Authentication and an active workspace are required.'
      },
      401
    );
  }

  try {
    return response(
      await getCustomerQuickSupportSummary(
        context.userId,
        context.workspaceId
      )
    );
  } catch (cause) {
    console.error(
      'Quick Support summary failed.',
      cause
    );

    return response(
      {
        error:
          'Shelsea could not prepare Quick Support continuity.'
      },
      500
    );
  }
}
