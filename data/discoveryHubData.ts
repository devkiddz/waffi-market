import type {
  DiscoveryGroupDefinition,
  DiscoveryRegistry,
  DiscoveryWidgetDefinition,
  HubGroup,
  HubSlideItem,
  HubWidget
} from '@/components/discovery-hub-panel/discoveryHubTypes';

// ============================================================
// MEDIA FIXTURES
// ============================================================

const champagneSlides: HubSlideItem[] = [
  {
    id: 'prod_1',
    title: 'Moët Imperial',
    subtitle: 'Champagne Brut',
    image: '/products/moet-chandon-imperial_lg.jpg',
    price: 65000,
    badge: 'Popular'
  },
  {
    id: 'prod_2',
    title: 'Dom Pérignon',
    subtitle: 'Vintage 2013',
    image: '/products/DomPérignon_lg.jpg',
    price: 225000,
    badge: 'Luxury'
  },
  {
    id: 'prod_3',
    title: 'Moët Nectar',
    subtitle: 'Rich & vibrant',
    image: '/products/moetchandonnectar_lg.jpg',
    price: 72000,
    badge: 'Sweet'
  }
];

const spiritSlides: HubSlideItem[] = [
  {
    id: 'prod_4',
    title: 'Hennessy VSOP',
    subtitle: 'Cognac',
    image: '/products/hennessy_lg.jpg',
    price: 85000
  },
  {
    id: 'prod_5',
    title: 'Jack Daniel’s',
    subtitle: 'Whiskey',
    image: '/products/jackdaniels_lg.jpg',
    price: 24000
  },
  {
    id: 'prod_6',
    title: 'Martell Blue Swift',
    subtitle: 'Cognac spirit',
    image: '/products/martellblue_lg.jpg',
    price: 92000
  }
];

// ============================================================
// DISCOVERY GROUP REGISTRY
// ============================================================

export const discoveryGroups: DiscoveryGroupDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    iconKey: 'home',
    description: 'Overview of your experience',
    defaultPriority: 90,
    pagePriority: {
      home: 220,
      account: 180,
      cart: 160,
      checkout: 160,
      orders: 130,
      tracking: 130,
      store: 120,
      wishlist: 110,
      rewards: 110,
      admin: 100,
      default: 100
    }
  },
  {
    id: 'shopping',
    label: 'Shopping',
    iconKey: 'shopping',
    description: 'Cart, wishlist and product activity',
    defaultPriority: 85,
    pagePriority: {
      product: 230,
      promotion: 220,
      discover: 215,
      reel: 205,
      home: 170,
      store: 200,
      wishlist: 190,
      search: 185,
      cart: 150,
      checkout: 100,
      account: 90,
      default: 85
    }
  },
  {
    id: 'orders',
    label: 'Orders',
    iconKey: 'orders',
    description: 'Deliveries and order activity',
    defaultPriority: 75,
    pagePriority: {
      tracking: 220,
      orders: 210,
      account: 160,
      checkout: 120,
      store: 70,
      default: 75
    },
    eligibility: {
      requiresAuthentication: true,
      anySignals: [
        'orders',
        'active-delivery'
      ]
    }
  },
  {
    id: 'rewards',
    label: 'Rewards',
    iconKey: 'rewards',
    description: 'Points, coupons and membership benefits',
    defaultPriority: 65,
    pagePriority: {
      rewards: 220,
      account: 150,
      checkout: 135,
      cart: 125,
      store: 80,
      default: 65
    },
    eligibility: {
      requiresAuthentication: true,
      anySignals: [
        'membership',
        'rewards',
        'coupons'
      ]
    }
  },
  {
    id: 'ai',
    label: 'AI',
    iconKey: 'ai',
    description: 'Smart suggestions and personal guidance',
    defaultPriority: 55,
    pagePriority: {
      ai: 240,
      product: 225,
      discover: 210,
      reel: 190,
      promotion: 180,
      search: 200,
      store: 130,
      wishlist: 120,
      account: 100,
      default: 55
    },
    intentPriority: {
      product: 190,
      search: 210
    },
    eligibility: {
      anySignals: [
        'products',
        'intelligence',
        'recommendations'
      ]
    }
  },
  {
    id: 'settings',
    label: 'Settings',
    iconKey: 'settings',
    description: 'Control your hub preferences',
    defaultPriority: 10,
    pagePriority: {
      settings: 230,
      account: 40,
      default: 10
    },
    pinned: true
  }
];

