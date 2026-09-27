'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useCatalog } from '@/features/catalog';
import { ListingProductGrid } from './ListingProductGrid';

export default function CategoryProductsExperience({ slug }: { slug: string }) {
  const { categories, products, loading, error, refreshCatalog } = useCatalog();
  const category = categories.find(item => item.slug === slug);
  const filtered = slug === 'all' ? products : slug === 'deals'
    ? products.filter(product => product.discountPercentage > 0)
    : products.filter(product => product.category === slug);
  const title = slug === 'all' ? 'All products' : category?.label ?? slug.replaceAll('-', ' ');

  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-[var(--app-page-gutter)] py-8 text-foreground">
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" /> Back to Waffi
      </Link>
      <h1 className="mt-5 font-heading text-2xl font-semibold sm:text-3xl">{title}</h1>
      {category?.shortDescription ? <p className="mt-2 text-sm text-muted-foreground">{category.shortDescription}</p> : null}
      {filtered.length ? (
        <div className="mt-6"><ListingProductGrid products={filtered} presentation="compact" /></div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground" aria-live="polite">
          {loading ? 'Loading products…' : error ? 'Products could not be loaded right now.' : 'No products are available here yet.'}
          {!loading && error ? <button type="button" onClick={() => void refreshCatalog()} className="ml-3 font-semibold text-primary hover:underline">Try again</button> : null}
        </div>
      )}
    </main>
  );
}
