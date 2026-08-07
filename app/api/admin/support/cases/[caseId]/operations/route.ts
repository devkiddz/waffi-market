import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getAdminApiAccess
} from '@/features/admin/auth/adminPermissions';
import {
  SUPPORT_COMMERCE_ACTION_TYPES
} from '@/features/support/supportOperationsTypes';
import {
  getSupportOperationsSnapshot
} from '@/features/support/server/supportOperationsRepository';
import {
  SupportOperationsError,
  prepareSupportCommerceAction,
  reviewSupportCommerceAction
} from '@/features/support/server/supportOperationsService';
import type {
  SupportCommerceActionType
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

function errorStatus(
  error: SupportOperationsError
) {
  if (error.code === 'INVALID_INPUT') {
    return 400;
  }

  if (
    error.code === 'CASE_NOT_FOUND' ||
    error.code === 'ACTION_NOT_FOUND' ||
    error.code === 'CONTEXT_REQUIRED'
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
  const snapshot =
    await getSupportOperationsSnapshot(
      caseId,
      access.membership.workspace.id
    );

  return snapshot
    ? response(snapshot)
    : response(
        {
          error:
            'The Support Case could not be found.'
        },
        404
      );
}

export async function POST(
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
    const body =
      (await request.json()) as
        Record<string, unknown>;
    const action = String(
      body.action ?? ''
    );
    const workspaceId =
      access.membership.workspace.id;

    if (action === 'prepare') {
      const type = String(
        body.type ?? ''
      );

      if (
        !access.permissions.has(
          'support:commerce:prepare'
        ) ||
        !SUPPORT_COMMERCE_ACTION_TYPES.some(
          value => value === type
        )
      ) {
        return response(
          {
            error:
              'Commerce-action preparation permission is required.'
          },
          403
        );
      }

      return response(
        await prepareSupportCommerceAction({
          workspaceId,
          caseId,
          requestedById:
            access.actor.id,
          type:
            type as
              SupportCommerceActionType,
          reason: String(
            body.reason ?? ''
          ),
          requestedAmount:
            body.requestedAmount ===
              null ||
            body.requestedAmount ===
              undefined ||
            body.requestedAmount === ''
              ? null
              : Number(
                  body.requestedAmount
                )
        })
      );
    }

    if (
      action === 'approve' ||
      action === 'reject'
    ) {
      if (
        !access.permissions.has(
          'support:commerce:approve'
        )
      ) {
        return response(
          {
            error:
              'Commerce-action approval permission is required.'
          },
          403
        );
      }

      return response(
        await reviewSupportCommerceAction({
          workspaceId,
          caseId,
          actionId: String(
            body.actionId ?? ''
          ),
          reviewedById:
            access.actor.id,
          decision:
            action === 'approve'
              ? 'APPROVE'
              : 'REJECT',
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
          'Unsupported Support operations action.'
      },
      400
    );
  } catch (error) {
    if (
      error instanceof
      SupportOperationsError
    ) {
      return response(
        {
          error: error.message,
          code: error.code
        },
        errorStatus(error)
      );
    }

    console.error(
      'Support operations update failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not update Support operations.'
      },
      500
    );
  }
}
