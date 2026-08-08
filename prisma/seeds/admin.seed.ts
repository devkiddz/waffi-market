import {
  randomUUID
} from 'node:crypto';

import {
  hashPassword
} from 'better-auth/crypto';

import type {
  PrismaClient
} from '../../lib/generated/prisma/client';

import type {
  SeededWorkspaces
} from './workspace.seed';

const DEVELOPER_EMAIL =
  'developer@rcentzlab.com';

const LEGACY_DEVELOPER_EMAIL =
  'devkiddzadmin@recentzadmin.com';

const DEMO_EMAIL =
  'demo.superadmin@waffi.test';

const DEVELOPER_NAME =
  process.env.DEVELOPER_ADMIN_NAME?.trim() ||
  'RCENTZ Developer Super Admin';

async function ensureCredentialAccount(
  prisma: PrismaClient,
  input: {
    userId: string;
    password: string;
  }
): Promise<void> {
  const passwordHash =
    await hashPassword(
      input.password
    );

  const existingAccount =
    await prisma.account.findFirst({
      where: {
        userId:
          input.userId,

        providerId:
          'credential'
      },

      select: {
        id: true
      }
    });

  if (existingAccount) {
    await prisma.account.update({
      where: {
        id:
          existingAccount.id
      },

      data: {
        accountId:
          input.userId,

        password:
          passwordHash
      }
    });

    return;
  }

  await prisma.account.create({
    data: {
      id:
        randomUUID(),

      accountId:
        input.userId,

      providerId:
        'credential',

      userId:
        input.userId,

      password:
        passwordHash
    }
  });
}

async function ensureSuperAdminMembership(
  prisma: PrismaClient,
  input: {
    workspaceId: string;
    userId: string;
  }
): Promise<void> {
  await prisma.workspaceMembership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId:
          input.workspaceId,

        userId:
          input.userId
      }
    },

    update: {
      role:
        'SUPER_ADMIN',

      active:
        true
    },

    create: {
      workspaceId:
        input.workspaceId,

      userId:
        input.userId,

      role:
        'SUPER_ADMIN',

      active:
        true
    }
  });
}

async function seedDeveloperAdmin(
  prisma: PrismaClient,
  workspaces: SeededWorkspaces
): Promise<void> {
  const developerPassword =
    process.env
      .DEVELOPER_ADMIN_PASSWORD
      ?.trim();

  let developer =
    await prisma.user.findFirst({
      where: {
        email: {
          in: [
            DEVELOPER_EMAIL,
            LEGACY_DEVELOPER_EMAIL
          ]
        }
      },

      select: {
        id: true
      }
    });

  if (!developer) {
    if (!developerPassword) {
      console.warn(
        `Developer Super Admin ${DEVELOPER_EMAIL} does not exist yet. Set DEVELOPER_ADMIN_PASSWORD and run the seed again to create it securely.`
      );

      return;
    }

    developer =
      await prisma.user.create({
        data: {
          id:
            randomUUID(),

          name:
            DEVELOPER_NAME,

          email:
            DEVELOPER_EMAIL,

          emailVerified:
            true,

          tier:
            'member',

          accountState:
            'ACTIVE',

          isGhostDeveloper:
            true
        },

        select: {
          id: true
        }
      });
  }

  await prisma.user.update({
    where: {
      id:
        developer.id
    },

    data: {
      name:
        DEVELOPER_NAME,

      email:
        DEVELOPER_EMAIL,

      emailVerified:
        true,

      isGhostDeveloper:
        true,

      accountState:
        'ACTIVE',

      lockedUntil:
        null,

      restrictionReason:
        null
    }
  });

  if (developerPassword) {
    await ensureCredentialAccount(
      prisma,
      {
        userId:
          developer.id,

        password:
          developerPassword
      }
    );
  } else {
    console.warn(
      'DEVELOPER_ADMIN_PASSWORD is not set. The existing developer password was left unchanged.'
    );
  }

  await Promise.all([
    workspaces.live.id,
    workspaces.demo.id,
    workspaces.practice.id
  ].map(
    workspaceId =>
      ensureSuperAdminMembership(
        prisma,
        {
          workspaceId,
          userId:
            developer.id
        }
      )
  ));

  console.log(
    `Developer Super Admin ready: ${DEVELOPER_EMAIL}`
  );
}

async function seedDemoAdmin(
  prisma: PrismaClient,
  workspaces: SeededWorkspaces
): Promise<void> {
  const demoPassword =
    process.env
      .DEMO_ADMIN_PASSWORD;

  if (!demoPassword) {
    throw new Error(
      'DEMO_ADMIN_PASSWORD is required when creating the demo Super Admin identity.'
    );
  }

  let demo =
    await prisma.user.findUnique({
      where: {
        email:
          DEMO_EMAIL
      },

      select: {
        id: true
      }
    });

  if (!demo) {
    demo =
      await prisma.user.create({
        data: {
          id:
            randomUUID(),

          name:
            'Waffi Market Demo Super Admin',

          email:
            DEMO_EMAIL,

          emailVerified:
            true,

          tier:
            'member',

          accountState:
            'ACTIVE',

          isGhostDeveloper:
            false
        },

        select: {
          id: true
        }
      });
  } else {
    await prisma.user.update({
      where: {
        id:
          demo.id
      },

      data: {
        name:
          'Waffi Market Demo Super Admin',

        emailVerified:
          true,

        accountState:
          'ACTIVE',

        lockedUntil:
          null,

        restrictionReason:
          null
      }
    });
  }

  await ensureCredentialAccount(
    prisma,
    {
      userId:
        demo.id,

      password:
        demoPassword
    }
  );

  await ensureSuperAdminMembership(
    prisma,
    {
      workspaceId:
        workspaces.demo.id,

      userId:
        demo.id
    }
  );

  console.log(
    `Demo Super Admin ready: ${DEMO_EMAIL}`
  );
}

export async function seedAdminAccounts(
  prisma: PrismaClient,
  workspaces: SeededWorkspaces
): Promise<void> {
  await seedDeveloperAdmin(
    prisma,
    workspaces
  );

  await seedDemoAdmin(
    prisma,
    workspaces
  );
}

