import {
  PrismaClient,
  WorkspaceMode
} from '../../lib/generated/prisma/client';

export type SeededWorkspace = {
  id: string;
  slug: string;
  name: string;
  mode: WorkspaceMode;
};

export type SeededWorkspaces = {
  live: SeededWorkspace;
  demo: SeededWorkspace;
  practice: SeededWorkspace;
};

export async function seedWorkspaces(prisma: PrismaClient) {
  console.log('Seeding Waffi Market workspaces...');

  const live = await prisma.workspace.upsert({
    where: {
      slug: 'waffi-market-live'
    },
    update: {
      name: 'Waffi Market Live',
      mode: 'LIVE',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: false,
      expiresAt: null
    },
    create: {
      slug: 'waffi-market-live',
      name: 'Waffi Market Live',
      mode: 'LIVE',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: false
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mode: true
    }
  });

  const demo = await prisma.workspace.upsert({
    where: {
      slug: 'waffi-market-demo'
    },
    update: {
      name: 'Waffi Market Demo',
      mode: 'DEMO',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: true,
      expiresAt: null
    },
    create: {
      slug: 'waffi-market-demo',
      name: 'Waffi Market Demo',
      mode: 'DEMO',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: true
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mode: true
    }
  });

  const practice = await prisma.workspace.upsert({
    where: {
      slug: 'waffi-market-practice'
    },
    update: {
      name: 'Waffi Market Practice',
      mode: 'PRACTICE',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: true,
      expiresAt: null
    },
    create: {
      slug: 'waffi-market-practice',
      name: 'Waffi Market Practice',
      mode: 'PRACTICE',
      commerceMode: 'MULTI_VENDOR',
      vendorApplicationsOpen: true,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      active: true,
      resettable: true
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mode: true
    }
  });

  console.log('Waffi Market workspaces ready.');

  return {
    live,
    demo,
    practice
  };
}