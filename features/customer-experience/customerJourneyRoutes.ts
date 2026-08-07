export const CUSTOMER_JOURNEY_SLUGS = [
  'recent-views',
  'wishlist',
  'cart',
  'activity',
  'orders',
  'deliveries'
] as const;

export type CustomerJourneySlug =
  (typeof CUSTOMER_JOURNEY_SLUGS)[number];

export type CustomerJourneyDefinition = {
  slug: CustomerJourneySlug;
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  historyTitle: string;
  historySubtitle: string;
};

const CUSTOMER_JOURNEY_DEFINITIONS = {
  'recent-views': {
    slug: 'recent-views',
    code: 'RV',
    eyebrow: 'Browsing memory',
    title: 'Recent Views',
    description:
      'Revisit every product that recently caught your attention, compare availability and continue from the exact point where your discovery journey paused.',
    historyTitle: 'Recent Views journey',
    historySubtitle: 'Products recently explored across Shelsea.'
  },

  wishlist: {
    slug: 'wishlist',
    code: 'WL',
    eyebrow: 'Saved interests',
    title: 'Wishlist',
    description:
      'A richer view of the products you deliberately saved, including availability, stock pressure, estimated value and the strongest signals in your current interests.',
    historyTitle: 'Wishlist journey',
    historySubtitle: 'Saved products and current availability.'
  },

  cart: {
    slug: 'cart',
    code: 'CT',
    eyebrow: 'Purchase preparation',
    title: 'Cart Journey',
    description:
      'Inspect the complete state of your current cart, including variants, quantities, line totals, availability and the value already prepared for checkout.',
    historyTitle: 'Cart journey',
    historySubtitle: 'Current cart composition and purchase readiness.'
  },

  activity: {
    slug: 'activity',
    code: 'AA',
    eyebrow: 'Experience memory',
    title: 'Activity Archive',
    description:
      'Explore the meaningful experiences Shelsea has preserved for you across products, categories, campaigns, collections, searches and Discovery Hub interactions.',
    historyTitle: 'Activity Archive journey',
    historySubtitle: 'Recorded experience transitions and discovery context.'
  },

  orders: {
    slug: 'orders',
    code: 'OH',
    eyebrow: 'Commerce record',
    title: 'Order History',
    description:
      'Review complete order records, payment state, item composition, delivery information and the financial breakdown of your recent Shelsea purchases.',
    historyTitle: 'Order History journey',
    historySubtitle: 'Recent orders, payments and delivery records.'
  },

  deliveries: {
    slug: 'deliveries',
    code: 'OD',
    eyebrow: 'Fulfilment progress',
    title: 'On Delivery',
    description:
      'Follow every active fulfilment journey with tracking readiness, delivery milestones, estimated arrival, item details and the latest recorded movement.',
    historyTitle: 'On Delivery journey',
    historySubtitle: 'Active fulfilment and delivery progress.'
  }
} satisfies Record<
  CustomerJourneySlug,
  CustomerJourneyDefinition
>;

export function isCustomerJourneySlug(
  value: string
): value is CustomerJourneySlug {
  return (
    CUSTOMER_JOURNEY_SLUGS as readonly string[]
  ).includes(value);
}

export function getCustomerJourneyDefinition(
  slug: CustomerJourneySlug
): CustomerJourneyDefinition {
  return CUSTOMER_JOURNEY_DEFINITIONS[slug];
}
