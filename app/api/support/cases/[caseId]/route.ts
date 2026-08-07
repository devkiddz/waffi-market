import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  markCommunicationConversationRead
} from '@/features/communication/server/communicationService';
import {
  getCustomerSupportCase
} from '@/features/support/server/supportRepository';
import {
  SupportServiceError,
  confirmSupportResolution,
  sendSupportCaseMessage
} from '@/features/support/server/supportService';
import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';
import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

async function resolveContext(
  request: NextRequest
) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user?.id) {
    return null;
  }

  const requestedWorkspaceId =
    request.nextUrl.searchParams
      .get('workspaceId')
      ?.trim() ||
    request.cookies.get(
      ACTIVE_WORKSPACE_COOKIE
    )?.value ||
    null;

  const runtime = await getUserWorkspaces(
    session.user.id,
    requestedWorkspaceId
  );

  if (!runtime.activeWorkspace) {
    return null;
  }

  return {
    userId: session.user.id,
    workspaceId: runtime.activeWorkspace.id
  };
}

function response(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control':
        'private, no-store, max-age=0'
    }
  });
}

function serviceStatus(
  error: SupportServiceError
) {
  if (error.code === 'INVALID_INPUT') {
    return 400;
  }

  if (error.code === 'ACCESS_DENIED') {
    return 403;
  }

  if (
    error.code === 'CONTEXT_NOT_FOUND' ||
    error.code === 'CASE_NOT_FOUND'
  ) {
    return 404;
  }

  return 409;
}

export async function GET(
  request: NextRequest,
  routeContext: RouteContext
) {
  const context =
    await resolveContext(request);

  if (!context) {
    return response(
      {
        error:
          'Authentication and an active workspace are required.'
      },
      401
    );
  }

  const { caseId } =
    await routeContext.params;
  const supportCase =
    await getCustomerSupportCase(
      caseId,
      context.userId,
      context.workspaceId
    );

  return supportCase
    ? response(supportCase)
    : response(
        {
          error:
            'The Support Case could not be found.'
        },
        404
      );
}

export async function PATCH(
  request: NextRequest,
  routeContext: RouteContext
) {
  try {
    const context =
      await resolveContext(request);

    if (!context) {
      return response(
        {
          error:
            'Authentication and an active workspace are required.'
        },
        401
      );
    }

    const { caseId } =
      await routeContext.params;
    const current =
      await getCustomerSupportCase(
        caseId,
        context.userId,
        context.workspaceId
      );

    if (!current) {
      return response(
        {
          error:
            'The Support Case could not be found.'
        },
        404
      );
    }

    const body =
      (await request.json()) as
        Record<string, unknown>;
    const action = String(
      body.action ?? ''
    );

    if (action === 'mark-read') {
      await markCommunicationConversationRead({
        workspaceId:
          context.workspaceId,
        conversationId:
          current.conversationId,
        userId: context.userId
      });

      return response(
        (await getCustomerSupportCase(
          caseId,
          context.userId,
          context.workspaceId
        ))!
      );
    }

    if (action === 'send') {
      return response(
        await sendSupportCaseMessage({
          workspaceId:
            context.workspaceId,
          caseId,
          senderUserId:
            context.userId,
          body: String(body.body ?? '')
        })
      );
    }

    if (
      action ===
      'confirm-resolution'
    ) {
      return response(
        await confirmSupportResolution({
          workspaceId:
            context.workspaceId,
          caseId,
          customerId:
            context.userId,
          confirmed:
            body.confirmed === true,
          note:
            body.note === undefined
              ? null
              : String(body.note)
        })
      );
    }

    return response(
      {
        error:
          'Unsupported Support action.'
      },
      400
    );
  } catch (error) {
    if (
      error instanceof
      SupportServiceError
    ) {
      return response(
        {
          error: error.message,
          code: error.code
        },
        serviceStatus(error)
      );
    }

    console.error(
      'Customer Support update failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not update the Support Case.'
      },
      500
    );
  }
}