// ============================================================
// DISCOVERY WIDGET REGISTRY
// ============================================================

export const discoveryWidgets: DiscoveryWidgetDefinition[] = [
  {
    id: 'home-deals',
    groupId: 'home',
    layout: 'hero',
    title: 'Shelsea Spotlight',
    description:
      'A rotating mix of fashion, nightwear, hair and fragrance worth discovering now.',
    defaultPriority: 100,
    pagePriority: {
      store: 150,
      account: 90,
      cart: 70,
      checkout: 40,
      default: 100
    },
    eligibility: {
      requiredSignals: [
        'promotions'
      ]
    },
    status: 'warning',
    badge: 'Curated',
    meta: 'Spotlight',
    autoSlide: true,
    slides: [
      {
        id: 'prod_1',
        title: 'New Season Style',
        subtitle:
          'A polished women’s piece from the Shelsea clothing edit.',
        image:
          '/shelsea/products/prod_1.webp',
        badge: 'For Her'
      },
      {
        id: 'prod_169',
        title: 'After Dark',
        subtitle:
          'Lingerie and nightwear selected for a softer evening wardrobe.',
        image:
          '/shelsea/products/prod_169.webp',
        badge: 'Nightwear'
      },
      {
        id: 'prod_133',
        title: 'Signature Scent',
        subtitle:
          'Add fragrance to the look with a memorable Shelsea scent.',
        image:
          '/shelsea/products/prod_133.webp',
        badge: 'Fragrance'
      }
    ],
    action: {
      label: 'Explore Shelsea',
      href: '/store'
    }
  },
  {
  id: 'cart-summary',

  groupId: 'home',

  componentKey:
    'cart-summary',

  compact: {
    icons: ['cart'],
    priorityBoost: 20
  },

  layout: 'summary',

  title: 'Cart Summary',

  description:
    'Your current selections and shopping subtotal.',

  defaultPriority: 110,

  pagePriority: {
    cart: 240,
    checkout: 230,
    store: 220,
    account: 180,
    orders: 90,
    tracking: 70,
    default: 110
  },

  status: 'active',

  meta: 'Cart',

  action: {
    label: 'View cart',
    href: '/cart'
  }
},
  {
    id: 'delivery-tracker',
    groupId: 'home',
    layout: 'tracking',
    title: 'Delivery Tracker',
    description: 'Your Shelsea order is currently on the way.',
    defaultPriority: 105,
    pagePriority: {
      tracking: 260,
      orders: 240,
      account: 210,
      checkout: 130,
      store: 80,
      default: 105
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'active-delivery'
      ]
    },
    slides: champagneSlides,
    location: {
      title: 'Driver is near GRA Junction',
      subtitle: '3.4km away from delivery address',
      coordinates: {
        lat: 6.5244,
        lng: 3.3792
      }
    },
    status: 'success',
    badge: '18 min',
    meta: 'Live Order',
    stats: [
      {
        label: 'ETA',
        value: '18 mins'
      },
      {
        label: 'Order',
        value: '#AJ-0248'
      }
    ],
    progress: {
      label: 'Delivery progress',
      value: 72,
      helper: 'Picked up • On the way'
    },
    timeline: [
      {
        id: 't1',
        label: 'Confirmed',
        completed: true,
        time: '12:05 PM'
      },
      {
        id: 't2',
        label: 'Packed',
        completed: true,
        time: '12:42 PM'
      },
      {
        id: 't3',
        label: 'On the way',
        active: true,
        time: '1:18 PM'
      },
      {
        id: 't4',
        label: 'Delivered',
        completed: false
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
    ],
    action: {
      label: 'Track live',
      href: '/orders'
    }
  },
  {
    id: 'rewards-summary',
    groupId: 'home',
    compact: {
      icons: ['membership']
    },
    layout: 'summary',
    title: 'Rewards',
    description: 'Gold member benefits are active.',
    defaultPriority: 95,
    pagePriority: {
      rewards: 230,
      account: 200,
      checkout: 150,
      cart: 145,
      store: 140,
      default: 95
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'membership'
      ]
    },
    status: 'active',
    badge: 'Gold',
    meta: 'Membership',
    stats: [
      {
        label: 'Points',
        value: '2,540'
      },
      {
        label: 'Expiring',
        value: '120 pts',
        helper: 'in 4 days'
      }
    ],
    progress: {
      label: 'To Platinum',
      value: 82,
      helper: '460 points remaining'
    },
    action: {
      label: 'View rewards',
      href: '/rewards'
    }
  },
{
  id: 'wishlist-alert',

  groupId: 'home',

  layout: 'summary',

  title: 'Wishlist Activity',

  description:
    'Saved-product alerts will appear when a verified catalogue event requires attention.',

  defaultPriority: 85,

  eligibility: {
    enabled: false
  }
},
  {
    id: 'continue-shopping',
    groupId: 'shopping',
    compact: {
      icons: ['recent']
    },
    layout: 'slider',
    title: 'Continue Shopping',
    description: 'Pick up exactly where you stopped.',
    defaultPriority: 110,
    pagePriority: {
      store: 215,
      wishlist: 150,
      account: 100,
      default: 110
    },
    eligibility: {
      anySignals: [
        'cart',
        'wishlist',
        'recent'
      ]
    },
    status: 'active',
    meta: 'Last viewed',
    slides: champagneSlides,
    action: {
      label: 'Continue',
      href: '/store'
    }
  },
  {
    id: 'recently-viewed',
    groupId: 'shopping',
    compact: {
      icons: ['recent']
    },
    layout: 'grid',
    title: 'Recently Viewed',
    description: 'Products you checked recently.',
    defaultPriority: 105,
    pagePriority: {
      store: 210,
      account: 150,
      wishlist: 145,
      search: 140,
      default: 105
    },
    eligibility: {
      requiredSignals: [
        'recent'
      ]
    },
    meta: 'Shopping',
    slides: [
      ...champagneSlides,
      ...spiritSlides
    ].slice(0, 4),
    action: {
      label: 'View all',
      href: '/store'
    }
  },
  {
    id: 'suggested-picks',
    groupId: 'shopping',
    compact: {
      icons: ['recommendation']
    },
    layout: 'minimal-grid',
    title: 'Suggested Picks',
    description: 'Based on your browsing and taste.',
    defaultPriority: 100,
    pagePriority: {
      search: 230,
      store: 205,
      wishlist: 180,
      account: 135,
      default: 100
    },
    intentPriority: {
      product: 200,
      search: 240
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'recommendations'
      ]
    },
    status: 'active',
    meta: 'For you',
    slides: spiritSlides,
    insight: 'Your recent activity leans toward premium cognac and champagne.'
  },
  {
    id: 'new-products',
    groupId: 'shopping',
    layout: 'minimal-grid',
    title: 'New Products',
    description: 'Fresh arrivals added this week.',
    defaultPriority: 75,
    pagePriority: {
      store: 150,
      search: 145,
      default: 75
    },
    eligibility: {
      requiredSignals: [
        'products'
      ]
    },
    badge: 'New',
    meta: 'Fresh',
    slides: [
      ...spiritSlides.slice(0, 2),
      ...champagneSlides.slice(1, 2)
    ]
  },
 {
  id: 'wishlisted-products',

  groupId: 'shopping',

  componentKey:
    'wishlist-products',

  compact: {
    icons: ['wishlist'],
    priorityBoost: 15
  },

  layout: 'grid',

  title: 'Wishlist',

  description:
    'Products you have saved for later.',

  defaultPriority: 100,

  pagePriority: {
    wishlist: 250,
    store: 170,
    account: 175,
    cart: 120,
    default: 100
  },

  eligibility: {
    requiresAuthentication: true,
    requiredSignals: [
      'wishlist'
    ]
  },

  status: 'active',

  meta: 'Saved',

  action: {
    label: 'Open wishlist',
    href: '/wishlist'
  }
},
  {
    id: 'shopping-promos',
    groupId: 'shopping',
    layout: 'hero',
    title: 'Promos',
    description: 'Promotions connected to your interests.',
    defaultPriority: 70,
    pagePriority: {
      store: 145,
      cart: 100,
      default: 70
    },
    eligibility: {
      requiredSignals: [
        'promotions'
      ]
    },
    status: 'warning',
    badge: 'Limited',
    meta: 'Promos',
    autoSlide: true,
    slides: champagneSlides
  },
  {
    id: 'recent-orders',
    groupId: 'orders',
    layout: 'grid',
    title: 'Recent Orders',
    description: 'Your latest Shelsea order activity.',
    defaultPriority: 110,
    pagePriority: {
      orders: 250,
      account: 220,
      tracking: 180,
      default: 110
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'orders'
      ]
    },
    meta: 'Orders',
    stats: [
      {
        label: 'Completed',
        value: 8
      },
      {
        label: 'Active',
        value: 1
      }
    ],
    slides: champagneSlides,
    action: {
      label: 'View orders',
      href: '/orders'
    }
  },
  {
    id: 'active-delivery',
    groupId: 'orders',
    layout: 'tracking',
    title: 'Active Delivery',
    description: 'One order is currently on the way.',
    defaultPriority: 120,
    pagePriority: {
      tracking: 280,
      orders: 270,
      account: 240,
      checkout: 150,
      default: 120
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'active-delivery'
      ]
    },
    status: 'success',
    badge: 'Live',
    meta: 'Tracker',
    location: {
      title: 'Driver approaching delivery area',
      subtitle: 'Estimated arrival: 18 minutes',
      coordinates: {
        lat: 6.5244,
        lng: 3.3792
      }
    },
    progress: {
      label: 'Route completed',
      value: 72
    },
    timeline: [
      {
        id: 'od1',
        label: 'Order confirmed',
        completed: true
      },
      {
        id: 'od2',
        label: 'Packed',
        completed: true
      },
      {
        id: 'od3',
        label: 'Out for delivery',
        active: true
      },
      {
        id: 'od4',
        label: 'Delivered'
      }
    ],
    conditions: [
      {
        label: 'Traffic',
        value: 'Light'
      },
      {
        label: 'Distance',
        value: '3.4km'
      },
      {
        label: 'ETA',
        value: '18 mins'
      }
    ],
    action: {
      label: 'Track order',
      href: '/orders'
    }
  },
  {
    id: 'reward-points',
    groupId: 'rewards',
    compact: {
      icons: ['membership']
    },
    layout: 'membership',
    title: 'Reward Points',
    description: 'Your loyalty balance is growing.',
    defaultPriority: 120,
    pagePriority: {
      rewards: 270,
      account: 230,
      checkout: 170,
      cart: 160,
      store: 190,
      default: 120
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'membership'
      ]
    },
    status: 'success',
    badge: 'Gold',
    meta: 'Rewards',
    stats: [
      {
        label: 'Balance',
        value: '2,540'
      },
      {
        label: 'Coupons',
        value: 3
      }
    ],
    progress: {
      label: 'Gold to Platinum',
      value: 82,
      helper: '460 pts remaining'
    },
    insight: 'Maintain your shopping streak this week to earn bonus loyalty points.',
    action: {
      label: 'Explore benefits',
      href: '/rewards'
    }
  },
  {
    id: 'coupons',
    groupId: 'rewards',
    layout: 'hero',
    title: 'Coupons',
    description: 'Available discounts and offers.',
    defaultPriority: 105,
    pagePriority: {
      rewards: 250,
      checkout: 240,
      cart: 220,
      account: 170,
      default: 105
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'coupons'
      ]
    },
    status: 'warning',
    badge: '3 active',
    meta: 'Coupons',
    slides: [
      {
        id: 'cp1',
        title: 'Free Delivery',
        subtitle: 'Valid this weekend',
        image: '/products/moetchandonnectar_lg.jpg',
        badge: 'Active'
      },
      {
        id: 'cp2',
        title: '₦10,000 Off',
        subtitle: 'Premium champagne orders',
        image: '/products/DomPérignon_lg.jpg',
        badge: 'Gold'
      },
      {
        id: 'cp3',
        title: 'Party Pack Bonus',
        subtitle: 'For large orders',
        image: '/products/jackdaniels_lg.jpg',
        badge: 'Bonus'
      }
    ]
  },
  {
    id: 'ai-suggestions',
    groupId: 'ai',
    componentKey: 'ai-intelligence-runtime',
    compact: {
      icons: [
        'recommendation',
        'ai'
      ]
    },
    layout: 'grid',
    title: 'AJ AI Suggestions',
    description: 'Smart picks based on your taste.',
    defaultPriority: 115,
    pagePriority: {
      search: 260,
      store: 180,
      wishlist: 170,
      account: 130,
      default: 115
    },
    intentPriority: {
      product: 230,
      search: 270
    },
    eligibility: {
      anySignals: [
        'products',
        'intelligence',
        'recommendations'
      ]
    },
    status: 'active',
    badge: 'Smart',
    meta: 'AI picked',
    slides: champagneSlides,
    insight: 'Tonight’s mood looks like premium champagne with sweet pairings.',
    action: {
      label: 'Ask Shelsea AI',
      href: '/ai'
    }
  },
  {
    id: 'pairing-assistant',
    groupId: 'ai',
    compact: {
      icons: ['ai']
    },
    layout: 'minimal-grid',
    title: 'Pairing Assistant',
    description: 'Perfect drink and treat combinations.',
    defaultPriority: 95,
    pagePriority: {
      store: 165,
      search: 180,
      default: 95
    },
    intentPriority: {
      product: 250
    },
    eligibility: {
      requiresAuthentication: true,
      requiredSignals: [
        'products'
      ],
      anySignals: [
        'intelligence',
        'recommendations'
      ]
    },
    meta: 'Pairing',
    slides: [
      {
        id: 'pair_1',
        title: 'Moët Nectar',
        subtitle: 'Pairs with chocolate truffles',
        image: '/products/moetchandonnectar_lg.jpg',
        badge: 'Sweet'
      },
      {
        id: 'pair_2',
        title: 'Hennessy VSOP',
        subtitle: 'Pairs with grilled meals',
        image: '/products/hennessy_lg.jpg',
        badge: 'Bold'
      },
      {
        id: 'pair_3',
        title: 'Dom Pérignon',
        subtitle: 'Pairs with luxury desserts',
        image: '/products/DomPérignon_lg.jpg',
        badge: 'Luxury'
      }
    ]
  },
  {
    id: 'hub-settings',
    groupId: 'settings',
    layout: 'summary',
    title: 'Hub Settings',
    description: 'Customize your Discovery Hub.',
    defaultPriority: 110,
    pagePriority: {
      settings: 260,
      account: 60,
      default: 110
    },
    meta: 'Preferences',
    stats: [
      {
        label: 'Widgets',
        value: '12 active'
      },
      {
        label: 'Mode',
        value: 'Personalized'
      }
    ],
    action: {
      label: 'Customize',
      href: '/settings'
    }
  },
  {
    id: 'notification-settings',
    groupId: 'settings',
    componentKey: 'notification-runtime',
    layout: 'summary',
    title: 'Notifications',
    description: 'Verified in-app commerce and operational updates.',
    defaultPriority: 100,
    pagePriority: {
      settings: 250,
      account: 50,
      default: 100
    },
    meta: 'Alerts',
    stats: [
      {
        label: 'In-app',
        value: 'Database-backed'
      },
      {
        label: 'Push',
        value: 'Not enabled'
      }
    ],
    action: {
      label: 'Manage',
      href: '/settings/notifications'
    }
  }
];

