import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import VendorDirectoryExperience from '@/features/vendor-storefront/components/VendorDirectoryExperience';
import { getVendorDirectory } from '@/features/vendor-storefront/server/getVendorStorefront';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Shops',
  description: 'Browse verified merchants operating through Shelsea.'
};

export default async function ShopsPage() {
  const directory = await getVendorDirectory();

  if (!directory) {
    notFound();
  }

  return <VendorDirectoryExperience {...directory} />;
}
