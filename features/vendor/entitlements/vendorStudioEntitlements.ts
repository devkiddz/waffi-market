import 'server-only';

import { prisma } from '@/lib/prisma';

import type {
  ResolvedVendorStudioEntitlements,
  VendorStudioCapability
} from './contracts';

function resourceEnabled(limit: number | null): boolean {
  return limit === null || limit > 0;
}

function missingEntitlements(
  vendorProfileId: string
): ResolvedVendorStudioEntitlements {
  return {
    id: null,
    vendorProfileId,
    configured: false,
    active: false,
    tier: 'BASIC',
    limits: {
      products: 0,
      mediaAssets: 0,
      collections: 0,
      promotions: 0,
      banners: 0,
      stories: 0,
      reels: 0,
      storyAssetsPerCampaign: 0,
      reelAssetsPerCampaign: 0,
      teamMembers: 0
    },
    capabilities: {
      products: false,
      media: false,
      collections: false,
      promotions: false,
      banners: false,
      stories: false,
      reels: false,
      video: false,
      scheduling: false,
      featuredPlacement: false,
      sponsoredPlacement: false
    }
  };
}

export async function resolveVendorStudioEntitlements(
  vendorProfileId: string
): Promise<ResolvedVendorStudioEntitlements> {
  const entitlement = await prisma.vendorStudioEntitlement.findUnique({
    where: { vendorProfileId }
  });

  if (!entitlement || !entitlement.active || !entitlement.configured) {
    return missingEntitlements(vendorProfileId);
  }

  const limits = {
    products: entitlement.productLimit,
    mediaAssets: entitlement.mediaAssetLimit,
    collections: entitlement.collectionLimit,
    promotions: entitlement.promotionLimit,
    banners: entitlement.bannerCampaignLimit,
    stories: entitlement.storyCampaignLimit,
    reels: entitlement.reelCampaignLimit,
    storyAssetsPerCampaign: entitlement.storyAssetLimitPerCampaign,
    reelAssetsPerCampaign: entitlement.reelAssetLimitPerCampaign,
    teamMembers: entitlement.teamMemberLimit
  };

  const mediaEnabled = resourceEnabled(limits.mediaAssets);
  const videoEnabled = mediaEnabled && entitlement.videoAllowed;
  const storiesEnabled =
    mediaEnabled &&
    resourceEnabled(limits.stories) &&
    resourceEnabled(limits.storyAssetsPerCampaign);
  const reelsEnabled =
    videoEnabled &&
    resourceEnabled(limits.reels) &&
    resourceEnabled(limits.reelAssetsPerCampaign);

  return {
    id: entitlement.id,
    vendorProfileId,
    configured: true,
    active: true,
    tier: entitlement.tier,
    limits,
    capabilities: {
      products: resourceEnabled(limits.products),
      media: mediaEnabled,
      collections: resourceEnabled(limits.collections),
      promotions: resourceEnabled(limits.promotions),
      banners: mediaEnabled && resourceEnabled(limits.banners),
      stories: storiesEnabled,
      reels: reelsEnabled,
      video: videoEnabled,
      scheduling: entitlement.schedulingAllowed,
      featuredPlacement: entitlement.featuredPlacementEligible,
      sponsoredPlacement: entitlement.sponsoredPlacementEligible
    }
  };
}

export async function requireVendorStudioCapability(
  vendorProfileId: string,
  capability: VendorStudioCapability
): Promise<ResolvedVendorStudioEntitlements> {
  const studio = await resolveVendorStudioEntitlements(vendorProfileId);

  if (!studio.active || !studio.capabilities[capability]) {
    throw new Error(
      `Vendor Studio capability "${capability}" is not available for this vendor.`
    );
  }

  return studio;
}

