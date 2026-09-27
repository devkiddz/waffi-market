'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Store } from 'lucide-react';

import { ListingProductGrid } from '@/features/store-listings/ListingProductGrid';
import VendorBannerCarousel from './VendorBannerCarousel';
import type { VendorDirectoryItem } from '@/features/vendor-storefront/contracts';
import type { CategoryType, ProductType } from '@/types/types';

type VendorSpotlightProps = {
  shop: VendorDirectoryItem;
  products: ProductType[];
  categories: CategoryType[];
};

export default function VendorSpotlight({ shop, products, categories }: VendorSpotlightProps) {
  const [selected, setSelected] = useState('all');
  if (!products.length) return null;

  const categorySlugs = [...new Set(products.map(product => product.category))].slice(0, 5);
  const tabs = categorySlugs.map(slug => ({
    slug,
    label: categories.find(category => category.slug === slug)?.label ?? slug.replaceAll('-', ' ')
  }));
  const visible = selected === 'all' ? products : products.filter(product => product.category === selected);

  return (
    <section className="border-t border-border py-6 sm:py-8" aria-label={`Featured shop ${shop.name}`}>
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:px-4">
        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground">
          {shop.logoUrl ? <Image src={shop.logoUrl} alt="" fill sizes="40px" className="object-cover" /> : <Store className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Featured shop</p>
          <h2 className="truncate font-heading text-sm font-semibold text-foreground sm:text-base">{shop.name}</h2>
          {shop.description ? <p className="hidden truncate text-xs text-muted-foreground sm:block">{shop.description}</p> : null}
        </div>
        <Link href={`/shops/${encodeURIComponent(shop.slug)}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Visit shop <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {shop.banners?.length ? <VendorBannerCarousel banners={shop.banners} vendorName={shop.name} /> : null}

      <div role="tablist" aria-label={`${shop.name} product categories`} className="scrollbar-none mt-3 flex min-w-0 gap-1.5 overflow-x-auto pb-1">
        {[{ slug: 'all', label: 'All products' }, ...tabs].map(tab => (
          <button key={tab.slug} type="button" role="tab" aria-selected={selected === tab.slug}
            onClick={() => setSelected(tab.slug)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${selected === tab.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <ListingProductGrid products={visible.slice(0, 12)} presentation="compact" layout="rail" />
      </div>
    </section>
  );
}
