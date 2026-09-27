'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { ListingProductGrid } from '@/features/store-listings/ListingProductGrid';
import type { CategoriesType, ProductType } from '@/types/types';
import type { VendorStorefront } from '../contracts';

type Props = {
  storefront: VendorStorefront;
  categories: CategoriesType;
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
};

function VendorShelf({ title, products }: { title: string; products: ProductType[] }) {
  if (!products.length) return null;
  return (
    <section aria-label={title} className="min-w-0 border-t border-border py-6 sm:py-8">
      <h2 className="mb-3 font-heading text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      <ListingProductGrid products={products.slice(0, 12)} presentation="compact" layout="rail" />
    </section>
  );
}

export default function VendorStoreSections({ storefront, categories, selectedCategory, onCategoryChange }: Props) {
  const [compact, setCompact] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);
  const vendorCategories = categories.filter(category =>
    category.slug !== 'all' && storefront.products.some(product => product.category === category.slug)
  );
  const selectedProducts = selectedCategory === 'all'
    ? storefront.products
    : storefront.products.filter(product => selectedCategory === 'deals'
      ? product.discountPercentage > 0
      : product.category === selectedCategory);
  const featured = selectedProducts.filter(product => product.featured);

  useEffect(() => {
    const update = () => {
      const rail = pillsRef.current;
      if (rail) {
        const navbarHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-navbar-height')) || 80;
        setCompact(rail.getBoundingClientRect().top < navbarHeight);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="min-w-0 px-[var(--app-page-gutter)] pb-12">
      <div ref={pillsRef} aria-hidden="true" />
      <div className="sticky top-[var(--app-navbar-height)] z-30 -mx-[var(--app-page-gutter)] bg-background/95 px-[var(--app-page-gutter)] py-2 backdrop-blur-md">
        <nav aria-label={`${storefront.name} categories`} className="scrollbar-none overflow-x-auto">
          <div className="flex w-max items-center gap-2">
            {[{ slug: 'all', label: 'All products' }, ...vendorCategories].map(category => (
              <button
                key={category.slug}
                type="button"
                aria-pressed={selectedCategory === category.slug}
                onClick={() => onCategoryChange(category.slug)}
                className={`shrink-0 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${selectedCategory === category.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'}`}>
                {category.label}
              </button>
            ))}
            {selectedCategory !== 'all' && !vendorCategories.some(category => category.slug === selectedCategory) ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowRight className="size-3" /> {selectedCategory}</span>
            ) : null}
          </div>
        </nav>
      </div>
      {featured.length > 0 ? <VendorShelf title="Featured products" products={featured} /> : null}
      {selectedCategory === 'all' ? vendorCategories.map(category => (
        <VendorShelf key={category.id} title={category.label} products={storefront.products.filter(product => product.category === category.slug)} />
      )) : <VendorShelf title={vendorCategories.find(category => category.slug === selectedCategory)?.label ?? 'Products'} products={selectedProducts.filter(product => !featured.some(item => item.id === product.id))} />}
      {!selectedProducts.length ? <p className="py-8 text-sm text-muted-foreground">No products in this category yet.</p> : null}
    </div>
  );
}
