'use client';

import { useState } from 'react';
import { Eye, Heart, ListPlus, MoreVertical, ShoppingBag, Sparkles, Truck, Star } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { openProductDeepInsight } from '@/features/product-intelligence';
import { AddToShoppingListDialog, useOptionalShoppingLists } from '@/features/shopping-lists';
import { useWishlist } from '@/features/wishlist';
import type { ProductType, ProductVariantType } from '@/types/types';

import type { ProductCardActions } from './productCardTypes';
import { useProductCartQuantity } from './useProductCartQuantity';

type Props = {
  product: ProductType;
  variant: ProductVariantType;
  onOpenHub: () => void;
  onAddToCart?: ProductCardActions['onAddToCart'];
  onAskAI?: ProductCardActions['onAskAI'];
  compact?: boolean;
};

export function CompactProductActions({ product, variant, onOpenHub, onAddToCart, onAskAI, compact = false }: Props) {
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const shoppingLists = useOptionalShoppingLists();
  const { toggleWishlist, isWishlisted, isMutating } = useWishlist();
  const { addOne, canIncrement, cartMutating, pendingAction, variantQuantity } = useProductCartQuantity(
    product, variant, { onAddToCart }
  );
  const saved = isWishlisted(product.id);
  const cartBusy = cartMutating || pendingAction !== null;
  const iconButton = `grid shrink-0 place-items-center rounded-full border border-border bg-card text-card-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'size-6 sm:size-7' : 'size-8'}`;

  return (
    <>
      <div className="mt-auto flex min-w-0 items-center gap-1 px-1 pb-0.5 pt-2">
        <button
          type="button"
          aria-label={variantQuantity ? `Add another ${product.name} to cart; ${variantQuantity} in cart` : `Add ${product.name} to cart`}
          disabled={!canIncrement || cartBusy}
          onClick={() => void addOne()}
          className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 truncate rounded-full bg-secondary px-1 text-[9px] font-semibold text-secondary-foreground transition hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${compact ? 'h-6 sm:h-7' : 'h-8 sm:text-[11px]'}`}>
          <ShoppingBag className="size-3 shrink-0" />
          <span className="truncate">Add to cart</span>
          {variantQuantity > 0 ? <span className="rounded-full bg-secondary-foreground/20 px-1 text-secondary-foreground tabular-nums">{variantQuantity > 99 ? '99+' : variantQuantity}</span> : null}
        </button>
        <button
          type="button"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={saved}
          disabled={isMutating(product.id)}
          onClick={() => void toggleWishlist({ id: product.id, name: product.name })}
          className={iconButton}>
          <Heart className={`size-3.5 ${saved ? 'fill-primary text-primary' : ''}`} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger type="button" aria-label={`More actions and product details for ${product.name}`} className={iconButton}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-60 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
            <p className="px-2 py-1.5 text-xs font-semibold">Product details</p>
            <div className="space-y-1 px-2 pb-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2"><Star className="size-3.5 text-primary" /> {product.rating.toFixed(1)} · {product.reviews} {product.reviews === 1 ? 'review' : 'reviews'}</p>
              {product.estimatedDelivery ? <p className="flex items-center gap-2"><Truck className="size-3.5 text-primary" /> {product.estimatedDelivery}</p> : null}
            </div>
            <DropdownMenuItem onClick={onOpenHub}><Eye className="size-4" /> View in Discovery Hub</DropdownMenuItem>
            <DropdownMenuItem disabled={!canIncrement || cartBusy} onClick={() => void addOne()}>
              <ShoppingBag className="size-4" /> {variantQuantity ? `Cart (${variantQuantity}) · add another` : 'Add to cart'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!shoppingLists} onClick={() => setShoppingListOpen(true)}>
              <ListPlus className="size-4" /> Add to shopping list
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (onAskAI) {
                void onAskAI(product, variant);
              } else {
                openProductDeepInsight({ productId: product.id, variantId: variant.id, source: 'product-card' });
              }
            }}><Sparkles className="size-4" /> Ask AI</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {shoppingLists ? (
        <AddToShoppingListDialog open={shoppingListOpen} product={product} variant={variant} onClose={() => setShoppingListOpen(false)} />
      ) : null}
    </>
  );
}
