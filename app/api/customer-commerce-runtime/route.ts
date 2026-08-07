import {
  cookies,
  headers
} from 'next/headers';

import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getCustomerDashboardData
} from '@/features/customer-dashboard';

import {
  ACTIVE_WORKSPACE_COOKIE
} from '@/features/workspace/workspaceConstants';

import {
  getUserWorkspaces
} from '@/features/workspace/services/get-user-workspaces';

import {
  auth
} from '@/lib/auth';

export const dynamic =
  'force-dynamic';

export const revalidate =
  0;

export async function GET(
  request: NextRequest
) {
  try {
    const session =
      await auth.api.getSession({
        headers:
          await headers()
      });

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            'Authentication is required.'
        },
        {
          status:
            401
        }
      );
    }

    const cookieStore =
      await cookies();

    const requestedWorkspaceId =
      request.nextUrl
        .searchParams
        .get(
          'workspaceId'
        )
        ?.trim() ||
      null;

    const cookieWorkspaceId =
      cookieStore.get(
        ACTIVE_WORKSPACE_COOKIE
      )?.value ??
      null;

    const workspaceRuntime =
      await getUserWorkspaces(
        session.user.id,
        requestedWorkspaceId ??
          cookieWorkspaceId
      );

    const activeWorkspace =
      workspaceRuntime.activeWorkspace;

    if (
      !activeWorkspace
    ) {
      return NextResponse.json(
        {
          error:
            'Shelsea could not resolve an active customer workspace.'
        },
        {
          status:
            404
        }
      );
    }

    const dashboard =
      await getCustomerDashboardData(
        session.user.id,
        activeWorkspace
      );

    return NextResponse.json(
      {
        workspaceId:
          activeWorkspace.id,

        generatedAt:
          dashboard.generatedAt,

        pulse: {
          paidOrderCount:
            dashboard.pulse
              .paidOrderCount,

          activeOrderCount:
            dashboard.pulse
              .activeOrderCount,

          deliveredOrderCount:
            dashboard.pulse
              .deliveredOrderCount
        },

        orders:
          dashboard.orders
      },
      {
        headers: {
          'Cache-Control':
            'private, no-store, max-age=0'
        }
      }
    );
  } catch (
    error
  ) {
    console.error(
      'Customer commerce runtime failed.',
      error
    );

    return NextResponse.json(
      {
        error:
          'Shelsea could not load your current order activity.'
      },
      {
        status:
          500
      }
    );
  }
}
