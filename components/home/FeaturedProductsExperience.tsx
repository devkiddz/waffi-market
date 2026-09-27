'use client';

import { useCatalog } from '@/features/catalog';
import { ListingProductGrid } from '@/features/store-listings/ListingProductGrid';

export default function FeaturedProductsExperience() {
  const { products, loading, error, refreshCatalog } = useCatalog();
  const featured = products.filter(product => product.featured);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-[var(--app-page-gutter)] py-8 text-foreground">
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Featured products</h1>
      <p className="mt-2 text-sm text-muted-foreground">Explore products featured across Waffi shops.</p>
      {featured.length ? (
        <div className="mt-6"><ListingProductGrid products={featured} presentation="compact" /></div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground" aria-live="polite">
          {loading ? 'Loading featured products…' : error ? 'Featured products could not be loaded right now.' : 'No featured products are available yet.'}
          {!loading && error ? (
            <button type="button" onClick={() => void refreshCatalog()} className="ml-3 font-semibold text-primary hover:underline">Try again</button>
          ) : null}
        </div>
      )}
    </main>
  );
}
