import { hashPassword } from 'better-auth/crypto';

import type { PrismaClient } from '../../lib/generated/prisma/client';

import { products } from '../../data/products';
import { categories as categoryDefinitions } from '../../data/categories';

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
  },
  {
    slug: 'crown-hair',
    name: 'Crown Hair',
    email: 'crown-hair@vendors.waffi.test',
    description: 'Wigs, hair care and everyday styling essentials.',
    studio: {
      tier: 'GROWTH', productLimit: 150, mediaAssetLimit: 300,
      collectionLimit: 15, promotionLimit: 15, bannerCampaignLimit: 4,
      storyCampaignLimit: 12, reelCampaignLimit: 6,
      storyAssetLimitPerCampaign: 8, reelAssetLimitPerCampaign: 6,
      teamMemberLimit: 4, videoAllowed: true, schedulingAllowed: false,
      featuredPlacementEligible: true, sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'scent-house',
    name: 'Scent House',
    email: 'scent-house@vendors.waffi.test',
    description: 'Fragrance edits for everyday moments and special occasions.',
    studio: {
      tier: 'GROWTH', productLimit: 150, mediaAssetLimit: 300,
      collectionLimit: 15, promotionLimit: 15, bannerCampaignLimit: 4,
      storyCampaignLimit: 12, reelCampaignLimit: 6,
      storyAssetLimitPerCampaign: 8, reelAssetLimitPerCampaign: 6,
      teamMemberLimit: 4, videoAllowed: true, schedulingAllowed: false,
      featuredPlacementEligible: true, sponsoredPlacementEligible: false
    }
  },
  {
    slug: 'the-bag-edit',
    name: 'The Bag Edit',
    email: 'the-bag-edit@vendors.waffi.test',
    description: 'Everyday bags and occasion-ready accessories.',
    studio: {
      tier: 'GROWTH', productLimit: 150, mediaAssetLimit: 300,
      collectionLimit: 15, promotionLimit: 15, bannerCampaignLimit: 4,
      storyCampaignLimit: 12, reelCampaignLimit: 6,
      storyAssetLimitPerCampaign: 8, reelAssetLimitPerCampaign: 6,
      teamMemberLimit: 4, videoAllowed: true, schedulingAllowed: false,
      featuredPlacementEligible: true, sponsoredPlacementEligible: false
    }
  }
] as const;

const SHOWCASE_IMAGES: Record<string, string> = {
  shelsea: '/shelsea/brand/shelsea-mark-rose-500.png',
  'kora-fashion': '/shelsea/stories/new-season.png',
  'crown-hair': '/shelsea/stories/wig-room.png',
  'scent-house': '/shelsea/stories/women-scents.png',
  'the-bag-edit': '/shelsea/stories/bags.png'
};

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

    const image = SHOWCASE_IMAGES[vendor.slug];
    if (image) {
      const asset = await prisma.mediaAsset.upsert({
        where: { publicId: `waffi-seed-vendor-${vendor.slug}` },
        update: { secureUrl: image, vendorProfileId: profile.id, status: 'ACTIVE' },
        create: {
          workspaceId: workspaces.live.id,
          uploadedById: owner.id,
          vendorProfileId: profile.id,
          publicId: `waffi-seed-vendor-${vendor.slug}`,
          secureUrl: image,
          resourceType: 'IMAGE',
          status: 'ACTIVE'
        },
        select: { id: true }
      });
      await prisma.vendorProfile.update({
        where: { id: profile.id },
        data: { logoMediaAssetId: asset.id }
      });
    }

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

