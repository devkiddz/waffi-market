import { NextResponse } from 'next/server';

import {
  getStoreStudioProjection
} from '@/features/store-studio/server';

export const dynamic = 'force-dynamic';

/* SHELSEA_STORE_STUDIO_PROJECTION_RESILIENCE_V1 */

export async function GET(
  request: Request
) {
  const url =
    new URL(
      request.url
    );

  const workspaceId =
    url.searchParams
      .get(
        'workspaceId'
      )
      ?.trim();

  if (!workspaceId) {
    return NextResponse.json(
      {
        error:
          'workspaceId is required.'
      },
      {
        status: 400
      }
    );
  }

  try {
    const projection =
      await getStoreStudioProjection(
        workspaceId
      );

    return NextResponse.json(
      {
        projection
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (error) {
    console.error(
      '[Shelsea Store Studio] projection failed.',
      {
        workspaceId,
        error
      }
    );

    /*
     * Customer-facing resilience:
     *
     * Return a valid empty projection instead of a 500.
     * The feed builder can then activate its independent
     * banner/story/reel fallbacks.
     *
     * The server log remains authoritative for diagnosing
     * the underlying Prisma/Studio failure.
     */
    return NextResponse.json(
      {
        projection: {
          workspaceId,
          generatedAt:
            new Date()
              .toISOString(),
          banners: [],
          stories: [],
          reels: []
        },

        degraded: true
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          'x-shelsea-store-studio':
            'fallback'
        }
      }
    );
  }
}
