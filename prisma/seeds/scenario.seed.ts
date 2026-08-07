import type {
  DemoScenarioType,
  PrismaClient
} from '../../lib/generated/prisma/client';

type ScenarioSeed = {
  slug: string;
  name: string;
  type: DemoScenarioType;
  description: string;
};

export async function seedScenarios(prisma: PrismaClient) {
  console.log('Seeding demo scenarios...');

  const scenarios: ScenarioSeed[] = [
    {
      slug: 'empty-workspace',
      name: 'Empty Workspace',
      type: 'EMPTY',
      description:
        'A fresh installation with no products, orders or customer activity.'
    },
    {
      slug: 'aj-logik-demo',
      name: 'Shelsea Commerce Demo',
      type: 'SUPERMARKET',
      description:
        'Complete supermarket experience populated with demo customers, products and paper transactions.'
    },
    {
      slug: 'practice-mode',
      name: 'Practice Mode',
      type: 'SUPERMARKET',
      description:
        'Allows members to shop with paper money without affecting live data.'
    },
    {
      slug: 'weekend-rush',
      name: 'Weekend Rush',
      type: 'SUPERMARKET',
      description:
        'High customer traffic, many orders, inventory movement and active deliveries.'
    },
    {
      slug: 'vip-member',
      name: 'VIP Shopper Journey',
      type: 'SUPERMARKET',
      description:
        'Simulates a loyal premium customer with coupons, recommendations and repeat purchases.'
    },
    {
      slug: 'hospitality',
      name: 'Hospitality Experience',
      type: 'HOSPITALITY',
      description:
        'Restaurant, lounge and hotel ordering experience.'
    },
    {
      slug: 'fashion-store',
      name: 'Fashion Retail',
      type: 'FASHION',
      description:
        'Retail clothing catalogue with variants and seasonal promotions.'
    },
    {
      slug: 'events',
      name: 'Events Experience',
      type: 'EVENTS',
      description:
        'Campaigns, reservations, party plans and ticket-style purchasing.'
    }
  ];

  for (const scenario of scenarios) {
    await prisma.demoScenario.upsert({
      where: {
        slug: scenario.slug
      },
      update: {
        name: scenario.name,
        type: scenario.type,
        description: scenario.description,
        active: true
      },
      create: {
        ...scenario,
        active: true
      }
    });
  }

  console.log(`✓ ${scenarios.length} demo scenarios ready.`);
}