import 'server-only';

import {
  auth
} from '@/lib/auth';

import {
  prisma
} from '@/lib/prisma';

import {
  WishlistHttpError
} from './wishlistErrors';

export type WishlistAccess = {
  userId: string;
  workspaceId: string;
};

export async function requireWishlistAccess(
  request: Request,
  workspaceIdInput: string | null | undefined
): Promise<WishlistAccess> {
  const session =
    await auth.api.getSession({
      headers: request.headers
    });

  const userId =
    session?.user?.id;

  if (!userId) {
    throw new WishlistHttpError(
      401,
      'Sign in to access your Shelsea wishlist.'
    );
  }

  const workspaceId =
    workspaceIdInput?.trim();

  if (
    !workspaceId ||
    workspaceId === 'guest-live'
  ) {
    throw new WishlistHttpError(
      400,
      'A valid Shelsea workspace is required.'
    );
  }

  const membership =
    await prisma.workspaceMembership.findUnique(
      {
        where: {
          workspaceId_userId: {
            workspaceId,
            userId
          }
        },

        select: {
          active: true
        }
      }
    );

  if (!membership?.active) {
    throw new WishlistHttpError(
      403,
      'You do not have access to this workspace wishlist.'
    );
  }

  return {
    userId,
    workspaceId
  };
}