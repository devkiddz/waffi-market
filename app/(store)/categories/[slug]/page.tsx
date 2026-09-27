import type { Metadata } from 'next';
import CategoryProductsExperience from '@/features/store-listings/CategoryProductsExperience';

export const metadata: Metadata = { title: 'Browse products | Waffi Market' };

export default async function CategoryProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryProductsExperience slug={slug} />;
}