/** Curated showcase fixtures. Existing Shelsea products retain their ownership. */
export async function seedFeaturedShopProducts(
  prisma: PrismaClient,
  input: { workspaceId: string; vendors: SeededMarketplaceVendor[] }
): Promise<void> {
  const showcase = [
    { slug: 'kora-fashion', category: 'clothing', samples: 4 },
    { slug: 'crown-hair', category: 'hair', samples: 4 },
    { slug: 'scent-house', category: 'perfumes', samples: 4 },
    { slug: 'the-bag-edit', category: 'apparel-accessories', samples: 4 }
  ] as const;

  for (const group of showcase) {
    const vendor = input.vendors.find(item => item.slug === group.slug);
    if (!vendor) throw new Error(`Missing seeded showcase vendor: ${group.slug}`);

    const samples = products.filter(item =>
      item.category === group.category &&
      (group.slug !== 'the-bag-edit' || item.subcategory === 'bags')
    ).slice(0, group.samples);

    for (const sample of samples) {
      const id = `waffi-showcase-${vendor.slug}-${sample.id}`;
      const category = await prisma.category.findUniqueOrThrow({
        where: { slug: sample.category }, select: { id: true }
      });
      const subcategory = sample.subcategory
        ? await prisma.subcategory.findUnique({
            where: { categoryId_slug: { categoryId: category.id, slug: sample.subcategory } },
            select: { id: true }
          })
        : null;
      const data = {
        workspaceId: input.workspaceId,
        vendorProfileId: vendor.id,
        slug: `${vendor.slug}-${sample.slug}`,
        name: sample.name,
        shortDescription: sample.shortDescription,
        longDescription: `${sample.name} is part of the ${vendor.name} showcase collection.`,
        categoryId: category.id,
        subcategoryId: subcategory?.id ?? null,
        tags: sample.tags.filter(tag => tag !== 'Shelsea'),
        rating: sample.rating,
        reviewsCount: sample.reviews,
        soldCount: 0,
        featured: false,
        isNew: true,
        active: true,
        status: 'PUBLISHED' as const,
        estimatedDelivery: sample.estimatedDelivery,
        discountPercentage: sample.discountPercentage
      };
      await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } });

      for (const [position, variant] of sample.variants.entries()) {
        const image = variant.image;
        const variantId = `${id}-${variant.id}`;
        await prisma.productVariant.upsert({
          where: { id: variantId },
          update: { label: variant.label, image, price: variant.price, position, active: true },
          create: {
            id: variantId, productId: id, label: variant.label, image,
            price: variant.price, position, active: true
          }
        });
        await prisma.inventory.upsert({
          where: { variantId },
          update: { quantity: variant.stockLeft },
          create: { variantId, quantity: variant.stockLeft }
        });
      }

      const url = sample.variants[0]?.image;
      if (url) {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        await prisma.productImage.create({
          data: { productId: id, url, alt: sample.name, position: 0, primary: true }
        });
      }
    }
    console.log(`Showcase shop ${vendor.name}: ${samples.length} published products.`);
  }

  // Use the same published Studio campaign model as real vendor stories.
  // Stable IDs preserve viewed state when the development seed is rerun.
  for (const slug of ['shelsea', ...showcase.map(group => group.slug)]) {
    const vendor = input.vendors.find(item => item.slug === slug);
    if (!vendor) continue;
    const seededIds = slug === 'shelsea'
      ? products.slice(0, 2).map(product => product.id)
      : products
          .filter(product => product.category === showcase.find(group => group.slug === slug)?.category
            && (slug !== 'the-bag-edit' || product.subcategory === 'bags'))
          .slice(0, 2)
          .map(product => `waffi-showcase-${slug}-${product.id}`);
    const storyProducts = await prisma.product.findMany({
      where: {
        id: { in: seededIds }, workspaceId: input.workspaceId,
        vendorProfileId: vendor.id, status: 'PUBLISHED', active: true
      },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } }
    });
    if (!storyProducts.length) continue;

    const campaignId = `waffi-seed-story-${slug}`;
    await prisma.storeStudioCampaign.upsert({
      where: { id: campaignId },
      update: { active: true, status: 'ACTIVE', vendorProfileId: vendor.id },
      create: {
        id: campaignId, workspaceId: input.workspaceId, vendorProfileId: vendor.id,
        type: 'STORY', title: `${vendor.name} showcase`, status: 'ACTIVE', active: true
      }
    });
    for (const [position, productId] of seededIds.entries()) {
      const product = storyProducts.find(item => item.id === productId);
      const mediaUrl = product?.images[0]?.url;
      if (!product || !mediaUrl) continue;
      await prisma.storeStudioAsset.upsert({
        where: { id: `${campaignId}-${position}` },
        update: {
          mediaUrl, coverUrl: mediaUrl, productId: product.id,
          title: product.name, position, active: true
        },
        create: {
          id: `${campaignId}-${position}`, campaignId,
          mediaType: 'IMAGE', mediaUrl, coverUrl: mediaUrl,
          productId: product.id, title: product.name,
          actionLabel: 'View product', durationSeconds: 5,
          position, active: true
        }
      });
    }
    console.log(`Showcase stories ready for ${vendor.name}.`);
  }
}

/** Three stable, replaceable demo slides for Shelsea's featured storefront placement. */
export async function seedShelseaSpotlightBanners(
  prisma: PrismaClient,
  input: { workspaceId: string; shelseaVendorId: string }
): Promise<void> {
  const campaignId = 'waffi-seed-shelsea-spotlight-banners';
  await prisma.storeStudioCampaign.upsert({
    where: { id: campaignId },
    update: {
      workspaceId: input.workspaceId, vendorProfileId: input.shelseaVendorId,
      active: true, status: 'ACTIVE', placementTier: 'FEATURED'
    },
    create: {
      id: campaignId, workspaceId: input.workspaceId, vendorProfileId: input.shelseaVendorId,
      type: 'BANNER', title: 'Shelsea storefront spotlight',
      active: true, status: 'ACTIVE', placementTier: 'FEATURED'
    }
  });

  const slides = [
    { category: 'clothing', title: 'Style for every day', description: 'Discover the latest clothing from Shelsea.' },
    { category: 'hair', title: 'Your next hair edit', description: 'Explore hair pieces and care essentials.' },
    { category: 'perfumes', title: 'Find your signature scent', description: 'Meet fragrances made for every moment.' }
  ] as const;

  for (const [position, slide] of slides.entries()) {
    const image = categoryDefinitions.find(category => category.slug === slide.category)?.coverImages?.[0];
    if (!image) throw new Error(`Missing showcase image for ${slide.category}`);
    await prisma.storeStudioAsset.upsert({
      where: { id: `${campaignId}-${position}` },
      update: {
        mediaType: 'IMAGE', mediaUrl: image, title: slide.title,
        description: slide.description, eyebrow: 'Shelsea spotlight',
        actionLabel: 'Visit shop', actionHref: '/shops/shelsea',
        durationSeconds: 6, position, active: true
      },
      create: {
        id: `${campaignId}-${position}`, campaignId,
        mediaType: 'IMAGE', mediaUrl: image, title: slide.title,
        description: slide.description, eyebrow: 'Shelsea spotlight',
        actionLabel: 'Visit shop', actionHref: '/shops/shelsea',
        durationSeconds: 6, position, active: true
      }
    });
  }
  console.log('Shelsea spotlight: 3 banner slides ready.');
}
