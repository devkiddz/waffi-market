'use client';

import { Heart, LoaderCircle } from 'lucide-react';

import { useFeedExperience } from '@/features/feed-experience';

import { useWishlist } from '@/features/wishlist';

import { useIdentity } from '@/providers/IdentityProvider';

import HubProductCard from '../cards/HubProductCard';

export default function HubWishlistWidget() {
  const { context, actions } = useFeedExperience();

  const { isAuthenticated } = useIdentity();

  const { count, loading, isWishlisted } = useWishlist();

  if (!isAuthenticated) {
    return null;
  }

  const visibleWishlistProducts = context.catalog.products
    .filter(product => isWishlisted(product.id))
    .slice(0, 4);

  return (
    <section className="rounded-3xl border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Heart className="size-4 text-secondary" />
          Wishlist
        </h3>

        {!loading && (
          <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold text-secondary">
            {count}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading saved products
        </div>
      ) : visibleWishlistProducts.length > 0 ? (
        <div className="space-y-1">
          {visibleWishlistProducts.map(product => (
            <HubProductCard key={product.id} product={product} onSelect={actions.previewProduct} />
          ))}
        </div>
      ) : count > 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
          <p className="text-xs font-semibold">Some saved products are currently unavailable.</p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your wishlist still remembers them, but they are not available in the current Shelsea catalogue.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
          <p className="text-xs font-semibold">Nothing saved yet</p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Tap the heart on any product to keep it here.
          </p>
        </div>
      )}
    </section>
  );
}
