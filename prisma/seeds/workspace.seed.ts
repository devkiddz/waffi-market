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
  console.log('Seeding RCENTZ workspaces...');

  const live = await prisma.workspace.upsert({
    where: {
      slug: 'shelsea-commerce-live'
    },
    update: {
      name: 'Shelsea Commerce Live',
      mode: 'LIVE',
      active: true,
      resettable: false,
      expiresAt: null
    },
    create: {
      slug: 'shelsea-commerce-live',
      name: 'Shelsea Commerce Live',
      mode: 'LIVE',
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
      slug: 'shelsea-commerce-demo'
    },
    update: {
      name: 'Shelsea Commerce Demo',
      mode: 'DEMO',
      active: true,
      resettable: true,
      expiresAt: null
    },
    create: {
      slug: 'shelsea-commerce-demo',
      name: 'Shelsea Commerce Demo',
      mode: 'DEMO',
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
      slug: 'shelsea-commerce-practice'
    },
    update: {
      name: 'Shelsea Commerce Practice',
      mode: 'PRACTICE',
      active: true,
      resettable: true,
      expiresAt: null
    },
    create: {
      slug: 'shelsea-commerce-practice',
      name: 'Shelsea Commerce Practice',
      mode: 'PRACTICE',
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

  console.log('RCENTZ workspaces ready.');

  return {
    live,
    demo,
    practice
  };
}