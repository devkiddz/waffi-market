'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useCatalog } from '@/features/catalog';
import { ListingProductGrid } from '@/features/store-listings/ListingProductGrid';
import VendorSpotlight from './VendorSpotlight';
import type { VendorDirectoryItem } from '@/features/vendor-storefront/contracts';
import type { ProductType } from '@/types/types';

type HomeProductSectionsProps = {
  vendors: VendorDirectoryItem[];
};

const showcaseShopSlugs = [
  'shelsea',
  'kora-fashion',
  'crown-hair',
  'scent-house',
  'the-bag-edit'
] as const;

function ProductSection({ title, eyebrow, href, products }: { title: string; eyebrow: string; href: string; products: ProductType[] }) {
  if (!products.length) return null;

  return (
    <section id={title === 'Featured products' || title === 'Fresh from Waffi' ? 'featured-products' : undefined} className="scroll-mt-28 border-t border-border py-6 sm:py-8" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          See all <ArrowRight className="size-4" />
        </Link>
      </div>
      <ListingProductGrid products={products} presentation="compact" layout="rail" />
    </section>
  );
}

/** Homepage order: featured products, featured shops, then populated categories. */
export default function HomeProductSections({ vendors }: HomeProductSectionsProps) {
  const { products, categories, loading, error, refreshCatalog } = useCatalog();
  const featured = products.filter(product => product.featured).slice(0, 12);
  const featuredShops = showcaseShopSlugs
    .map(slug => vendors.find(vendor => vendor.slug === slug))
    .filter((shop): shop is VendorDirectoryItem => Boolean(shop?.productCount));

  if (!products.length) {
    return (
      <section className="mx-auto w-full max-w-7xl px-[var(--app-page-gutter)] py-10" aria-live="polite">
        <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Featured products</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {loading ? 'Loading products…' : error ? 'Products could not be loaded right now.' : 'No published products are available in this store yet.'}
        </p>
        {!loading && error ? (
          <button type="button" onClick={() => void refreshCatalog()} className="mt-3 text-sm font-semibold text-primary hover:underline">
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-[var(--app-page-gutter)] pb-12">
      <ProductSection title={featured.length ? 'Featured products' : 'Fresh from Waffi'} eyebrow="Picked for you" href={featured.length ? '/featured-products' : '/categories/all'} products={featured.length ? featured : products.slice(0, 12)} />

      {featuredShops.map(shop => (
        <VendorSpotlight
          key={shop.id}
          shop={shop}
          categories={categories}
          products={products.filter(product => product.merchant?.id === shop.id || product.merchant?.slug === shop.slug)}
        />
      ))}

      {categories.filter(category => category.slug !== 'all').map(category => (
        <ProductSection
          key={category.id}
          title={category.label}
          eyebrow="Explore category"
          href={`/categories/${encodeURIComponent(category.slug)}`}
          products={products.filter(product => product.category === category.slug).slice(0, 12)}
        />
      ))}
    </div>
  );
}
