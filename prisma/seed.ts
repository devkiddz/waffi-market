import 'dotenv/config';

import { prisma } from './seeds/seed-utils';
import { seedWorkspaces } from './seeds/workspace.seed';
import { seedMemberships } from './seeds/membership.seed';
import { seedWallets } from './seeds/wallet.seed';
import { seedScenarios } from './seeds/scenario.seed';
import { seedProvisions } from './seeds/provision.seed';
import { seedCatalog } from './seeds/catalog.seed';
import { seedExperienceEvents } from './seeds/experience.seed';
import { seedCommerce } from './seeds/commerce.seed';
import { seedHistorySettings } from './seeds/history-settings.seed';
import { seedAdminAccounts } from './seeds/admin.seed';

async function main() {
  console.log('================================');
  console.log(' SHELSEA Commerce Seed Engine');
  console.log('================================');

  const workspaces =
    await seedWorkspaces(prisma);

  await seedMemberships(
    prisma,
    workspaces
  );

  await seedAdminAccounts(
    prisma,
    workspaces
  );

  await seedWallets(
    prisma,
    workspaces
  );

  await seedHistorySettings(
    prisma,
    workspaces
  );

  await seedScenarios(prisma);

  await seedProvisions(
    prisma,
    workspaces
  );

  await seedCatalog(
    prisma,
    workspaces.live.id
  );

  await seedCommerce(
    prisma,
    workspaces
  );

  await seedExperienceEvents(
    prisma,
    workspaces
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed complete.');
  })
  .catch(async error => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
