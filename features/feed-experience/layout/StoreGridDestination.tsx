'use client';

import Link from 'next/link';
import { ArrowLeft, LayoutGrid, PackageSearch } from 'lucide-react';

import { useCatalog } from '@/features/catalog';
import { openCustomerProductExperience } from '@/features/customer-experience';
import { ProductCard } from '@/features/products/cards';

import type { ProductType, ProductVariantType } from '@/types/types';

type StoreGridDestinationProps = {
  selectedCategory: string;
  products: ProductType[];
  onAddToCart: (product: ProductType, variant: ProductVariantType) => void | Promise<void>;
};

export function StoreGridDestination({
  selectedCategory,
  products,
  onAddToCart
}: StoreGridDestinationProps) {
  const { categories } = useCatalog();
  const category = categories.find(item => item.slug === selectedCategory);
  const title = category?.label ?? 'All Products';
  const description =
    category?.description ??
    'Browse the complete Shelsea catalogue in a clear responsive product grid.';
  const discoveryHref =
    selectedCategory === 'all'
      ? '/store'
      : `/store?category=${encodeURIComponent(selectedCategory)}`;

  return (
    <div className="min-h-dvh px-[var(--app-page-gutter)] py-4 sm:py-6">
      <section className="mx-auto w-full max-w-[112rem] rounded-[var(--app-card-radius)] border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur sm:p-6">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href={discoveryHref}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-sm font-semibold shadow-sm transition hover:bg-muted">
              <ArrowLeft className="size-4" />
              Back to discovery
            </Link>

            <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
              <LayoutGrid className="size-4" />
              Store grid
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm shadow-sm">
            <span className="block text-2xl font-black tabular-nums">{products.length}</span>
            <span className="text-muted-foreground">
              {products.length === 1 ? 'product' : 'products'} available
            </span>
          </div>
        </header>

        {products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                className="max-w-none rounded-2xl p-1.5"
                onOpenExperience={selected =>
                  openCustomerProductExperience({
                    id: selected.id,
                    name: selected.name,
                    shortDescription: selected.shortDescription
                  })
                }
                onPreview={selected =>
                  openCustomerProductExperience({
                    id: selected.id,
                    name: selected.name,
                    shortDescription: selected.shortDescription
                  })
                }
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
            <div>
              <PackageSearch className="mx-auto size-8 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-bold">No products are visible here yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Return to Store discovery and explore another category.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
