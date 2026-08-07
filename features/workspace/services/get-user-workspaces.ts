import { resolveCommerceCapabilities } from '@/features/commerce-mode';
import { prisma } from '@/lib/prisma';

import type {
  Workspace,
  WorkspaceRuntime
} from '../workspaceTypes';

export async function getUserWorkspaces(
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<WorkspaceRuntime> {
  const coreWorkspaces = await prisma.workspace.findMany({
    where: {
      mode: {
        in: ['LIVE', 'DEMO', 'PRACTICE']
      },
      active: true
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      mode: true
    }
  });

  await Promise.all(
    coreWorkspaces.map(async workspace => {
      await prisma.workspaceMembership.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId
          }
        },
        update: {
          active: true
        },
        create: {
          workspaceId: workspace.id,
          userId,
          role: 'MEMBER',
          active: true
        }
      });

      if (
        workspace.mode === 'DEMO' ||
        workspace.mode === 'PRACTICE'
      ) {
        await prisma.demoWallet.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: workspace.id,
              userId
            }
          },
          update: {
            active: true
          },
          create: {
            workspaceId: workspace.id,
            userId,
            currency: 'NGN',
            balance:
              workspace.mode === 'DEMO'
                ? 1_000_000
                : 500_000,
            active: true
          }
        });
      }
    })
  );

  const memberships =
    await prisma.workspaceMembership.findMany({
      where: {
        userId,
        active: true,
        workspace: {
          active: true
        }
      },
      include: {
        workspace: {
          include: {
            demoWallets: {
              where: {
                userId,
                active: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

  const availableWorkspaces: Workspace[] =
    memberships.map(membership => {
      const wallet =
        membership.workspace.demoWallets[0] ?? null;

      return {
        id: membership.workspace.id,
        slug: membership.workspace.slug,
        name: membership.workspace.name,

        mode: membership.workspace.mode,
        commerceMode: membership.workspace.commerceMode,
        commerceCapabilities: resolveCommerceCapabilities(
          membership.workspace.commerceMode,
          {
            vendorApplicationsOpen:
              membership.workspace.vendorApplicationsOpen
          }
        ),
        vendorApplicationsOpen:
          membership.workspace.vendorApplicationsOpen,
        currency: membership.workspace.currency,
        timezone: membership.workspace.timezone,

        active: membership.workspace.active,
        resettable: membership.workspace.resettable,

        membership: {
          role: membership.role,
          active: membership.active
        },

        wallet: wallet
          ? {
              currency: wallet.currency,
              balance: Number(wallet.balance)
            }
          : null
      };
    });

  const activeWorkspace =
    availableWorkspaces.find(
      workspace =>
        workspace.id === preferredWorkspaceId
    ) ??
    availableWorkspaces.find(
      workspace => workspace.mode === 'LIVE'
    ) ??
    availableWorkspaces[0] ??
    null;

  return {
    activeWorkspace,
    availableWorkspaces,

    isLive: activeWorkspace?.mode === 'LIVE',
    isDemo: activeWorkspace?.mode === 'DEMO',
    isPractice:
      activeWorkspace?.mode === 'PRACTICE',
    isSandbox:
      activeWorkspace?.mode === 'SANDBOX',

    switchingWorkspace: false,
    error: null
  };
}
export async function getGuestWorkspaceRuntime(): Promise<WorkspaceRuntime> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      active: true,
      mode: 'LIVE'
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (!workspace) {
    return {
      activeWorkspace: null,
      availableWorkspaces: [],
      isLive: false,
      isDemo: false,
      isPractice: false,
      isSandbox: false,
      switchingWorkspace: false,
      error: 'The live Shelsea workspace is unavailable.'
    };
  }

  const publicWorkspace: Workspace = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    mode: workspace.mode,
    commerceMode: workspace.commerceMode,
    commerceCapabilities: resolveCommerceCapabilities(
      workspace.commerceMode,
      {
        vendorApplicationsOpen: workspace.vendorApplicationsOpen
      }
    ),
    vendorApplicationsOpen: workspace.vendorApplicationsOpen,
    currency: workspace.currency,
    timezone: workspace.timezone,
    active: workspace.active,
    resettable: false,
    membership: {
      role: 'MEMBER',
      active: true
    },
    wallet: null
  };

  return {
    activeWorkspace: publicWorkspace,
    availableWorkspaces: [publicWorkspace],
    isLive: true,
    isDemo: false,
    isPractice: false,
    isSandbox: false,
    switchingWorkspace: false,
    error: null
  };
}
