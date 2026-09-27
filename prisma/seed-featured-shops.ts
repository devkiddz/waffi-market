import 'dotenv/config';

import { prisma } from './seeds/seed-utils';
import { seedFeaturedShopProducts, seedMarketplaceVendors } from './seeds/vendor.seed';
import type { SeededWorkspaces } from './seeds/workspace.seed';

async function main() {
  const rows = await prisma.workspace.findMany({
    where: { slug: { in: ['waffi-market-live', 'waffi-market-demo', 'waffi-market-practice'] } },
    select: { id: true, slug: true, name: true, mode: true }
  });
  const bySlug = (slug: string) => {
    const workspace = rows.find(row => row.slug === slug);
    if (!workspace) throw new Error(`Missing workspace ${slug}. Run the full seed first.`);
    return workspace;
  };
  const workspaces: SeededWorkspaces = {
    live: bySlug('waffi-market-live'),
    demo: bySlug('waffi-market-demo'),
    practice: bySlug('waffi-market-practice')
  };

  const vendors = await seedMarketplaceVendors(prisma, workspaces);
  await seedFeaturedShopProducts(prisma, {
    workspaceId: workspaces.live.id,
    vendors: vendors.all
  });
  console.log('Featured shop fixtures ready. Refresh the homepage.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
