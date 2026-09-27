'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import ProductShelf from '@/features/products/components/ProductShelf';

import type { ProductType, ProductVariantType } from '@/types/types';

type ProductsCarouselProps = {
  title: string;

  category: string;

  products: ProductType[];

  onPreview?: (product: ProductType) => void;

  onOpenExperience?: (product: ProductType) => void;

  onAddToCart?: (product: ProductType, variant: ProductVariantType) => void;
};

export default function ProductsCarousel({
  title,
  category,
  products,
  onPreview,
  onOpenExperience,
  onAddToCart
}: ProductsCarouselProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 rounded-3xl border border-border/60 bg-card/30 p-4 shadow-sm md:p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
            Product selection
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-card-foreground">{title}</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        <Link
          href={`/categories/${encodeURIComponent(category)}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5">
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <ProductShelf
        products={products}
        ariaLabel={title}
        onPreview={onPreview}
        onOpenExperience={onOpenExperience}
        onAddToCart={onAddToCart}
      />
    </section>
  );
}
