import { hashPassword } from 'better-auth/crypto';

import type { PrismaClient } from '../../lib/generated/prisma/client';

import { products } from '../../data/products';

import type { SeededWorkspaces } from './workspace.seed';

const MARKETPLACE_TEST_VENDORS = [
  {
    slug: 'aj-logik',
    name: 'AJ Logik',
    email: 'aj-logik@vendors.waffi.test',
    description: 'Groceries, drinks, meals and lifestyle essentials.',
    studio: {
      tier: 'ENTERPRISE',
      productLimit: null,
      mediaAssetLimit: null,
      collectionLimit: null,
      promotionLimit: null,
      bannerCampaignLimit: null,
      storyCampaignLimit: null,
      reelCampaignLimit: null,
      storyAssetLimitPerCampaign: null,
      reelAssetLimitPerCampaign: null,
      teamMemberLimit: null,
      videoAllowed: true,
      schedulingAllowed: true,
      featuredPlacementEligible: true,
      sponsoredPlacementEligible: true
    }
  },
  {
    slug: 'shelsea',
    name: 'Shelsea',
    email: 'shelsea@vendors.waffi.test',
    description: 'Fashion, hair, fragrance and lifestyle store.',
    studio: {
      tier: 'PREMIUM',
      productLimit: 500,
      mediaAssetLimit: 1200,
      collectionLimit: 40,
      promotionLimit: 40,
      bannerCampaignLimit: 12,
      storyCampaignLimit: 35,
      reelCampaignLimit: 25,
      storyAssetLimitPerCampaign: 15,
      reelAssetLimitPerCampaign: 15,
      teamMemberLimit: 10,
      videoAllowed: true,
      schedulingAllowed: true,
      featuredPlacementEligible: true,
      sponsoredPlacementEligible: true
    }
  },
  {
    slug: 'kora-fashion',
    name: 'Kora Fashion',
    email: 'kora-fashion@vendors.waffi.test',
    description: 'Fashion, shoes, bags and everyday accessories.',
    studio: {
      tier: 'PREMIUM',
      productLimit: 300,
      mediaAssetLimit: 700,
      collectionLimit: 30,
      promotionLimit: 30,
      bannerCampaignLimit: 10,
      storyCampaignLimit: 30,
      reelCampaignLimit: 20,
      storyAssetLimitPerCampaign: 12,
      reelAssetLimitPerCampaign: 12,
      teamMemberLimit: 8,
      videoAllowed: true,
      schedulingAllowed: true,
      featuredPlacementEligible: true,
      sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'metro-mobile',
    name: 'Metro Mobile',
    email: 'metro-mobile@vendors.waffi.test',
    description: 'Mobile phones, accessories and connected essentials.',
    studio: {
      tier: 'PREMIUM',
      productLimit: 300,
      mediaAssetLimit: 700,
      collectionLimit: 30,
      promotionLimit: 30,
      bannerCampaignLimit: 10,
      storyCampaignLimit: 30,
      reelCampaignLimit: 20,
      storyAssetLimitPerCampaign: 12,
      reelAssetLimitPerCampaign: 12,
      teamMemberLimit: 8,
      videoAllowed: true,
      schedulingAllowed: true,
      featuredPlacementEligible: true,
      sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'nova-gadgets',
    name: 'Nova Gadgets',
    email: 'nova-gadgets@vendors.waffi.test',
    description: 'Gadgets, electronics and practical tech accessories.',
    studio: {
      tier: 'GROWTH',
      productLimit: 150,
      mediaAssetLimit: 300,
      collectionLimit: 15,
      promotionLimit: 15,
      bannerCampaignLimit: 4,
      storyCampaignLimit: 12,
      reelCampaignLimit: 6,
      storyAssetLimitPerCampaign: 8,
      reelAssetLimitPerCampaign: 6,
      teamMemberLimit: 4,
      videoAllowed: true,
      schedulingAllowed: false,
      featuredPlacementEligible: false,
      sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'freshcart-market',
    name: 'FreshCart Market',
    email: 'freshcart-market@vendors.waffi.test',
    description: 'Groceries, provisions and everyday household essentials.',
    studio: {
      tier: 'GROWTH',
      productLimit: 150,
      mediaAssetLimit: 300,
      collectionLimit: 15,
      promotionLimit: 15,
      bannerCampaignLimit: 4,
      storyCampaignLimit: 12,
      reelCampaignLimit: 6,
      storyAssetLimitPerCampaign: 8,
      reelAssetLimitPerCampaign: 6,
      teamMemberLimit: 4,
      videoAllowed: true,
      schedulingAllowed: false,
      featuredPlacementEligible: false,
      sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'secondlife-closet',
    name: 'SecondLife Closet',
    email: 'secondlife-closet@vendors.waffi.test',
    description: 'Okirika and fairly-used fashion selected for another life.',
    studio: {
      tier: 'BASIC',
      productLimit: 75,
      mediaAssetLimit: 150,
      collectionLimit: 8,
      promotionLimit: 8,
      bannerCampaignLimit: 2,
      storyCampaignLimit: 6,
      reelCampaignLimit: 0,
      storyAssetLimitPerCampaign: 6,
      reelAssetLimitPerCampaign: 0,
      teamMemberLimit: 2,
      videoAllowed: false,
      schedulingAllowed: false,
      featuredPlacementEligible: false,
      sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'ankara-house',
    name: 'Ankara House',
    email: 'ankara-house@vendors.waffi.test',
    description: 'Ankara, fabrics and clothing materials for distinctive styles.',
    studio: {
      tier: 'BASIC',
      productLimit: 75,
      mediaAssetLimit: 150,
      collectionLimit: 8,
      promotionLimit: 8,
      bannerCampaignLimit: 2,
      storyCampaignLimit: 6,
      reelCampaignLimit: 0,
      storyAssetLimitPerCampaign: 6,
      reelAssetLimitPerCampaign: 0,
      teamMemberLimit: 2,
      videoAllowed: false,
      schedulingAllowed: false,
      featuredPlacementEligible: false,
      sponsoredPlacementEligible: false
    }
  }
] as const;

export type SeededMarketplaceVendor = {
  id: string;
  slug: string;
  name: string;
  ownerUserId: string;
};

export type SeededMarketplaceVendors = {
  all: SeededMarketplaceVendor[];
  shelsea: SeededMarketplaceVendor;
};

async function ensureCredentialAccount(
  prisma: PrismaClient,
  input: {
    vendorSlug: string;
    userId: string;
    password: string;
  }
): Promise<void> {
  const passwordHash = await hashPassword(input.password);
  const accountId = `waffi-vendor-credential-${input.vendorSlug}`;

  await prisma.account.upsert({
    where: { id: accountId },
    update: {
      accountId: input.userId,
      providerId: 'credential',
      userId: input.userId,
      password: passwordHash
    },
    create: {
      id: accountId,
      accountId: input.userId,
      providerId: 'credential',
      userId: input.userId,
      password: passwordHash
    }
  });
}

export async function seedMarketplaceVendors(
  prisma: PrismaClient,
  workspaces: SeededWorkspaces
): Promise<SeededMarketplaceVendors> {
  const password = process.env.MARKETPLACE_VENDOR_PASSWORD?.trim();

  if (!password) {
    throw new Error(
      'MARKETPLACE_VENDOR_PASSWORD is required to create the Waffi Market test vendor accounts.'
    );
  }

  console.log('Seeding Waffi Market test vendors...');

  const seeded: SeededMarketplaceVendor[] = [];

  for (const vendor of MARKETPLACE_TEST_VENDORS) {
    const owner = await prisma.user.upsert({
      where: { email: vendor.email },
      update: {
        name: `${vendor.name} Vendor Owner`,
        emailVerified: false,
        accountState: 'ACTIVE',
        lockedUntil: null,
        restrictionReason: null,
        isGhostDeveloper: false,
        platformRole: 'STANDARD'
      },
      create: {
        id: `waffi-vendor-owner-${vendor.slug}`,
        name: `${vendor.name} Vendor Owner`,
        email: vendor.email,
        emailVerified: false,
        tier: 'member',
        accountState: 'ACTIVE',
        isGhostDeveloper: false,
        platformRole: 'STANDARD'
      },
      select: { id: true }
    });

    await ensureCredentialAccount(prisma, {
      vendorSlug: vendor.slug,
      userId: owner.id,
      password
    });

    await prisma.workspaceMembership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspaces.live.id,
          userId: owner.id
        }
      },
      update: { role: 'MEMBER', active: true },
      create: {
        workspaceId: workspaces.live.id,
        userId: owner.id,
        role: 'MEMBER',
        active: true
      }
    });

    const profile = await prisma.vendorProfile.upsert({
      where: {
        workspaceId_slug: {
          workspaceId: workspaces.live.id,
          slug: vendor.slug
        }
      },
      update: {
        ownerUserId: owner.id,
        name: vendor.name,
        description: vendor.description,
        email: vendor.email,
        status: 'ACTIVE',
        active: true,
        approvedAt: new Date(),
        suspendedAt: null
      },
      create: {
        workspaceId: workspaces.live.id,
        ownerUserId: owner.id,
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        email: vendor.email,
        status: 'ACTIVE',
        active: true,
        approvedAt: new Date()
      },
      select: { id: true, slug: true, name: true }
    });

    await prisma.vendorMembership.upsert({
      where: {
        vendorId_userId: {
          vendorId: profile.id,
          userId: owner.id
        }
      },
      update: { role: 'OWNER', active: true },
      create: {
        vendorId: profile.id,
        userId: owner.id,
        role: 'OWNER',
        active: true
      }
    });

    await prisma.vendorStudioEntitlement.upsert({
      where: { vendorProfileId: profile.id },
      update: {
        ...vendor.studio,
        configured: true,
        active: true
      },
      create: {
        vendorProfileId: profile.id,
        ...vendor.studio,
        configured: true,
        active: true
      }
    });

    seeded.push({
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      ownerUserId: owner.id
    });
  }

  const shelsea = seeded.find(vendor => vendor.slug === 'shelsea');

  if (!shelsea) {
    throw new Error('Shelsea test vendor was not created.');
  }

  console.log(`âœ“ ${seeded.length} independent Waffi Market vendors ready.`);
  console.log('✓ Vendor Studio entitlement matrix ready.');

  return { all: seeded, shelsea };
}

export async function assignShelseaShowcaseCatalog(
  prisma: PrismaClient,
  input: {
    workspaceId: string;
    shelseaVendorId: string;
  }
): Promise<void> {
  const inheritedProductIds = products.map(product => product.id);

  const result = await prisma.product.updateMany({
    where: {
      workspaceId: input.workspaceId,
      id: { in: inheritedProductIds }
    },
    data: { vendorProfileId: input.shelseaVendorId }
  });

  console.log(
    `âœ“ ${result.count} inherited showcase products assigned to the Shelsea vendor.`
  );
}
