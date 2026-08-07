import 'server-only';

import {
  NextResponse
} from 'next/server';

export class WishlistHttpError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string
  ) {
    super(message);

    this.name = 'WishlistHttpError';
    this.status = status;
  }
}

export function wishlistErrorResponse(
  error: unknown
): NextResponse {
  if (
    error instanceof WishlistHttpError
  ) {
    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: error.status
      }
    );
  }

  console.error(
    'Wishlist request failed:',
    error
  );

  return NextResponse.json(
    {
      error:
        'Shelsea could not complete the wishlist request.'
    },
    {
      status: 500
    }
  );
}