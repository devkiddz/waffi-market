import { headers } from 'next/headers';
import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getWorkspaceCommerceProjection
} from '@/features/feed-experience/runtime/getWorkspaceCommerceProjection';

import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest
) {
  try {
    const session =
      await auth.api.getSession({
        headers: await headers()
      });

    const userId =
      session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Authentication is required.'
        },
        {
          status: 401
        }
      );
    }

    const workspaceId =
      request.nextUrl.searchParams
        .get('workspaceId')
        ?.trim() ?? '';

    if (!workspaceId) {
      return NextResponse.json(
        {
          error: 'workspaceId is required.'
        },
        {
          status: 400
        }
      );
    }

    const projection =
      await getWorkspaceCommerceProjection({
        userId,
        workspaceId
      });

    if (!projection) {
      return NextResponse.json(
        {
          error:
            'The requested workspace is unavailable.'
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json(
      {
        projection
      },
      {
        headers: {
          'Cache-Control':
            'private, no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error(
      'Workspace commerce projection failed.',
      error
    );

    return NextResponse.json(
      {
        error:
          'Shelsea could not load the current customer commerce experience.'
      },
      {
        status: 500
      }
    );
  }
}
