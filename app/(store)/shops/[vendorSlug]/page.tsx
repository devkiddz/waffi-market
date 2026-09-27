import { redirect } from 'next/navigation';

export default async function LegacyShopPage({
  params
}: {
  params: Promise<{ vendorSlug: string }>;
}) {
  const { vendorSlug } = await params;
  redirect(`/vendors/${encodeURIComponent(vendorSlug)}`);
}
