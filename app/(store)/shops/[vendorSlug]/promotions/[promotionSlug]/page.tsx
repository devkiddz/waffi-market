import { redirect } from 'next/navigation';

export default async function LegacyShopPromotionPage({
  params
}: {
  params: Promise<{ vendorSlug: string; promotionSlug: string }>;
}) {
  const { vendorSlug, promotionSlug } = await params;
  redirect(`/vendors/${encodeURIComponent(vendorSlug)}/promotions/${encodeURIComponent(promotionSlug)}`);
}
