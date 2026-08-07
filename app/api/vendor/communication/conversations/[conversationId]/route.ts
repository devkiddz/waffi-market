import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getCommunicationConversationForVendor
} from '@/features/communication/server/communicationRepository';
import {
  CommunicationServiceError,
  markCommunicationConversationRead,
  sendCommunicationMessage
} from '@/features/communication/server/communicationService';
import {
  getVendorApiAccess
} from '@/features/vendor/auth/vendorAccess';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

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

async function resolveAccess(
  request: NextRequest
) {
  const access =
    await getVendorApiAccess(
      request.headers
    );

  if (
    !access ||
    !access.permissions.has(
      'communication:view'
    )
  ) {
    return null;
  }

  return access;
}

export async function GET(
  request: NextRequest,
  routeContext: RouteContext
) {
  const access =
    await resolveAccess(request);

  if (!access) {
    return response(
      {
        error:
          'Vendor communication access is required.'
      },
      403
    );
  }

  const { conversationId } =
    await routeContext.params;

  const conversation =
    await getCommunicationConversationForVendor(
      conversationId,
      access.vendor.id,
      access.workspace.id
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
    const access =
      await resolveAccess(request);

    if (!access) {
      return response(
        {
          error:
            'Vendor communication access is required.'
        },
        403
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
            access.workspace.id,
          conversationId,
          userId:
            access.session.user.id
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
        await getCommunicationConversationForVendor(
          conversationId,
          access.vendor.id,
          access.workspace.id
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
      if (
        !access.permissions.has(
          'communication:reply'
        )
      ) {
        return response(
          {
            error:
              'Vendor reply permission is required.'
          },
          403
        );
      }

      return response(
        await sendCommunicationMessage({
          workspaceId:
            access.workspace.id,
          conversationId,
          senderUserId:
            access.session.user.id,
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
      'Vendor conversation update failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not update the vendor conversation.'
      },
      500
    );
  }
}
