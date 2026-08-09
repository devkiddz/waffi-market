export const VENDOR_STUDIO_TIERS = [
  'BASIC',
  'GROWTH',
  'PREMIUM',
  'ENTERPRISE'
] as const;

export type VendorStudioTier = (typeof VENDOR_STUDIO_TIERS)[number];

export type VendorStudioResourceLimits = {
  products: number | null;
  mediaAssets: number | null;
  collections: number | null;
  promotions: number | null;
  banners: number | null;
  stories: number | null;
  reels: number | null;
  storyAssetsPerCampaign: number | null;
  reelAssetsPerCampaign: number | null;
  teamMembers: number | null;
};

export type VendorStudioCapabilities = {
  products: boolean;
  media: boolean;
  collections: boolean;
  promotions: boolean;
  banners: boolean;
  stories: boolean;
  reels: boolean;
  video: boolean;
  scheduling: boolean;
  featuredPlacement: boolean;
  sponsoredPlacement: boolean;
};

export type ResolvedVendorStudioEntitlements = {
  id: string | null;
  vendorProfileId: string;
  configured: boolean;
  active: boolean;
  tier: VendorStudioTier;
  limits: VendorStudioResourceLimits;
  capabilities: VendorStudioCapabilities;
};

export type VendorStudioCapability = keyof VendorStudioCapabilities;

