import {
  getVendorDirectory,
  getVendorStorefront
} from '@/features/vendor-storefront/server/getVendorStorefront';
import { connection } from 'next/server';

import FeaturedVendorRail from './FeaturedVendorRail';

/** Keeps the existing homepage import while replacing the rotating hero. */
export default async function MarketplaceCarousel() {
  // New vendor stories must be read per request rather than frozen in a static homepage build.
  await connection();
  const directory = await getVendorDirectory().catch(() => null);
  const vendors = directory?.vendors
    .filter(vendor => vendor.productCount > 0)
    .sort((a, b) => b.storyCount - a.storyCount || b.productCount - a.productCount);

  const storyShops = await Promise.all((vendors ?? [])
    .filter(vendor => vendor.storyCount > 0)
    .map(async vendor => {
      const storefront = await getVendorStorefront(vendor.slug).catch(() => null);
      if (!storefront?.stories.length) return null;
      const targets: Record<string, string> = {};
      for (const product of storefront.products) targets[`product:${product.id}`] = `/products/${encodeURIComponent(product.slug)}`;
      for (const collection of storefront.collections) targets[`collection:${collection.id}`] = `/collections/${encodeURIComponent(collection.slug)}`;
      for (const promotion of storefront.promotions) targets[`promotion:${promotion.id}`] = promotion.href;
      return { vendorId: vendor.id, stories: storefront.stories, targets };
    }));

  return <FeaturedVendorRail vendors={vendors ?? []} storyShops={storyShops.filter(item => item !== null)} />;
}
