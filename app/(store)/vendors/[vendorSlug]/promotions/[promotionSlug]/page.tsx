import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import VendorPromotionExperience from '@/features/vendor-storefront/components/VendorPromotionExperience';
import { getVendorPromotion } from '@/features/vendor-storefront/server/getVendorStorefront';

type VendorPromotionPageProps = {
  params: Promise<{
    vendorSlug: string;
    promotionSlug: string;
  }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params
}: VendorPromotionPageProps): Promise<Metadata> {
  const { vendorSlug, promotionSlug } = await params;
  const detail = await getVendorPromotion(vendorSlug, promotionSlug);

  if (!detail) {
    return {
      title: 'Offer unavailable'
    };
  }

  return {
    title: detail.promotion.title,
    description:
      detail.promotion.description ??
      `Shop ${detail.promotion.title} from ${detail.vendor.name}.`
  };
}

export default async function VendorPromotionPage({
  params
}: VendorPromotionPageProps) {
  const { vendorSlug, promotionSlug } = await params;
  const detail = await getVendorPromotion(vendorSlug, promotionSlug);

  if (!detail) {
    notFound();
  }

  return <VendorPromotionExperience detail={detail} />;
}
