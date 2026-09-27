import type { CollectionType } from '@/data/collections';
import type { CommerceStory } from '@/features/commerce-stories';
import type { ProductType } from '@/types/types';

export type VendorDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  productCount: number;
  collectionCount: number;
  promotionCount: number;
  storyCount: number;
  reelCount: number;
  banners?: Array<{
    id: string;
    mediaUrl: string;
    mobileMediaUrl: string | null;
    title: string;
    description: string | null;
    actionHref: string;
    durationSeconds: number;
  }>;
};

export type VendorStorefrontPromotion = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  badge: string;
  imageUrl: string | null;
  href: string;
  productIds: string[];
  productCount: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type VendorStorefrontCampaignPreview = {
  id: string;
  campaignId: string;
  type: 'story' | 'reel';
  title: string;
  description: string | null;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  coverUrl: string | null;
  href: string | null;
};

export type VendorStorefront = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  banners: NonNullable<VendorDirectoryItem['banners']>;
  products: ProductType[];
  collections: CollectionType[];
  promotions: VendorStorefrontPromotion[];
  stories: CommerceStory[];
  reels: VendorStorefrontCampaignPreview[];
};


export type VendorPromotionDetail = {
  vendor: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  };
  promotion: VendorStorefrontPromotion;
  products: ProductType[];
};
