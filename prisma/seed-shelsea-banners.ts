import 'dotenv/config';

import { prisma } from './seeds/seed-utils';
import { seedShelseaSpotlightBanners } from './seeds/vendor.seed';

async function main() {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'waffi-market-live' }, select: { id: true }
  });
  if (!workspace) throw new Error('Live workspace missing. Run the full seed first.');
  const shelsea = await prisma.vendorProfile.findFirst({
    where: { workspaceId: workspace.id, slug: 'shelsea', status: 'ACTIVE' },
    select: { id: true }
  });
  if (!shelsea) throw new Error('Shelsea vendor missing. Run the vendor seed first.');
  await seedShelseaSpotlightBanners(prisma, {
    workspaceId: workspace.id, shelseaVendorId: shelsea.id
  });
}

main().then(() => prisma.$disconnect()).catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
