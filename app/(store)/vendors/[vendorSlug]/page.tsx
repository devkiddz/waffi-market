import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import VendorStorefrontExperience from '@/features/vendor-storefront/components/VendorStorefrontExperience';
import { getVendorStorefront } from '@/features/vendor-storefront/server/getVendorStorefront';

type VendorStorefrontPageProps = {
  params: Promise<{
    vendorSlug: string;
  }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params
}: VendorStorefrontPageProps): Promise<Metadata> {
  const { vendorSlug } = await params;
  const storefront = await getVendorStorefront(vendorSlug);

  if (!storefront) {
    return {
      title: 'Vendor unavailable'
    };
  }

  return {
    title: storefront.name,
    description:
      storefront.description ??
      `Explore products and collections from ${storefront.name} on Waffi Market.`
  };
}

export default async function VendorStorefrontPage({
  params
}: VendorStorefrontPageProps) {
  const { vendorSlug } = await params;
  const storefront = await getVendorStorefront(vendorSlug);

  if (!storefront) {
    notFound();
  }

  return <Suspense fallback={null}><VendorStorefrontExperience storefront={storefront} /></Suspense>;
}
