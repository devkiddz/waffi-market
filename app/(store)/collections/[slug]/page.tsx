import type { Metadata } from 'next';

import CollectionDetailsExperience from '@/features/collection/pages/CollectionDetailsExperience';

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Collection',
  description: 'Explore products in this Shelsea collection.'
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  return <CollectionDetailsExperience slug={slug} />;
}
