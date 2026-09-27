import type { Metadata } from 'next';
import FeaturedProductsExperience from '@/components/home/FeaturedProductsExperience';

export const metadata: Metadata = {
  title: 'Featured products | Waffi Market',
  description: 'Explore products featured by Waffi Market.'
};

export default function FeaturedProductsPage() {
  return <FeaturedProductsExperience />;
}