// ============================================================
// PRIMARY DISCOVERY REGISTRY
// ============================================================

export const discoveryRegistry: DiscoveryRegistry = {
  groups: discoveryGroups,
  widgets: discoveryWidgets
};

// ============================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================

/**
 * These exports keep untouched callers compiling during the
 * migration. New hosts should consume discoveryRegistry.
 */
export const hubGroups: HubGroup[] = [
  ...discoveryGroups
]
  .sort(
    (
      firstGroup,
      secondGroup
    ) =>
      secondGroup.defaultPriority -
      firstGroup.defaultPriority
  )
  .map(
    (
      group,
      index
    ) => ({
      id: group.id,
      label: group.label,
      icon: group.iconKey,
      description: group.description,
      indicator: group.indicator,
      order: index + 1
    })
  );

function createHubWidget(
  widget: DiscoveryWidgetDefinition,
  order: number
): HubWidget {
  return {
    id: widget.id,

    groupId:
      widget.groupId,

    componentKey:
      widget.componentKey,

    title:
      widget.title,

    description:
      widget.description,

    order,

    enabled:
      widget.eligibility?.enabled !==
      false,

    // Keep the remaining fields unchanged.

    size: widget.size,
    status: widget.status,

    badge: widget.badge,
    meta: widget.meta,

    image: widget.image,
    visual: widget.visual,

    accent: widget.accent,

    stats: widget.stats,

    slides: widget.slides,
    autoSlide: widget.autoSlide,

    progress: widget.progress,

    timeline: widget.timeline,

    conditions: widget.conditions,

    location: widget.location,

    insight: widget.insight,

    action: widget.action,
    actions: widget.actions,

    layout: widget.layout
  };
}

export const hubWidgets: HubWidget[] = [
  ...discoveryWidgets
]
  .sort(
    (
      firstWidget,
      secondWidget
    ) =>
      secondWidget.defaultPriority -
      firstWidget.defaultPriority
  )
  .map(
    (
      widget,
      index
    ) =>
      createHubWidget(
        widget,
        index + 1
      )
  );
