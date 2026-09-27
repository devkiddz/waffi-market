import 'dotenv/config';

import { prisma } from './seeds/seed-utils';

async function main() {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { slug: 'waffi-market-live' }, select: { id: true }
  });
  const now = new Date();
  const shops = await prisma.vendorProfile.findMany({
    where: {
      workspaceId: workspace.id,
      slug: { in: ['shelsea', 'kora-fashion', 'crown-hair', 'scent-house', 'the-bag-edit'] }
    },
    select: {
      name: true,
      slug: true,
      campaigns: {
        where: {
          type: 'STORY', active: true, status: { in: ['ACTIVE', 'SCHEDULED'] },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
          ]
        },
        select: { assets: { where: { active: true }, select: { id: true, mediaUrl: true } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  for (const shop of shops) {
    const assets = shop.campaigns.flatMap(campaign => campaign.assets);
    console.log(`${shop.name}: ${assets.length} active story asset(s) — /shops/${shop.slug}`);
  }
  if (shops.length !== 5 || shops.some(shop => !shop.campaigns.some(c => c.assets.some(a => a.mediaUrl)))) {
    throw new Error('A featured shop is missing a playable active story. Run the focused seed first.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
