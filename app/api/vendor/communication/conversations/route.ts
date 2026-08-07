import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  getVendorCommunicationInbox
} from '@/features/communication/server/communicationRepository';
import {
  getVendorApiAccess
} from '@/features/vendor/auth/vendorAccess';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(
  request: NextRequest
) {
  try {
    const access =
      await getVendorApiAccess(
        request.headers
      );

    if (!access) {
      return response(
        {
          error:
            'Vendor authentication is required.'
        },
        401
      );
    }

    if (
      !access.permissions.has(
        'communication:view'
      )
    ) {
      return response(
        {
          error:
            'Vendor communication access is required.'
        },
        403
      );
    }

    const requested = Number.parseInt(
      request.nextUrl.searchParams.get(
        'limit'
      ) ?? '100',
      10
    );

    return response(
      await getVendorCommunicationInbox(
        access.vendor.id,
        access.workspace.id,
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
      'Vendor conversation list failed.',
      error
    );

    return response(
      {
        error:
          'Shelsea could not load the vendor Inbox.'
      },
      500
    );
  }
}
