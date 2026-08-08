import { hashPassword } from 'better-auth/crypto';

import type { PrismaClient } from '../../lib/generated/prisma/client';

import { products } from '../../data/products';

import type { SeededWorkspaces } from './workspace.seed';

const MARKETPLACE_TEST_VENDORS = [
  {
    slug: 'aj-logik',
    name: 'AJ Logik',
    email: 'aj-logik@vendors.waffi.test',
    description: 'Groceries, drinks, meals and lifestyle essentials.'
  },
  {
    slug: 'shelsea',
    name: 'Shelsea',
    email: 'shelsea@vendors.waffi.test',
    description: 'Fashion, hair, fragrance and lifestyle store.'
  },
  {
    slug: 'kora-fashion',
    name: 'Kora Fashion',
    email: 'kora-fashion@vendors.waffi.test',
    description: 'Fashion, shoes, bags and everyday accessories.'
  },
  {
    slug: 'metro-mobile',
    name: 'Metro Mobile',
    email: 'metro-mobile@vendors.waffi.test',
    description: 'Mobile phones, accessories and connected essentials.'
  },
  {
    slug: 'nova-gadgets',
    name: 'Nova Gadgets',
    email: 'nova-gadgets@vendors.waffi.test',
    description: 'Gadgets, electronics and practical tech accessories.'
  },
  {
    slug: 'freshcart-market',
    name: 'FreshCart Market',
    email: 'freshcart-market@vendors.waffi.test',
    description: 'Groceries, provisions and everyday household essentials.'
  },
  {
    slug: 'secondlife-closet',
    name: 'SecondLife Closet',
    email: 'secondlife-closet@vendors.waffi.test',
    description: 'Okirika and fairly-used fashion selected for another life.'
  },
  {
    slug: 'ankara-house',
    name: 'Ankara House',
    email: 'ankara-house@vendors.waffi.test',
    description: 'Ankara, fabrics and clothing materials for distinctive styles.'
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
    where: {
      id: accountId
    },
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
      where: {
        email: vendor.email
      },
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
      select: {
        id: true
      }
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
      update: {
        role: 'MEMBER',
        active: true
      },
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
      select: {
        id: true,
        slug: true,
        name: true
      }
    });

    await prisma.vendorMembership.upsert({
      where: {
        vendorId_userId: {
          vendorId: profile.id,
          userId: owner.id
        }
      },
      update: {
        role: 'OWNER',
        active: true
      },
      create: {
        vendorId: profile.id,
        userId: owner.id,
        role: 'OWNER',
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

  return {
    all: seeded,
    shelsea
  };
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
      id: {
        in: inheritedProductIds
      }
    },
    data: {
      vendorProfileId: input.shelseaVendorId
    }
  });

  console.log(
    `âœ“ ${result.count} inherited showcase products assigned to the Shelsea vendor.`
  );
}