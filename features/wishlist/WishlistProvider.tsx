'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useActionFeedback } from '@/features/action-feedback';

import { useWorkspace } from '@/features/workspace';

import { useIdentity } from '@/providers/IdentityProvider';

import { WishlistContext } from './wishlistContext';

import { addWishlistProduct, getWishlist, removeWishlistProduct } from './wishlistService';

import {
  createWishlistActionPayload,
  parseWishlistActionPayload,
  WISHLIST_ADD_ACTION,
  WISHLIST_REMOVE_ACTION
} from './wishlistTypes';

import { WishlistActionBridge } from './WishlistActionBridge';

import type { WishlistContextValue, WishlistProductReference } from './wishlistTypes';

type WishlistProviderProps = {
  children: ReactNode;
};

function normalizeProductIds(productIds: string[]): string[] {
  return Array.from(new Set(productIds.filter(Boolean)));
}

function getWishlistErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const { activeWorkspace } = useWorkspace();

  const { isAuthenticated, isPending } = useIdentity();

  const { runProtectedAction } = useActionFeedback();

  const workspaceId = activeWorkspace?.id ?? null;

  const canPersist = Boolean(isAuthenticated && !isPending && workspaceId && workspaceId !== 'guest-live');

  const [productIds, setProductIds] = useState<string[]>([]);

  const productIdsRef = useRef<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [mutatingProductIds, setMutatingProductIds] = useState<Set<string>>(() => new Set());

  const commitProductIds = useCallback((nextProductIds: string[]) => {
    const normalized = normalizeProductIds(nextProductIds);

    productIdsRef.current = normalized;

    setProductIds(normalized);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const markProductMutating = useCallback((productId: string, mutating: boolean) => {
    setMutatingProductIds(currentIds => {
      const nextIds = new Set(currentIds);

      if (mutating) {
        nextIds.add(productId);
      } else {
        nextIds.delete(productId);
      }

      return nextIds;
    });
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!canPersist || !workspaceId) {
      commitProductIds([]);
      setError(null);
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getWishlist(workspaceId);

      commitProductIds(result.productIds);
    } catch (wishlistError) {
      const message = getWishlistErrorMessage(wishlistError, 'Unable to load your wishlist.');

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canPersist, commitProductIds, workspaceId]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshWishlist();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPending, refreshWishlist]);

  const addProduct = useCallback(
    async (productId: string): Promise<void> => {
      if (!canPersist || !workspaceId) {
        throw new Error('Sign in to save products to your wishlist.');
      }

      if (productIdsRef.current.includes(productId)) {
        return;
      }

      setError(null);

      markProductMutating(productId, true);

      commitProductIds([productId, ...productIdsRef.current]);

      try {
        const result = await addWishlistProduct({
          workspaceId,
          productId
        });

        commitProductIds(result.productIds);
      } catch (wishlistError) {
        commitProductIds(productIdsRef.current.filter(currentProductId => currentProductId !== productId));

        const message = getWishlistErrorMessage(wishlistError, 'Unable to save this product.');

        setError(message);

        throw new Error(message);
      } finally {
        markProductMutating(productId, false);
      }
    },
    [canPersist, commitProductIds, markProductMutating, workspaceId]
  );

  const removeProduct = useCallback(
    async (productId: string): Promise<void> => {
      if (!canPersist || !workspaceId) {
        throw new Error('Sign in to manage your wishlist.');
      }

      if (!productIdsRef.current.includes(productId)) {
        return;
      }

      setError(null);

      markProductMutating(productId, true);

      commitProductIds(productIdsRef.current.filter(currentProductId => currentProductId !== productId));

      try {
        const result = await removeWishlistProduct(productId, {
          workspaceId
        });

        commitProductIds(result.productIds);
      } catch (wishlistError) {
        commitProductIds([productId, ...productIdsRef.current]);

        const message = getWishlistErrorMessage(wishlistError, 'Unable to remove this product.');

        setError(message);

        throw new Error(message);
      } finally {
        markProductMutating(productId, false);
      }
    },
    [canPersist, commitProductIds, markProductMutating, workspaceId]
  );

  const isWishlisted = useCallback(
    (productId: string): boolean => {
      return productIds.includes(productId);
    },
    [productIds]
  );

  const isMutating = useCallback(
    (productId: string): boolean => {
      return mutatingProductIds.has(productId);
    },
    [mutatingProductIds]
  );

  const toggleWishlist = useCallback(
    async (product: WishlistProductReference): Promise<boolean> => {
      const currentlySaved = productIdsRef.current.includes(product.id);

      const actionType = currentlySaved ? WISHLIST_REMOVE_ACTION : WISHLIST_ADD_ACTION;

      const readableName = product.name?.trim() || 'this product';

      return runProtectedAction({
        action: {
          type: actionType,

          payload: createWishlistActionPayload(product),

          title: currentlySaved ? `Remove ${readableName}?` : `Save ${readableName}?`,

          description: currentlySaved
            ? 'This product will be removed from your Shelsea wishlist.'
            : 'Your saved products remain connected to your Shelsea account.',

          successTitle: currentlySaved ? 'Removed from wishlist' : 'Saved to wishlist',

          successDescription: currentlySaved
            ? `${readableName} is no longer in your saved products.`
            : `${readableName} is now available in your saved products.`
        },

        gate: {
          title: 'Sign in to save this product',

          description:
            'Create an account or sign in to preserve your wishlist and continue your Shelsea experience across devices.',

          benefits: [
            'Keep products safely connected to your account.',
            'Continue your wishlist across devices.',
            'Use your saved products in future Shelsea recommendations.'
          ]
        },

        execute: async payload => {
          const { productId } = parseWishlistActionPayload(payload);

          if (productIdsRef.current.includes(productId)) {
            await removeProduct(productId);
          } else {
            await addProduct(productId);
          }
        }
      });
    },
    [addProduct, removeProduct, runProtectedAction]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      productIds,
      count: productIds.length,

      loading,
      error,

      canPersist,

      mutatingProductIds,

      refreshWishlist,

      addProduct,
      removeProduct,
      toggleWishlist,

      isWishlisted,
      isMutating,

      clearError
    }),
    [
      addProduct,
      canPersist,
      clearError,
      error,
      isMutating,
      isWishlisted,
      loading,
      mutatingProductIds,
      productIds,
      refreshWishlist,
      removeProduct,
      toggleWishlist
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}

      <WishlistActionBridge />
    </WishlistContext.Provider>
  );
}
