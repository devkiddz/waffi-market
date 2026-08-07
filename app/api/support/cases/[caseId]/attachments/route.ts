import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';

import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';

import {
  auth
} from '@/lib/auth';

import {
  sendCustomerSupportAttachment,
  SupportAttachmentError
} from '@/features/support/server/supportAttachmentService';

export const dynamic =
  'force-dynamic';

export const revalidate =
  0;

export const runtime =
  'nodejs';

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

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

  const runtimeState =
    await getUserWorkspaces(
      session.user.id,
      requestedWorkspaceId
    );

  if (
    !runtimeState.activeWorkspace
  ) {
    return null;
  }

  return {
    userId:
      session.user.id,
    workspaceId:
      runtimeState
        .activeWorkspace
        .id
  };
}

export async function POST(
  request: NextRequest,
  routeContext: RouteContext
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
    const {
      caseId
    } =
      await routeContext.params;

    const form =
      await request.formData();

    const file =
      form.get(
        'file'
      );

    if (
      !(file instanceof File)
    ) {
      return response(
        {
          error:
            'Select a valid attachment.'
        },
        400
      );
    }

    return response(
      await sendCustomerSupportAttachment({
        workspaceId:
          context.workspaceId,
        caseId,
        customerId:
          context.userId,
        file,
        body:
          typeof form.get('body') ===
          'string'
            ? String(
                form.get('body')
              )
            : null
      }),
      201
    );
  } catch (cause) {
    if (
      cause instanceof
      SupportAttachmentError
    ) {
      return response(
        {
          error:
            cause.message
        },
        cause.status
      );
    }

    console.error(
      'Support attachment upload failed.',
      cause
    );

    return response(
      {
        error:
          'Shelsea could not upload this attachment.'
      },
      500
    );
  }
}
