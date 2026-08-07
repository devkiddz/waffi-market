import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getCommunicationConversationForUser
} from '@/features/communication/server/communicationRepository';
import {
  CommunicationServiceError,
  markCommunicationConversationRead,
  sendCommunicationMessage
} from '@/features/communication/server/communicationService';
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
    conversationId: string;
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
  error: CommunicationServiceError
) {
  if (error.code === 'INVALID_INPUT') {
    return 400;
  }

  if (error.code === 'ACCESS_DENIED') {
    return 403;
  }

  if (
    error.code === 'CONTEXT_NOT_FOUND' ||
    error.code ===
      'CONVERSATION_NOT_FOUND'
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

  const { conversationId } =
    await routeContext.params;

  const conversation =
    await getCommunicationConversationForUser(
      conversationId,
      context.userId,
      context.workspaceId
    );

  if (!conversation) {
    return response(
      {
        error:
          'The conversation could not be found.'
      },
      404
    );
  }

  return response(conversation);
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

    const { conversationId } =
      await routeContext.params;
    const body =
      (await request.json()) as
        Record<string, unknown>;
    const action = String(
      body.action ?? ''
    );

    if (action === 'mark-read') {
      const marked =
        await markCommunicationConversationRead({
          workspaceId:
            context.workspaceId,
          conversationId,
          userId: context.userId
        });

      if (!marked) {
        return response(
          {
            error:
              'The conversation could not be found.'
          },
          404
        );
      }

      const conversation =
        await getCommunicationConversationForUser(
          conversationId,
          context.userId,
          context.workspaceId
        );

      return conversation
        ? response(conversation)
        : response(
            {
              error:
                'The conversation could not be reloaded.'
            },
            404
          );
    }

    if (action === 'send') {
      return response(
        await sendCommunicationMessage({
          workspaceId:
            context.workspaceId,
          conversationId,
          senderUserId: context.userId,
          body: String(body.body ?? ''),
          replyToMessageId:
            body.replyToMessageId ===
            undefined
              ? null
              : String(
                  body.replyToMessageId
                )
        })
      );
    }

    return response(
      {
        error:
          'Unsupported conversation action.'
      },
      400
    );
  } catch (error) {
    if (
      error instanceof
      CommunicationServiceError
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
      'Customer conversation update failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not update the conversation.'
      },
      500
    );
  }
}
