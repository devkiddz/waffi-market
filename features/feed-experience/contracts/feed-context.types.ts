import type { CollectionType } from "@/data/collections";
import type { Promo } from "@/data/promos";
import type { CommerceStory } from '@/features/commerce-stories';
import type { StoreStudioBannerSlideProjection } from '@/features/store-studio/contracts';
import type { CategoriesType, ProductType } from "@/types/types";
import type {
  WorkspaceCommerceProjection
} from '../runtime/commerceProjectionTypes';

import type {
  StoreStudioProjection
} from '@/features/store-studio/contracts';

export type FeedCatalogContext = {
  products: ProductType[];
  categories: CategoriesType;
  collections: CollectionType[];
  promotions: Promo[];
};

export type FeedUserContext = {
  id?: string;
  sessionId: string;
  authenticated: boolean;
  tier: "guest" | "returning" | "member" | "premium";
  wishlistProductIds: string[];
  cartProductIds: string[];
  recentProductIds: string[];
};

export type FeedActivityContext = {
  viewedProductIds: string[];
  viewedCategorySlugs: string[];
  searchedTerms: string[];
  clickedCollectionIds: string[];
};

export type FeedEnvironmentContext = {
  locale: string;
  currency: string;
  device: "mobile" | "tablet" | "desktop";
  now: string;
};

export type FeedContext = {
  catalog: FeedCatalogContext;
  /** Vendor-owned media, including an intentionally empty set with no marketplace fallback. */
  vendorShowcase?: {
    banners: StoreStudioBannerSlideProjection[];
    stories: CommerceStory[];
  };

  user: FeedUserContext;

  activity: FeedActivityContext;

  environment: FeedEnvironmentContext;

  /**
   * Canonical database-backed, workspace-scoped
   * commerce runtime.
   */
  commerce?: WorkspaceCommerceProjection;

  /** Workspace-scoped promotional media resolved by Store Studio. */
  storeStudio?: StoreStudioProjection;

  /**
   * Temporary legacy compatibility bridge.
   *
   * Existing Store mock profiles still consume this
   * contract until their migration is completed.
   */
  experience?: FeedExperienceData;
};

import type {
  MockActiveDelivery,
  MockCouponFeed,
  MockExperienceOrder,
  MockIntelligenceFeed,
  MockPromotionFeed,
  MockRewardsFeed
} from '../mocks/mockExperienceProfiles';

export type FeedExperienceData = {
  orders: {
    recent: MockExperienceOrder[];
    activeDelivery?: MockActiveDelivery;
  };

  rewards: MockRewardsFeed;

  coupons: MockCouponFeed[];

  intelligence: MockIntelligenceFeed;

  promotions: MockPromotionFeed;
};
