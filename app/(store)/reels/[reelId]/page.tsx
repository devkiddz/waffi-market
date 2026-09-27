import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StoreReelDetailExperience } from '@/features/store-studio/components';
import { getStoreReelDetail } from '@/features/store-studio/server';

type StoreReelPageProps = {
  params: Promise<{
    reelId: string;
  }>;
};

export async function generateMetadata({
  params
}: StoreReelPageProps): Promise<Metadata> {
  const { reelId } = await params;
  const detail = await getStoreReelDetail(reelId);

  if (!detail) {
    return {
      title: 'Store Reel | Waffi'
    };
  }

  return {
    title: `${detail.reel.title} | Waffi Reel`,
    description:
      detail.reel.caption ??
      `Watch and shop ${detail.reel.title} on Waffi.`
  };
}

export default async function StoreReelPage({
  params
}: StoreReelPageProps) {
  const { reelId } = await params;
  const detail = await getStoreReelDetail(reelId);

  if (!detail) {
    notFound();
  }

  return (
    <StoreReelDetailExperience
      reel={detail.reel}
      product={detail.product}
    />
  );
}
