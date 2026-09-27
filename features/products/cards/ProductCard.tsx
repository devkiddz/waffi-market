'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Store } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { BaseProductCardProps } from './productCardTypes';
import { CompactProductActions } from './CompactProductActions';
import { openProductExperience } from './productCardPresentation';
import { useProductVariant } from './useProductVariant';

const priceFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

export function ProductCard({
  product,
  presentation = 'standard',
  className,
  onOpenExperience,
  onPreview,
  onAddToCart,
  onAskAI
}: BaseProductCardProps) {
  const { selectedVariant } = useProductVariant(product);
  if (!selectedVariant) return null;

  const openExperience = () => {
    openProductExperience({ product, onOpenExperience, onPreview });
  };
  const status = product.soldCount >= 250
    ? 'Best seller'
    : product.isNew ? 'New arrival' : product.featured ? 'Featured' : null;
  const compact = presentation === 'compact';
  const originalPrice = product.discountPercentage > 0 && product.discountPercentage < 100
    ? selectedVariant.price / (1 - product.discountPercentage / 100)
    : null;

  return (
    <article className={cn(
      'group flex min-w-0 flex-col overflow-hidden border border-border bg-card text-card-foreground transition hover:border-primary/40',
      compact ? 'rounded-xl p-1' : 'rounded-2xl p-1.5',
      className
    )}>
      <div className="relative">
        <button
          type="button"
          onClick={openExperience}
          aria-label={`View ${product.name} in Discovery Hub`}
          className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className={`relative bg-muted ${compact ? 'aspect-square' : 'aspect-[4/4.5]'}`}>
            <Image
              src={selectedVariant.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </button>
        {status ? (
          <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full border border-border/70 bg-card/75 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground backdrop-blur-sm">
            {status}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={openExperience}
        className="mt-2 block w-full min-w-0 px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <h3
          title={product.name}
          className="truncate font-heading text-[11px] font-semibold leading-4 sm:text-xs">
          {product.name}
        </h3>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-xs font-semibold">{priceFormatter.format(selectedVariant.price)}</span>
          {originalPrice ? (
            <>
              <span className="text-[10px] text-muted-foreground line-through">{priceFormatter.format(originalPrice)}</span>
              <span className="text-[10px] font-medium text-primary">Save {priceFormatter.format(originalPrice - selectedVariant.price)}</span>
            </>
          ) : null}
        </span>
      </button>

      {product.merchant ? (
        <Link
          href={`/shops/${encodeURIComponent(product.merchant.slug)}`}
          aria-label={`Visit ${product.merchant.name}`}
          className="mx-1 mt-1.5 flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative grid size-4 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
            {product.merchant.logoUrl ? (
              <Image src={product.merchant.logoUrl} alt="" fill sizes="16px" className="object-cover" />
            ) : (
              <Store className="size-2.5" />
            )}
          </span>
          <span className="truncate">{product.merchant.name}</span>
        </Link>
      ) : null}

      <CompactProductActions
        product={product}
        variant={selectedVariant}
        onOpenHub={openExperience}
        onAddToCart={onAddToCart}
        onAskAI={onAskAI}
        compact={compact}
      />
    </article>
  );
}
