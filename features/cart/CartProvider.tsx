'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useActionFeedback } from '@/features/action-feedback';
import { useWorkspace } from '@/features/workspace';

import { CartEngine } from './cartEngine';
import { CartContext } from './cartContext';

import type {
  AddToCartInput,
  CartContextValue,
  CartItem,
  CartRuntime,
  UpdateCartQuantityInput
} from './cartTypes';

import {
  calculateCartItemCount,
  calculateCartQuantity,
  calculateCartSubtotal
} from './utils/cartCalculations';

import { getCartErrorMessage } from './utils/cartErrors';

type CartProviderProps = {
  children: ReactNode;
};

const CART_ACTIVITY_GROUP_KEY = 'cart-activity';

const CART_ACTIVITY_DURATION = 5000;

export function CartProvider({ children }: CartProviderProps) {
  const { activeWorkspace } = useWorkspace();

  const { success, error: notifyError } = useActionFeedback();

  const runtime = useMemo<CartRuntime>(
    () => ({
      workspaceId: activeWorkspace?.id ?? null,

      isGuest: !activeWorkspace || activeWorkspace.id === 'guest-live'
    }),
    [activeWorkspace]
  );

  const [items, setItems] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [mutating, setMutating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshCart = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const nextItems = await CartEngine.get(runtime);

      setItems(nextItems);
    } catch (refreshError) {
      setError(getCartErrorMessage(refreshError, 'Unable to load your cart.'));
    } finally {
      setLoading(false);
    }
  }, [runtime]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [refreshCart]);

  const addToCart = useCallback(
    async (input: AddToCartInput): Promise<CartItem | null> => {
      setMutating(true);
      setError(null);

      try {
        const result = await CartEngine.add(runtime, input);

        setItems(result.items);

        /*
         * Some cart adapters may update the complete cart
         * without explicitly returning affectedItem.
         *
         * Resolve it from the updated cart as a fallback.
         */
        const affectedItem =
          result.affectedItem ??
          result.items.find(item => String(item.variantId) === String(input.variant.id)) ??
          null;

        const addedQuantity = Math.max(1, input.quantity ?? 1);

        const feedbackImage =
          input.variant.image || input.product.variants.find(variant => Boolean(variant.image))?.image;

        const unitPrice = Number(input.variant.price);

        const hasValidPrice = Number.isFinite(unitPrice);

        /*
         * A successful CartEngine.add operation is enough
         * to show feedback. It must not depend on
         * result.affectedItem being present.
         */
        success({
          groupKey: CART_ACTIVITY_GROUP_KEY,
          duration: CART_ACTIVITY_DURATION,

          title: addedQuantity > 1 ? 'Items added to your cart' : 'Added to your cart',

          banner: {
            label: 'Shelsea',
            detail: 'Your shopping cart',
            badge: 'Cart updated'
          },

          ...(feedbackImage
            ? {
                cartPreview: {
                  items: [
                    {
                      id: `${input.product.id}:${input.variant.id}`,

                      productId: input.product.id,

                      variantId: input.variant.id,

                      name: input.product.name,

                      variantLabel: input.variant.label,

                      image: feedbackImage,

                      quantity: addedQuantity,

                      ...(hasValidPrice
                        ? {
                            price: unitPrice
                          }
                        : {})
                    }
                  ],

                  locale: 'en-NG',
                  currency: 'NGN'
                }
              }
            : {
                description:
                  addedQuantity > 1
                    ? `${addedQuantity} × ${input.product.name} · ${input.variant.label}`
                    : `${input.product.name} · ${input.variant.label}`
              })
        });

        return affectedItem;
      } catch (addError) {
        setError(getCartErrorMessage(addError, 'Unable to add this product.'));

        return null;
      } finally {
        setMutating(false);
      }
    },
    [runtime, success]
  );

  const updateQuantity = useCallback(
    async (input: UpdateCartQuantityInput): Promise<void> => {
      setMutating(true);
      setError(null);

      try {
        const result = await CartEngine.update(runtime, input);

        setItems(result.items);
        success({
          title: 'Cart quantity saved',
          description: 'Your cart now reflects the new quantity.',
          groupKey: 'cart:quantity'
        });
      } catch (updateError) {
        const message = getCartErrorMessage(updateError, 'Unable to update the cart.');
        setError(message);
        notifyError({
          title: 'Cart update unsuccessful',
          description: message,
          groupKey: 'cart:quantity'
        });
      } finally {
        setMutating(false);
      }
    },
    [notifyError, runtime, success]
  );

  const removeFromCart = useCallback(
    async (itemId: string): Promise<void> => {
      setMutating(true);
      setError(null);

      try {
        const result = await CartEngine.remove(runtime, itemId);

        setItems(result.items);
        success({
          title: 'Item removed',
          description: 'The product was removed from your cart.',
          groupKey: 'cart:remove'
        });
      } catch (removeError) {
        const message = getCartErrorMessage(removeError, 'Unable to remove this item.');
        setError(message);
        notifyError({
          title: 'Removal unsuccessful',
          description: message,
          groupKey: 'cart:remove'
        });
      } finally {
        setMutating(false);
      }
    },
    [notifyError, runtime, success]
  );

  const clearCart = useCallback(async (): Promise<void> => {
    setMutating(true);
    setError(null);

    try {
      const result = await CartEngine.clear(runtime);

      setItems(result.items);
      success({
        title: 'Cart cleared',
        description: 'All products were removed from your cart.',
        groupKey: 'cart:clear'
      });
    } catch (clearCartError) {
      const message = getCartErrorMessage(clearCartError, 'Unable to clear your cart.');
      setError(message);
      notifyError({
        title: 'Cart could not be cleared',
        description: message,
        groupKey: 'cart:clear'
      });
    } finally {
      setMutating(false);
    }
  }, [notifyError, runtime, success]);

  const itemCount = useMemo(() => calculateCartItemCount(items), [items]);

  const totalQuantity = useMemo(() => calculateCartQuantity(items), [items]);

  const subtotal = useMemo(() => calculateCartSubtotal(items), [items]);

  const containsVariant = useCallback(
    (variantId: string): boolean => items.some(item => item.variantId === variantId),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,

      itemCount,
      totalQuantity,
      subtotal,

      loading,
      mutating,
      error,

      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      containsVariant,
      clearError
    }),
    [
      items,
      itemCount,
      totalQuantity,
      subtotal,
      loading,
      mutating,
      error,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      containsVariant,
      clearError
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
