import type {
  FeedActivityContext,
  FeedUserContext
} from '../contracts';

export type MockExperienceProfileId =
  | 'guest'
  | 'explorer'
  | 'shopper'
  | 'premium';

export type MockOrderStatus =
  | 'confirmed'
  | 'packed'
  | 'on-the-way'
  | 'delivered';

export type MockExperienceOrder = {
  id: string;
  productIds: string[];
  status: MockOrderStatus;
  total: number;
  createdAt: string;
};

export type MockActiveDelivery = {
  orderId: string;
  status: Exclude<MockOrderStatus, 'delivered'>;

  etaMinutes: number;
  progress: number;

  location: {
    title: string;
    subtitle?: string;

    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  timeline: {
    id: string;
    label: string;
    completed?: boolean;
    active?: boolean;
    time?: string;
  }[];

  conditions: {
    label: string;
    value: string;
  }[];
};

export type MockRewardsFeed = {
  tier: 'guest' | 'member' | 'premium';

  points: number;
  coupons: number;

  expiringPoints?: number;
  progressToNextTier: number;

  nextTier?: string;
};

export type MockCouponFeed = {
  id: string;
  title: string;
  description: string;
  badge: string;
  image: string;
};

export type MockIntelligenceFeed = {
  headline: string;
  insight: string;

  preferredCategorySlug?: string;

  suggestedProductIds: string[];
  pairingProductIds: string[];
};

export type MockPromotionFeed = {
  featuredPromoIds: string[];
  bannerMessage: string;
};

export type MockExperienceProfile = {
  id: MockExperienceProfileId;

  label: string;
  description: string;

  user: FeedUserContext;
  activity: FeedActivityContext;

  orders: {
    recent: MockExperienceOrder[];
    activeDelivery?: MockActiveDelivery;
  };

  rewards: MockRewardsFeed;

  coupons: MockCouponFeed[];

  intelligence: MockIntelligenceFeed;

  promotions: MockPromotionFeed;
};

export const mockExperienceProfiles: MockExperienceProfile[] = [
  {
    id: 'guest',

    label: 'Guest',

    description:
      'A first-time visitor discovering the Shelsea experience.',

    user: {
      sessionId: 'mock-guest-session',
      authenticated: false,
      tier: 'guest',

      wishlistProductIds: [],
      cartProductIds: [],
      recentProductIds: []
    },

    activity: {
      viewedProductIds: [],
      viewedCategorySlugs: [],
      searchedTerms: [],
      clickedCollectionIds: []
    },

    orders: {
      recent: []
    },

    rewards: {
      tier: 'guest',
      points: 0,
      coupons: 0,
      progressToNextTier: 0,
      nextTier: 'Member'
    },

    coupons: [],

    intelligence: {
      headline: 'Discover something new',

      insight:
        'Explore popular products, premium collections and current promotions.',

      suggestedProductIds: [
        'prod_1',
        'prod_7',
        'prod_10',
        'prod_24'
      ],

      pairingProductIds: []
    },

    promotions: {
      featuredPromoIds: [
        'promo_1',
        'promo_3'
      ],

      bannerMessage:
        'Start exploring Shelsea and discover premium experiences.'
    }
  },

  {
    id: 'explorer',

    label: 'Explorer',

    description:
      'A returning customer exploring wines, champagnes and spirits.',

    user: {
      id: 'mock-user-explorer',
      sessionId: 'mock-explorer-session',
      authenticated: true,
      tier: 'returning',

      wishlistProductIds: [
        'prod_5',
        'prod_7'
      ],

      cartProductIds: [],

      recentProductIds: [
        'prod_7',
        'prod_12',
        'prod_5',
        'prod_14'
      ]
    },

    activity: {
      viewedProductIds: [
        'prod_7',
        'prod_12',
        'prod_5',
        'prod_14'
      ],

      viewedCategorySlugs: [
        'wines',
        'spirits'
      ],

      searchedTerms: [
        'champagne',
        'premium wine',
        'cognac'
      ],

      clickedCollectionIds: [
        'collection_1',
        'collection_2'
      ]
    },

    orders: {
      recent: [
        {
          id: 'AJ-0187',
          productIds: [
            'prod_5',
            'prod_14'
          ],
          status: 'delivered',
          total: 162000,
          createdAt: '2026-07-08T15:30:00'
        }
      ]
    },

    rewards: {
      tier: 'member',
      points: 860,
      coupons: 1,
      expiringPoints: 40,
      progressToNextTier: 34,
      nextTier: 'Gold'
    },

    coupons: [
      {
        id: 'explorer-coupon-1',
        title: 'Wine Discovery Reward',
        description:
          'Save on selected wines and champagne.',
        badge: '10% OFF',
        image:
          '/products/moetchandonnectar_lg.jpg'
      }
    ],

    intelligence: {
      headline: 'Continue your wine journey',

      insight:
        'Your recent activity shows a strong interest in champagne and premium cognac.',

      preferredCategorySlug: 'wines',

      suggestedProductIds: [
        'prod_1',
        'prod_6',
        'prod_12',
        'prod_30'
      ],

      pairingProductIds: [
        'prod_5',
        'prod_23',
        'prod_38'
      ]
    },

    promotions: {
      featuredPromoIds: [
        'promo_2',
        'promo_3'
      ],

      bannerMessage:
        'Because you explored champagne, these premium selections were prepared for you.'
    }
  },

  {
    id: 'shopper',

    label: 'Shopper',

    description:
      'An active customer with a cart, wishlist and current delivery.',

    user: {
      id: 'mock-user-shopper',
      sessionId: 'mock-shopper-session',
      authenticated: true,
      tier: 'member',

      wishlistProductIds: [
        'prod_2',
        'prod_6',
        'prod_17',
        'prod_24'
      ],

      cartProductIds: [
        'prod_1',
        'prod_4',
        'prod_10'
      ],

      recentProductIds: [
        'prod_1',
        'prod_4',
        'prod_10',
        'prod_24'
      ]
    },

    activity: {
      viewedProductIds: [
        'prod_1',
        'prod_4',
        'prod_10',
        'prod_24'
      ],

      viewedCategorySlugs: [
        'wines',
        'confectioneries',
        'party-plans'
      ],

      searchedTerms: [
        'birthday cake',
        'party package',
        'champagne'
      ],

      clickedCollectionIds: [
        'collection_1',
        'collection_3'
      ]
    },

    orders: {
      recent: [
        {
          id: 'AJ-0248',
          productIds: [
            'prod_1',
            'prod_4'
          ],
          status: 'on-the-way',
          total: 174000,
          createdAt: '2026-07-13T11:45:00'
        },

        {
          id: 'AJ-0216',
          productIds: [
            'prod_10'
          ],
          status: 'delivered',
          total: 150000,
          createdAt: '2026-07-05T14:20:00'
        }
      ],

      activeDelivery: {
        orderId: 'AJ-0248',

        status: 'on-the-way',

        etaMinutes: 18,
        progress: 72,

        location: {
          title: 'Driver is near GRA Junction',

          subtitle:
            '3.4km away from your delivery address',

          coordinates: {
            lat: 6.5244,
            lng: 3.3792
          }
        },

        timeline: [
          {
            id: 'shopper-delivery-1',
            label: 'Confirmed',
            completed: true,
            time: '12:05 PM'
          },

          {
            id: 'shopper-delivery-2',
            label: 'Packed',
            completed: true,
            time: '12:42 PM'
          },

          {
            id: 'shopper-delivery-3',
            label: 'On the way',
            active: true,
            time: '1:18 PM'
          },

          {
            id: 'shopper-delivery-4',
            label: 'Delivered'
          }
        ],

        conditions: [
          {
            label: 'Traffic',
            value: 'Light'
          },

          {
            label: 'Weather',
            value: 'Clear'
          },

          {
            label: 'Distance',
            value: '3.4km'
          }
        ]
      }
    },

    rewards: {
      tier: 'member',
      points: 1540,
      coupons: 2,
      expiringPoints: 80,
      progressToNextTier: 61,
      nextTier: 'Gold'
    },

    coupons: [
      {
        id: 'shopper-coupon-1',
        title: 'Free Delivery',
        description:
          'Valid on your next qualifying order.',
        badge: 'ACTIVE',
        image:
          '/products/moet-chandon-imperial_lg.jpg'
      },

      {
        id: 'shopper-coupon-2',
        title: 'Party Pack Reward',
        description:
          'Special savings on selected party plans.',
        badge: 'BONUS',
        image:
          '/products/Birthday_Party_Package.jpg'
      }
    ],

    intelligence: {
      headline: 'Your celebration is taking shape',

      insight:
        'Your cart and recent searches suggest a birthday or party experience.',

      preferredCategorySlug:
        'party-plans',

      suggestedProductIds: [
        'prod_10',
        'prod_24',
        'prod_25',
        'prod_26'
      ],

      pairingProductIds: [
        'prod_1',
        'prod_4',
        'prod_24'
      ]
    },

    promotions: {
      featuredPromoIds: [
        'promo_1',
        'promo_4'
      ],

      bannerMessage:
        'Complete your celebration with products already connected to your cart.'
    }
  },

  {
    id: 'premium',

    label: 'Premium',

    description:
      'A premium member receiving luxury products, rewards and priority delivery.',

    user: {
      id: 'mock-user-premium',
      sessionId: 'mock-premium-session',
      authenticated: true,
      tier: 'premium',

      wishlistProductIds: [
        'prod_6',
        'prod_7',
        'prod_16',
        'prod_21',
        'prod_30'
      ],

      cartProductIds: [
        'prod_7',
        'prod_16',
        'prod_21'
      ],

      recentProductIds: [
        'prod_21',
        'prod_16',
        'prod_7',
        'prod_30',
        'prod_6'
      ]
    },

    activity: {
      viewedProductIds: [
        'prod_21',
        'prod_16',
        'prod_7',
        'prod_30',
        'prod_6'
      ],

      viewedCategorySlugs: [
        'spirits',
        'wines'
      ],

      searchedTerms: [
        'luxury cognac',
        'premium champagne',
        'VIP tequila',
        'single malt'
      ],

      clickedCollectionIds: [
        'collection_1',
        'collection_2'
      ]
    },

    orders: {
      recent: [
        {
          id: 'AJ-0312',
          productIds: [
            'prod_6',
            'prod_7'
          ],
          status: 'packed',
          total: 410000,
          createdAt: '2026-07-13T08:20:00'
        },

        {
          id: 'AJ-0296',
          productIds: [
            'prod_21',
            'prod_30'
          ],
          status: 'delivered',
          total: 425000,
          createdAt: '2026-07-06T17:10:00'
        }
      ],

      activeDelivery: {
        orderId: 'AJ-0312',

        status: 'packed',

        etaMinutes: 42,
        progress: 48,

        location: {
          title:
            'Premium order preparation centre',

          subtitle:
            'Your order is receiving priority handling'
        },

        timeline: [
          {
            id: 'premium-delivery-1',
            label: 'Confirmed',
            completed: true,
            time: '8:22 AM'
          },

          {
            id: 'premium-delivery-2',
            label: 'Premium handling',
            active: true,
            time: '8:48 AM'
          },

          {
            id: 'premium-delivery-3',
            label: 'Priority dispatch'
          },

          {
            id: 'premium-delivery-4',
            label: 'Delivered'
          }
        ],

        conditions: [
          {
            label: 'Handling',
            value: 'Priority'
          },

          {
            label: 'Packaging',
            value: 'Premium'
          },

          {
            label: 'ETA',
            value: '42 mins'
          }
        ]
      }
    },

    rewards: {
      tier: 'premium',
      points: 5240,
      coupons: 4,
      expiringPoints: 120,
      progressToNextTier: 84,
      nextTier: 'Platinum'
    },

    coupons: [
      {
        id: 'premium-coupon-1',
        title: 'Luxury Delivery',
        description:
          'Complimentary priority delivery.',
        badge: 'PREMIUM',
        image:
          '/products/DomPérignon_lg.jpg'
      },

      {
        id: 'premium-coupon-2',
        title: '₦25,000 Reserve Credit',
        description:
          'Available on luxury selections.',
        badge: 'EXCLUSIVE',
        image:
          '/products/hennessyXO_lg.jpg'
      },

      {
        id: 'premium-coupon-3',
        title: 'VIP Party Upgrade',
        description:
          'Complimentary experience upgrade.',
        badge: 'VIP',
        image:
          '/products/Premium_Backyard_BBQ_Package.jpg'
      }
    ],

    intelligence: {
      headline: 'Reserved for your taste',

      insight:
        'Your premium activity strongly favours rare cognac, vintage champagne and luxury whisky.',

      preferredCategorySlug: 'spirits',

      suggestedProductIds: [
        'prod_6',
        'prod_7',
        'prod_16',
        'prod_21',
        'prod_30'
      ],

      pairingProductIds: [
        'prod_7',
        'prod_23',
        'prod_38'
      ]
    },

    promotions: {
      featuredPromoIds: [
        'promo_3',
        'promo_4'
      ],

      bannerMessage:
        'Exclusive selections and rewards have been reserved for your premium membership.'
    }
  }
];