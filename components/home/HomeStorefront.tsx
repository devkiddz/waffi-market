'use client';

import HomeProductSections from './HomeProductSections';
import type { VendorDirectoryItem } from '@/features/vendor-storefront/contracts';

type HomeStorefrontProps = {
  vendors: VendorDirectoryItem[];
  shopsAvailable: boolean;
};

export default function HomeStorefront({ vendors }: HomeStorefrontProps) {
  return (
    <main className="min-h-full overflow-x-hidden bg-background font-sans text-foreground">
      <HomeProductSections vendors={vendors} />
    </main>
  );
}
