import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getAdminApiAccess
} from '@/features/admin/auth/adminPermissions';

import {
  markCommunicationConversationRead
} from '@/features/communication/server/communicationService';
import {
  getAgentSupportCase
} from '@/features/support/server/supportRepository';
import {
  SupportServiceError,
  addSupportInternalNote,
  assignSupportCase,
  changeSupportCaseStatus,
  escalateSupportCase,
  proposeSupportResolution,
  sendSupportCaseMessage
} from '@/features/support/server/supportService';
import {
  SUPPORT_CASE_PRIORITIES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_RESOLUTION_TYPES
} from '@/features/support';
import type {
  SupportCasePriority,
  SupportCaseStatus,
  SupportResolutionType
} from '@/lib/generated/prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    caseId: string;
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
  const access =
    await getAdminApiAccess(
      request.headers
    );

  if (
    !access ||
    !access.permissions.has(
      'support:view'
    )
  ) {
    return response(
      {
        error:
          'Support access is required.'
      },
      403
    );
  }

  const { caseId } =
    await routeContext.params;
  const supportCase =
    await getAgentSupportCase(
      caseId,
      access.membership.workspace.id
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
    const access =
      await getAdminApiAccess(
        request.headers
      );

    if (
      !access ||
      !access.permissions.has(
        'support:view'
      )
    ) {
      return response(
        {
          error:
            'Support access is required.'
        },
        403
      );
    }

    const { caseId } =
      await routeContext.params;
    const workspaceId =
      access.membership.workspace.id;
    const body =
      (await request.json()) as
        Record<string, unknown>;
    const action = String(
      body.action ?? ''
    );

    if (
      action === 'mark-read'
    ) {
      const current =
        await getAgentSupportCase(
          caseId,
          workspaceId
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

      await markCommunicationConversationRead({
        workspaceId,
        conversationId:
          current.conversationId,
        userId:
          access.actor.id
      });

      return response(
        (await getAgentSupportCase(
          caseId,
          workspaceId
        ))!
      );
    }

    if (action === 'refresh') {
      const supportCase =
        await getAgentSupportCase(
          caseId,
          workspaceId
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

    if (action === 'assign') {
      if (
        !access.permissions.has(
          'support:assign'
        )
      ) {
        return response(
          {
            error:
              'Support assignment permission is required.'
          },
          403
        );
      }

      return response(
        await assignSupportCase({
          workspaceId,
          caseId,
          agentId: String(
            body.agentId ??
              access.actor.id
          ),
          assignedById:
            access.actor.id,
          reason:
            body.reason === undefined
              ? null
              : String(body.reason)
        })
      );
    }

    if (action === 'send') {
      if (
        !access.permissions.has(
          'support:reply'
        )
      ) {
        return response(
          {
            error:
              'Support reply permission is required.'
          },
          403
        );
      }

      return response(
        await sendSupportCaseMessage({
          workspaceId,
          caseId,
          senderUserId:
            access.actor.id,
          body: String(body.body ?? '')
        })
      );
    }

    if (action === 'note') {
      if (
        !access.permissions.has(
          'support:reply'
        )
      ) {
        return response(
          {
            error:
              'Support note permission is required.'
          },
          403
        );
      }

      return response(
        await addSupportInternalNote({
          workspaceId,
          caseId,
          authorId: access.actor.id,
          body: String(body.body ?? '')
        })
      );
    }

    if (action === 'status') {
      const status = String(
        body.status ?? ''
      );

      if (
        !access.permissions.has(
          'support:resolve'
        ) ||
        !SUPPORT_CASE_STATUSES.some(
          value => value === status
        )
      ) {
        return response(
          {
            error:
              'A permitted Support status is required.'
          },
          403
        );
      }

      return response(
        await changeSupportCaseStatus({
          workspaceId,
          caseId,
          actorId: access.actor.id,
          status:
            status as SupportCaseStatus,
          note:
            body.note === undefined
              ? null
              : String(body.note)
        })
      );
    }

    if (action === 'escalate') {
      const priority = String(
        body.priority ?? ''
      );

      if (
        !access.permissions.has(
          'support:escalate'
        ) ||
        !SUPPORT_CASE_PRIORITIES.some(
          value => value === priority
        )
      ) {
        return response(
          {
            error:
              'Support escalation permission is required.'
          },
          403
        );
      }

      return response(
        await escalateSupportCase({
          workspaceId,
          caseId,
          actorId: access.actor.id,
          priority:
            priority as SupportCasePriority,
          reason: String(
            body.reason ?? ''
          )
        })
      );
    }

    if (action === 'resolution') {
      const type = String(
        body.type ?? ''
      );

      if (
        !access.permissions.has(
          'support:resolve'
        ) ||
        !SUPPORT_RESOLUTION_TYPES.some(
          value => value === type
        )
      ) {
        return response(
          {
            error:
              'Support resolution permission is required.'
          },
          403
        );
      }

      return response(
        await proposeSupportResolution({
          workspaceId,
          caseId,
          proposedById:
            access.actor.id,
          type:
            type as SupportResolutionType,
          summary: String(
            body.summary ?? ''
          )
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
      'Admin Support update failed.',
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
