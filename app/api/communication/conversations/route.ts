import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getCustomerCommunicationInbox
} from '@/features/communication/server/communicationRepository';
import {
  CommunicationServiceError,
  createCustomerVendorConversation
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
  request: NextRequest
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

    const requested = Number.parseInt(
      request.nextUrl.searchParams.get(
        'limit'
      ) ?? '100',
      10
    );

    return response(
      await getCustomerCommunicationInbox(
        context.userId,
        context.workspaceId,
        Number.isFinite(requested)
          ? Math.min(
              100,
              Math.max(1, requested)
            )
          : 100
      )
    );
  } catch (error) {
    console.error(
      'Customer conversation list failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not load the Inbox.'
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
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

    const body =
      (await request.json()) as
        Record<string, unknown>;

    const conversation =
      await createCustomerVendorConversation({
        workspaceId: context.workspaceId,
        customerId: context.userId,
        vendorProfileId: String(
          body.vendorProfileId ?? ''
        ),
        subject:
          body.subject === undefined
            ? null
            : String(body.subject),
        message: String(body.message ?? ''),
        orderId:
          body.orderId === undefined
            ? null
            : String(body.orderId),
        productId:
          body.productId === undefined
            ? null
            : String(body.productId),
        source:
          body.source === undefined
            ? 'CUSTOMER_INBOX'
            : String(body.source)
      });

    return response(conversation, 201);
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
      'Customer conversation creation failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not start the conversation.'
      },
      500
    );
  }
}
