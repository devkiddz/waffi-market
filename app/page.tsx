import HomeStorefront from '@/components/home/HomeStorefront';
import MarketplaceCarousel from '@/features/marketplace-carousel/MarketplaceCarousel';
import { getVendorDirectory } from '@/features/vendor-storefront/server/getVendorStorefront';
import { connection } from 'next/server';
import { Suspense } from 'react';
import CategoryNavigation from '@/components/navigation/CategoryNavigation';

export default async function HomeRoute() {
  await connection();
  const directory = await getVendorDirectory().catch(() => null);

  return (
    <>
      <MarketplaceCarousel />
      <div className="sticky top-[var(--app-navbar-height)] z-[100] min-w-0">
        <Suspense fallback={null}><CategoryNavigation /></Suspense>
      </div>
      <HomeStorefront vendors={directory?.vendors ?? []} shopsAvailable={Boolean(directory)} />
    </>
  );
}
