import type {
  WishlistMutationResponse,
  WishlistResponse
} from './wishlistTypes';

type AddWishlistProductPayload = {
  workspaceId: string;
  productId: string;
};

type WishlistWorkspacePayload = {
  workspaceId: string;
};

type ErrorResponse = {
  error?: string;
};

async function readWishlistResponse<T>(
  response: Response
): Promise<T> {
  let body: T & ErrorResponse;

  try {
    body =
      (await response.json()) as T &
        ErrorResponse;
  } catch {
    throw new Error(
      'Shelsea received an invalid wishlist response.'
    );
  }

  if (!response.ok) {
    throw new Error(
      body.error ??
        'The wishlist request failed.'
    );
  }

  return body;
}

export async function getWishlist(
  workspaceId: string
): Promise<WishlistResponse> {
  const searchParams =
    new URLSearchParams({
      workspaceId
    });

  const response = await fetch(
    `/api/wishlist?${searchParams.toString()}`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    }
  );

  return readWishlistResponse<WishlistResponse>(
    response
  );
}

export async function addWishlistProduct(
  payload: AddWishlistProductPayload
): Promise<WishlistMutationResponse> {
  const response = await fetch(
    '/api/wishlist',
    {
      method: 'POST',

      credentials: 'same-origin',

      headers: {
        'Content-Type':
          'application/json'
      },

      body: JSON.stringify(payload)
    }
  );

  return readWishlistResponse<WishlistMutationResponse>(
    response
  );
}

export async function removeWishlistProduct(
  productId: string,
  payload: WishlistWorkspacePayload
): Promise<WishlistMutationResponse> {
  const response = await fetch(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    {
      method: 'DELETE',

      credentials: 'same-origin',

      headers: {
        'Content-Type':
          'application/json'
      },

      body: JSON.stringify(payload)
    }
  );

  return readWishlistResponse<WishlistMutationResponse>(
    response
  );
}