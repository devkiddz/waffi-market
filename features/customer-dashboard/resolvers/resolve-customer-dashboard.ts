import type {
  CommerceAssistantAction,
  CommerceAssistantContext,
  CommerceDashboardData,
  CommerceHubProjection,
  CommerceJourneyItem,
  CommerceMix,
  CommerceOrder,
  CommercePriorityExperience,
  CommerceProduct,
  CommercePulseItem,
  DashboardActionItem,
  DashboardActivityItem,
  DashboardOrchestration,
  DashboardQuickAction,
  DashboardSummaryItem,
  ResolvedCustomerDashboard
} from '../contracts/customerDashboardTypes';


const DASHBOARD_BUDGET = {
  attention: 2,
  summary: 4,
  quickActions: 5,
  activity: 4,
  orders: 3,
  mixes: 3,
  journeys: 2
} as const;

const activeDeliveryStatuses = new Set([
  'PENDING',
  'ASSIGNED',
  'BARCODE_SCANNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVED'
]);

const activeOrderStatuses = new Set([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'DISPATCHED'
]);

function uniqueProducts(
  products: CommerceProduct[]
): CommerceProduct[] {
  return Array.from(
    new Map(
      products.map(product => [
        product.id,
        product
      ])
    ).values()
  );
}

function firstOrderImage(
  order: CommerceOrder | undefined
): string | null {
  return (
    order?.items.find(item => item.image)
      ?.image ?? null
  );
}

function getGreeting(
  generatedAt: string
): string {
  const hour = new Date(
    generatedAt
  ).getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function resolvePriorityExperience(
  data: CommerceDashboardData
): CommercePriorityExperience {
  const activeDeliveryOrder =
    data.orders.find(
      order =>
        order.delivery &&
        activeDeliveryStatuses.has(
          order.delivery.status
        )
    );

  if (
    activeDeliveryOrder?.delivery
  ) {
    const delivery =
      activeDeliveryOrder.delivery;

    const progressByStatus: Record<
      string,
      number
    > = {
      PENDING: 12,
      ASSIGNED: 24,
      BARCODE_SCANNED: 38,
      PICKED_UP: 54,
      IN_TRANSIT: 72,
      ARRIVED: 90
    };

    return {
      id: `delivery-${activeDeliveryOrder.id}`,
      kind: 'active-delivery',

      eyebrow: 'Moving with you',
      title:
        delivery.status === 'ARRIVED'
          ? 'Your order has arrived.'
          : 'Your order is on its way.',

      description:
        delivery.estimatedArrival
          ? `Order ${activeDeliveryOrder.orderNumber} is active. Estimated arrival: ${new Date(
              delivery.estimatedArrival
            ).toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}.`
          : `Order ${activeDeliveryOrder.orderNumber} is moving through the delivery journey.`,

      actionLabel: 'Track delivery',
      href: `/orders?order=${activeDeliveryOrder.id}`,

      secondaryActionLabel:
        'View all orders',
      secondaryHref: '/orders',

      image:
        firstOrderImage(
          activeDeliveryOrder
        ),

      tone: 'emerald',

      statusLabel:
        delivery.status.replaceAll(
          '_',
          ' '
        ),

      progress:
        progressByStatus[
          delivery.status
        ] ?? 10
    };
  }

  const paymentAttentionOrder =
    data.orders.find(
      order =>
        order.paymentStatus ===
          'FAILED' ||
        (order.paymentStatus ===
          'PENDING' &&
          order.status === 'PENDING')
    );

  if (paymentAttentionOrder) {
    return {
      id: `payment-${paymentAttentionOrder.id}`,
      kind: 'payment-attention',

      eyebrow: 'Needs your attention',
      title:
        paymentAttentionOrder.paymentStatus ===
        'FAILED'
          ? 'Your payment did not complete.'
          : 'Your order is waiting for payment.',

      description: `Order ${paymentAttentionOrder.orderNumber} is still open. You can safely review it and continue from where the transaction stopped.`,

      actionLabel: 'Review order',
      href: `/orders?order=${paymentAttentionOrder.id}`,

      secondaryActionLabel:
        'Open orders',
      secondaryHref: '/orders',

      image:
        firstOrderImage(
          paymentAttentionOrder
        ),

      tone: 'wine',
      statusLabel:
        paymentAttentionOrder.paymentStatus,

      progress: 20
    };
  }

  const progressingOrder =
    data.orders.find(order =>
      activeOrderStatuses.has(
        order.status
      )
    );

  if (progressingOrder) {
    const progressByStatus: Record<
      string,
      number
    > = {
      PENDING: 15,
      CONFIRMED: 32,
      PROCESSING: 50,
      READY: 68,
      DISPATCHED: 82
    };

    return {
      id: `order-${progressingOrder.id}`,
      kind: 'order-progress',

      eyebrow: 'Your current order',
      title:
        progressingOrder.status ===
        'READY'
          ? 'Your order is ready.'
          : 'Your order is being prepared.',

      description: `Order ${progressingOrder.orderNumber} is currently ${progressingOrder.status
        .replaceAll('_', ' ')
        .toLowerCase()}.`,

      actionLabel: 'Follow progress',
      href: `/orders?order=${progressingOrder.id}`,

      secondaryActionLabel:
        'View all orders',
      secondaryHref: '/orders',

      image:
        firstOrderImage(
          progressingOrder
        ),

      tone: 'navy',
      statusLabel:
        progressingOrder.status.replaceAll(
          '_',
          ' '
        ),

      progress:
        progressByStatus[
          progressingOrder.status
        ] ?? 20
    };
  }

  if (data.pulse.cartQuantity > 0) {
    const cartImage =
      data.cartItems.find(
        item => item.product.image
      )?.product.image ?? null;

    return {
      id: 'cart-continuation',
      kind: 'cart-continuation',

      eyebrow: 'Your journey is waiting',
      title:
        data.pulse.cartQuantity === 1
          ? 'One selection is ready for you.'
          : `${data.pulse.cartQuantity} selections are ready for you.`,

      description:
        'Your cart has been preserved inside this workspace. Continue whenever the moment feels right.',

      actionLabel: 'Continue checkout',
      href: '/cart',

      secondaryActionLabel:
        'Keep discovering',
      secondaryHref: '/store',

      image: cartImage,

      tone: 'gold',
      statusLabel: 'IN CART',
      progress: 58
    };
  }

  if (
    data.pendingReviewProducts.length >
    0
  ) {
    const product =
      data.pendingReviewProducts[0];

    return {
      id: `review-${product.id}`,
      kind: 'pending-review',

      eyebrow: 'Complete the experience',
      title: `How was ${product.name}?`,

      description:
        data.pendingReviewProducts
          .length === 1
          ? 'Your experience can help another customer choose with confidence.'
          : `${data.pendingReviewProducts.length} delivered products are waiting for your experience review.`,

      actionLabel: 'Write a review',
      href: `/store?product=${encodeURIComponent(product.id)}`,

      secondaryActionLabel:
        'View purchases',
      secondaryHref: '/orders',

      image: product.image,

      tone: 'violet',
      statusLabel: 'REVIEW',
      progress: 92
    };
  }

  const latestHistory =
    data.history[0];

  if (latestHistory) {
    return {
      id: `history-${latestHistory.id}`,
      kind: 'history-continuation',

      eyebrow: 'Jump back in',
      title: latestHistory.label,

      description:
        latestHistory.subtitle ??
        `Return to your ${latestHistory.categorySlug.replaceAll(
          '-',
          ' '
        )} experience.`,

      actionLabel: 'Restore experience',
      href:
        latestHistory.productId
          ? (() => {
              const product = data.catalog.find(
                item =>
                  item.id ===
                  latestHistory.productId
              );

              return product
                ? `/store?product=${encodeURIComponent(product.id)}`
                : `/store?category=${encodeURIComponent(
                    latestHistory.categorySlug
                  )}`;
            })()
          : `/store?category=${encodeURIComponent(
              latestHistory.categorySlug
            )}`,

      secondaryActionLabel:
        'Start fresh',
      secondaryHref: '/store',

      image: null,

      tone: 'wine',
      statusLabel: 'HISTORY',
      progress: null
    };
  }

  const recentProduct =
    data.recentProducts[0];

  if (recentProduct) {
    return {
      id: `discover-${recentProduct.id}`,
      kind: 'personal-discovery',

      eyebrow: 'Inspired by you',
      title: `Continue exploring ${recentProduct.name}.`,

      description:
        'Your recent activity is shaping a more personal Shelsea experience around you.',

      actionLabel: 'Return to product',
      href: `/store?product=${encodeURIComponent(recentProduct.id)}`,

      secondaryActionLabel:
        'Explore your mix',
      secondaryHref: '/store',

      image: recentProduct.image,

      tone: 'navy',
      statusLabel: 'FOR YOU',
      progress: null
    };
  }

  return {
    id: 'welcome',
    kind: 'welcome',

    eyebrow: 'Your commerce world',
    title: 'Let us shape something beautiful around you.',

    description:
      'Explore the store, save what catches your attention, and Shelsea will begin assembling a personal experience around your activity.',

    actionLabel: 'Enter the store',
    href: '/store',

    secondaryActionLabel:
      'Open preferences',
    secondaryHref: '/settings',

    image: null,

    tone: 'navy',
    statusLabel: 'WELCOME',
    progress: null
  };
}


function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }
  ).format(value);
}

function formatCompactCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }
  ).format(value);
}

function formatLabel(
  value: string
): string {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}

function resolveDashboardActions(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience
): DashboardActionItem[] {
  const actions:
    DashboardActionItem[] = [];

  const paymentAttentionOrder =
    data.orders.find(
      order =>
        order.paymentStatus ===
          'FAILED' ||
        (
          order.paymentStatus ===
            'PENDING' &&
          order.status === 'PENDING'
        )
    );

  if (paymentAttentionOrder) {
    actions.push({
      id: `action-payment-${paymentAttentionOrder.id}`,
      kind: 'payment',
      title:
        paymentAttentionOrder.paymentStatus ===
        'FAILED'
          ? 'Payment needs attention'
          : 'Payment is still pending',
      description: `Order ${paymentAttentionOrder.orderNumber} is waiting for you to complete the transaction.`,
      value: formatCurrency(
        paymentAttentionOrder.total
      ),
      helper:
        formatLabel(
          paymentAttentionOrder.paymentStatus
        ),
      actionLabel: 'Review order',
      href: `/orders?order=${paymentAttentionOrder.id}`,
      badge: 'Attention',
      icon: 'wallet',
      tone: 'wine',
      priority: 100,
      requiresAttention: true
    });
  }

  const activeDeliveryOrder =
    data.orders.find(
      order =>
        order.delivery &&
        activeDeliveryStatuses.has(
          order.delivery.status
        )
    );

  if (activeDeliveryOrder?.delivery) {
    actions.push({
      id: `action-delivery-${activeDeliveryOrder.id}`,
      kind: 'delivery',
      title: 'Delivery in progress',
      description: `Track order ${activeDeliveryOrder.orderNumber} as it moves toward arrival.`,
      value:
        formatLabel(
          activeDeliveryOrder.delivery.status
        ),
      helper:
        activeDeliveryOrder.delivery
          .estimatedArrival
          ? `Estimated ${new Date(
              activeDeliveryOrder.delivery
                .estimatedArrival
            ).toLocaleDateString(
              'en-NG',
              {
                day: 'numeric',
                month: 'short'
              }
            )}`
          : 'Tracking is available',
      actionLabel: 'Track delivery',
      href: `/orders?order=${activeDeliveryOrder.id}`,
      badge: 'Active',
      icon: 'truck',
      tone: 'emerald',
      priority: 94,
      requiresAttention: false
    });
  }

  const activeOrder =
    data.orders.find(
      order =>
        activeOrderStatuses.has(
          order.status
        ) &&
        order.id !==
          activeDeliveryOrder?.id &&
        order.id !==
          paymentAttentionOrder?.id
    );

  if (activeOrder) {
    actions.push({
      id: `action-order-${activeOrder.id}`,
      kind: 'order',
      title: 'Order in progress',
      description: `Order ${activeOrder.orderNumber} is currently ${formatLabel(
        activeOrder.status
      ).toLowerCase()}.`,
      value:
        formatLabel(
          activeOrder.status
        ),
      helper: formatCurrency(
        activeOrder.total
      ),
      actionLabel: 'View progress',
      href: `/orders?order=${activeOrder.id}`,
      badge: 'Order',
      icon: 'package',
      tone: 'navy',
      priority: 88,
      requiresAttention: false
    });
  }

  if (data.pulse.cartQuantity > 0) {
    actions.push({
      id: 'action-cart',
      kind: 'cart',
      title: 'Cart waiting',
      description: `${data.pulse.cartQuantity} product${
        data.pulse.cartQuantity === 1
          ? ''
          : 's'
      } remain ready for checkout.`,
      value: String(
        data.pulse.cartQuantity
      ),
      helper:
        formatCurrency(
          data.pulse.cartSubtotal
        ),
      actionLabel: 'Continue checkout',
      href: '/cart',
      badge: 'Cart',
      icon: 'cart',
      tone: 'gold',
      priority: 80,
      requiresAttention: false
    });
  }

  if (
    data.pendingReviewProducts.length >
    0
  ) {
    const product =
      data.pendingReviewProducts[0];

    actions.push({
      id: `action-review-${product.id}`,
      kind: 'review',
      title:
        data.pendingReviewProducts
          .length === 1
          ? 'One review is waiting'
          : `${data.pendingReviewProducts.length} reviews are waiting`,
      description: `Share your experience with ${product.name}.`,
      value: String(
        data.pendingReviewProducts
          .length
      ),
      helper: 'Delivered products',
      actionLabel: 'Write a review',
      href: `/store?product=${encodeURIComponent(product.id)}`,
      badge: 'Review',
      icon: 'review',
      tone: 'violet',
      priority: 72,
      requiresAttention: false
    });
  }

  if (
    data.wishlistProducts.length > 0
  ) {
    actions.push({
      id: 'action-wishlist',
      kind: 'wishlist',
      title: 'Saved products',
      description: `${data.wishlistProducts.length} product${
        data.wishlistProducts.length ===
        1
          ? ''
          : 's'
      } remain connected to this workspace.`,
      value: String(
        data.wishlistProducts.length
      ),
      helper: 'Available in wishlist',
      actionLabel: 'Open wishlist',
      href: '/wishlist',
      badge: null,
      icon: 'wishlist',
      tone: 'wine',
      priority: 60,
      requiresAttention: false
    });
  }

  const latestHistory =
    data.history[0];

  if (latestHistory) {
    actions.push({
      id: `action-history-${latestHistory.id}`,
      kind: 'history',
      title: 'Continue a recent experience',
      description:
        latestHistory.subtitle ??
        `Return to ${latestHistory.label}.`,
      value:
        latestHistory.label,
      helper:
        formatLabel(
          latestHistory.source
        ),
      actionLabel: 'Continue',
      href:
        latestHistory.productId
          ? (() => {
              const product =
                data.catalog.find(
                  item =>
                    item.id ===
                    latestHistory.productId
                );

              return product
                ? `/store?product=${encodeURIComponent(product.id)}`
                : `/store?category=${encodeURIComponent(
                    latestHistory.categorySlug
                  )}`;
            })()
          : `/store?category=${encodeURIComponent(
              latestHistory.categorySlug
            )}`,
      badge: null,
      icon: 'history',
      tone: 'neutral',
      priority: 50,
      requiresAttention: false
    });
  }

  actions.push({
    id: 'action-discovery',
    kind: 'discovery',
    title: 'Start a new shopping journey',
    description:
      'Explore the store and shape the next experience around what matters now.',
    value: 'Discover',
    helper: 'Personalized store',
    actionLabel: 'Open store',
    href: '/store',
    badge: null,
    icon: 'store',
    tone: 'navy',
    priority: 20,
    requiresAttention: false
  });

  const priorityKindMap:
    Partial<
      Record<
        CommercePriorityExperience['kind'],
        DashboardActionItem['kind']
      >
    > = {
    'active-delivery': 'delivery',
    'payment-attention': 'payment',
    'order-progress': 'order',
    'cart-continuation': 'cart',
    'pending-review': 'review',
    'history-continuation': 'history',
    'personal-discovery': 'discovery',
    welcome: 'discovery'
  };

  const duplicateKind =
    priorityKindMap[priority.kind];

  const operationalKinds =
    new Set<
      DashboardActionItem['kind']
    >([
      'payment',
      'delivery',
      'order',
      'cart',
      'review'
    ]);

  return actions
    .filter(
      action =>
        operationalKinds.has(
          action.kind
        ) &&
        action.kind !== duplicateKind &&
        action.href !== priority.href
    )
    .sort(
      (first, second) =>
        second.priority -
        first.priority
    )
    .slice(
      0,
      DASHBOARD_BUDGET.attention
    );
}


function resolveDashboardSummary(
  data: CommerceDashboardData
): DashboardSummaryItem[] {
  const items:
    DashboardSummaryItem[] = [];

  if (
    data.pulse.paidOrderCount > 0 ||
    data.pulse.activeOrderCount > 0 ||
    data.pulse.deliveredOrderCount > 0
  ) {
    items.push({
      id: 'orders',
      label: 'Paid orders',
      value: String(
        data.pulse.paidOrderCount
      ),
      helper:
        data.pulse.activeOrderCount > 0
          ? `${data.pulse.activeOrderCount} currently active`
          : `${data.pulse.deliveredOrderCount} delivered`,
      href: '/orders',
      icon: 'orders',
      tone: 'navy'
    });
  }

  if (data.pulse.totalSpent > 0) {
    items.push({
      id: 'spend',
      label: 'Recorded purchases',
      value:
        formatCompactCurrency(
          data.pulse.totalSpent
        ),
      helper: 'Paid order value',
      href: '/orders',
      icon: 'spend',
      tone: 'violet'
    });
  }

  if (data.pulse.cartQuantity > 0) {
    items.push({
      id: 'cart',
      label: 'Current cart',
      value: String(
        data.pulse.cartQuantity
      ),
      helper:
        formatCurrency(
          data.pulse.cartSubtotal
        ),
      href: '/cart',
      icon: 'cart',
      tone: 'gold'
    });
  }

  if (data.pulse.wishlistCount > 0) {
    items.push({
      id: 'saved',
      label: 'Saved products',
      value: String(
        data.pulse.wishlistCount
      ),
      helper:
        'Available in wishlist',
      href: '/wishlist',
      icon: 'saved',
      tone: 'wine'
    });
  }

  return items.slice(
    0,
    DASHBOARD_BUDGET.summary
  );
}


function resolveQuickActions(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience
): DashboardQuickAction[] {
  const actions:
    DashboardQuickAction[] = [];

  if (priority.href !== '/store') {
    actions.push({
      id: 'store',
      label: 'Continue shopping',
      description:
        'Open the live store experience.',
      href: '/store',
      icon: 'store',
      badge: null
    });
  }

  if (data.pulse.cartQuantity > 0) {
    actions.push({
      id: 'cart',
      label: 'Open cart',
      description: `${data.pulse.cartQuantity} product${
        data.pulse.cartQuantity === 1
          ? ''
          : 's'
      } waiting`,
      href: '/cart',
      icon: 'cart',
      badge: String(
        data.pulse.cartQuantity
      )
    });
  }

  if (data.orders.length > 0) {
    actions.push({
      id: 'orders',
      label:
        data.pulse.activeOrderCount > 0
          ? 'Track orders'
          : 'Order history',
      description:
        data.pulse.activeOrderCount > 0
          ? `${data.pulse.activeOrderCount} active now`
          : `${data.orders.length} recorded order${
              data.orders.length === 1
                ? ''
                : 's'
            }`,
      href: '/orders',
      icon: 'orders',
      badge:
        data.pulse.activeOrderCount > 0
          ? String(
              data.pulse.activeOrderCount
            )
          : null
    });
  }

  if (data.pulse.wishlistCount > 0) {
    actions.push({
      id: 'wishlist',
      label: 'View wishlist',
      description: `${data.pulse.wishlistCount} saved product${
        data.pulse.wishlistCount === 1
          ? ''
          : 's'
      }`,
      href: '/wishlist',
      icon: 'wishlist',
      badge: String(
        data.pulse.wishlistCount
      )
    });
  }

 if (
  data.shoppingLists.length >
  0
) {
  actions.push({
    id: 'lists',

    label:
      'Shopping lists',

    description: `${data.pulse.shoppingListCount} list${
      data.pulse.shoppingListCount ===
      1
        ? ''
        : 's'
    } holding ${data.pulse.shoppingListItemCount} planned item${
      data.pulse.shoppingListItemCount ===
      1
        ? ''
        : 's'
    }`,

    href:
      '/account/lists',

    icon:
      'list',

    badge:
      String(
        data.pulse
          .shoppingListCount
      )
  });
}

  actions.push({
    id: 'settings',
    label: 'Preferences',
    description:
      'Manage your dashboard experience.',
    href: '/settings',
    icon: 'settings',
    badge: null
  });

  return actions.slice(
    0,
    DASHBOARD_BUDGET.quickActions
  );
}


function resolveDashboardActivity(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience,
  actions: DashboardActionItem[]
): DashboardActivityItem[] {
  const blockedHrefs =
    new Set([
      priority.href,
      ...actions.map(
        action => action.href
      )
    ]);

  const orderActivity:
    DashboardActivityItem[] =
    data.orders.map(
      order => ({
        id: `activity-order-${order.id}`,
        kind: 'order',
        title: `Order ${order.orderNumber}`,
        description: `${formatLabel(
          order.status
        )} · ${formatCurrency(
          order.total
        )}`,
        occurredAt:
          order.createdAt,
        href: `/orders?order=${order.id}`,
        badge:
          formatLabel(
            order.paymentStatus
          ),
        image:
          firstOrderImage(order)
      })
    );

  const historyActivity:
    DashboardActivityItem[] =
    data.history.map(
      entry => ({
        id: `activity-history-${entry.id}`,
        kind: 'history',
        title: entry.label,
        description:
          entry.subtitle ??
          `Visited ${formatLabel(
            entry.categorySlug
          )}`,
        occurredAt:
          entry.visitedAt,
        href:
          entry.productId
            ? (() => {
                const product =
                  data.catalog.find(
                    item =>
                      item.id ===
                      entry.productId
                  );

                return product
                  ? `/store?product=${encodeURIComponent(product.id)}`
                  : `/store?category=${encodeURIComponent(
                      entry.categorySlug
                    )}`;
              })()
            : `/store?category=${encodeURIComponent(
                entry.categorySlug
              )}`,
        badge:
          formatLabel(
            entry.source
          ),
        image: null
      })
    );

  const seenHrefs =
    new Set<string>();

  return [
    ...orderActivity,
    ...historyActivity
  ]
    .sort(
      (first, second) =>
        new Date(
          second.occurredAt
        ).getTime() -
        new Date(
          first.occurredAt
        ).getTime()
    )
    .filter(item => {
      if (
        blockedHrefs.has(item.href) ||
        seenHrefs.has(item.href)
      ) {
        return false;
      }

      seenHrefs.add(item.href);
      return true;
    })
    .slice(
      0,
      DASHBOARD_BUDGET.activity
    );
}


function resolvePulse(
  data: CommerceDashboardData
): CommercePulseItem[] {
  return [
    {
      id: 'purchases',
      label: 'Purchases',
      value: String(
        data.pulse.paidOrderCount
      ),
      helper: 'Completed commerce',
      href: '/orders'
    },
    {
      id: 'saved',
      label: 'Saved',
      value: String(
        data.pulse.wishlistCount
      ),
      helper: 'Wishlist products',
      href: '/wishlist'
    },
    {
      id: 'cart',
      label: 'In cart',
      value: String(
        data.pulse.cartQuantity
      ),
      helper: 'Ready to continue',
      href: '/cart'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      value: String(
        data.pulse.reviewCount
      ),
      helper:
        data.pulse
          .pendingReviewCount > 0
          ? `${data.pulse.pendingReviewCount} waiting`
          : 'Your shared experiences',
      href: '/orders'
    }
  ];
}

function resolveJourneys(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience,
  actions: DashboardActionItem[]
): CommerceJourneyItem[] {
  const journeys:
    CommerceJourneyItem[] = [];

  const activeDeliveryOrder =
    data.orders.find(
      order =>
        order.delivery &&
        activeDeliveryStatuses.has(
          order.delivery.status
        )
    );

  if (activeDeliveryOrder) {
    journeys.push({
      id: `journey-delivery-${activeDeliveryOrder.id}`,
      eyebrow: 'Active delivery',
      title: `Track ${activeDeliveryOrder.orderNumber}`,
      description:
        'Follow the order from dispatch to arrival.',
      href: `/orders?order=${activeDeliveryOrder.id}`,
      actionLabel: 'Track order',
      image:
        firstOrderImage(
          activeDeliveryOrder
        ),
      badge:
        activeDeliveryOrder.delivery?.status.replaceAll(
          '_',
          ' '
        ) ?? 'ACTIVE',
      tone: 'emerald'
    });
  }

  if (data.pulse.cartQuantity > 0) {
    journeys.push({
      id: 'journey-cart',
      eyebrow: 'Continue shopping',
      title: 'Your cart is waiting',
      description: `${data.pulse.cartQuantity} item${
        data.pulse.cartQuantity === 1
          ? ''
          : 's'
      } remain connected to this workspace.`,
      href: '/cart',
      actionLabel: 'Open cart',
      image:
        data.cartItems[0]?.product
          .image ?? null,
      badge: `${data.pulse.cartQuantity} ITEMS`,
      tone: 'gold'
    });
  }

  if (
    data.pendingReviewProducts.length >
    0
  ) {
    const product =
      data.pendingReviewProducts[0];

    journeys.push({
      id: `journey-review-${product.id}`,
      eyebrow: 'Your voice matters',
      title: `Review ${product.name}`,
      description:
        'Complete the purchase journey with your experience.',
      href: `/store?product=${encodeURIComponent(product.id)}`,
      actionLabel: 'Write review',
      image: product.image,
      badge: 'REVIEW',
      tone: 'violet'
    });
  }

  if (data.recentProducts.length > 0) {
    const product =
      data.recentProducts[0];

    journeys.push({
      id: `journey-recent-${product.id}`,
      eyebrow: 'Jump back in',
      title: product.name,
      description:
        'Return to a product you recently explored.',
      href: `/store?product=${encodeURIComponent(product.id)}`,
      actionLabel: 'Continue',
      image: product.image,
      badge: 'RECENT',
      tone: 'navy'
    });
  }

  if (
    data.wishlistProducts.length > 0
  ) {
    journeys.push({
      id: 'journey-wishlist',
      eyebrow: 'Your saved world',
      title: 'Revisit your wishlist',
      description: `${data.wishlistProducts.length} product${
        data.wishlistProducts.length === 1
          ? ''
          : 's'
      } are saved for later.`,
      href: '/wishlist',
      actionLabel: 'Open wishlist',
      image:
        data.wishlistProducts[0]
          ?.image ?? null,
      badge: `${data.wishlistProducts.length} SAVED`,
      tone: 'wine'
    });
  }

  const primaryShoppingList =
  data.shoppingLists[0];

if (primaryShoppingList) {
  journeys.push({
    id:
      `journey-shopping-list-${primaryShoppingList.id}`,

    eyebrow:
      'Your shopping plan',

    title:
      primaryShoppingList.name,

    description:
      primaryShoppingList.itemCount >
      0
        ? `${primaryShoppingList.itemCount} product${
            primaryShoppingList.itemCount ===
            1
              ? ''
              : 's'
          } ${
            primaryShoppingList.itemCount ===
            1
              ? 'is'
              : 'are'
          } gathered inside this list.`
        : 'This list is ready for the products you plan to gather.',

    href:
      `/account/lists/${primaryShoppingList.id}`,

    actionLabel:
      'Open list',

    image:
      primaryShoppingList
        .items[0]?.product
        .image ??
      null,

    badge:
      primaryShoppingList.itemCount >
      0
        ? `${primaryShoppingList.itemCount} ITEMS`
        : 'NEW LIST',

    tone:
      'gold'
  });
}

  const blockedHrefs =
    new Set([
      priority.href,
      ...actions.map(
        action => action.href
      )
    ]);

  const seenHrefs =
    new Set<string>();

  return journeys
    .filter(journey => {
      if (
        blockedHrefs.has(
          journey.href
        ) ||
        seenHrefs.has(
          journey.href
        )
      ) {
        return false;
      }

      seenHrefs.add(
        journey.href
      );
      return true;
    })
    .slice(
      0,
      DASHBOARD_BUDGET.journeys
    );
}


function rankProducts(
  data: CommerceDashboardData
): CommerceProduct[] {
  const recentCategories =
    new Set(
      data.recentProducts.map(
        product =>
          product.categorySlug
      )
    );

  const wishlistCategories =
    new Set(
      data.wishlistProducts.map(
        product =>
          product.categorySlug
      )
    );

  const cartProductIds = new Set(
    data.cartItems.map(
      item => item.product.id
    )
  );

  const preferredCategories =
    new Set(
      data.profile
        .preferredCategorySlugs
    );

  const preferredBrands = new Set(
    data.profile
      .preferredBrandSlugs
  );

  return [...data.catalog]
    .filter(
      product =>
        product.available &&
        !cartProductIds.has(product.id)
    )
    .sort((first, second) => {
      const score = (
        product: CommerceProduct
      ) =>
        (preferredCategories.has(
          product.categorySlug
        )
          ? 10
          : 0) +
        (preferredBrands.has(
          product.brandSlug ?? ''
        )
          ? 8
          : 0) +
        (recentCategories.has(
          product.categorySlug
        )
          ? 6
          : 0) +
        (wishlistCategories.has(
          product.categorySlug
        )
          ? 4
          : 0) +
        (product.featured ? 3 : 0) +
        (product.isNew ? 2 : 0) +
        product.rating +
        Math.min(
          product.soldCount / 100,
          3
        );

      return score(second) - score(first);
    });
}

function resolveMixes(
  data: CommerceDashboardData
): CommerceMix[] {
  const mixes: CommerceMix[] = [];

  const rankedProducts =
    rankProducts(data);

  if (rankedProducts.length > 0) {
    mixes.push({
      id: 'made-for-you',

      eyebrow: 'Made for you',
      title: `${data.identity.firstName}'s discovery mix`,
      description:
        'A living mix shaped by your categories, saved products and recent activity.',

      reason:
        data.profile
          .personalizationEnabled
          ? 'Personalized from your commerce signals'
          : 'Premium selections from across Shelsea',

      products:
        rankedProducts.slice(0, 10),

      href: '/store?view=grid'
    });
  }

  const recentCategory =
    data.recentProducts[0]
      ?.categorySlug;

  if (recentCategory) {
    const inspiredProducts =
      data.catalog.filter(
        product =>
          product.available &&
          product.categorySlug ===
            recentCategory
      );

    if (inspiredProducts.length > 0) {
      mixes.push({
        id: `inspired-${recentCategory}`,

        eyebrow:
          'Because you explored',
        title: recentCategory
          .replaceAll('-', ' ')
          .replace(/\b\w/g, letter =>
            letter.toUpperCase()
          ),

        description:
          'Continue the mood with more selections from the world you recently entered.',

        reason: `Inspired by your recent ${recentCategory.replaceAll(
          '-',
          ' '
        )} activity`,

        products:
          uniqueProducts(
            inspiredProducts
          ).slice(0, 10),

        href: `/store?category=${encodeURIComponent(
          recentCategory
        )}&view=grid`
      });
    }
  }

  if (
    data.shoppingListProducts.length >
    0
  ) {
    mixes.push({
      id: 'shopping-list-mix',

      eyebrow: 'Your plans',
      title: 'Shopping list mix',
      description:
        'Products already gathered around your current plan.',

      reason:
        'Preserved from your shopping lists',

      products:
        uniqueProducts(
          data.shoppingListProducts
        ).slice(0, 10),

      href: '/settings'
    });
  }

  const activeShoppingList =
  data.shoppingLists.find(
    list =>
      list.items.length >
      0
  );

if (activeShoppingList) {
  mixes.push({
    id:
      `shopping-list-mix-${activeShoppingList.id}`,

    eyebrow:
      'Your plans',

    title:
      activeShoppingList.name,

    description:
      activeShoppingList.description ??
      'Products already gathered around your current shopping plan.',

    reason: `${activeShoppingList.itemCount} planned product${
      activeShoppingList.itemCount ===
      1
        ? ''
        : 's'
    }`,

    products:
      uniqueProducts(
        activeShoppingList.items.map(
          item =>
            item.product
        )
      ).slice(
        0,
        10
      ),

    href:
      `/account/lists/${activeShoppingList.id}`
  });
}

  const deliveredProductIds =
    data.orders
      .filter(
        order =>
          order.status === 'DELIVERED'
      )
      .flatMap(order =>
        order.items.map(
          item => item.productId
        )
      );

  const catalogById = new Map(
    data.catalog.map(product => [
      product.id,
      product
    ])
  );

  const buyAgainProducts =
    uniqueProducts(
      deliveredProductIds
        .map(productId =>
          catalogById.get(productId)
        )
        .filter(
          (
            product
          ): product is CommerceProduct =>
            Boolean(product)
        )
    );

  if (buyAgainProducts.length > 0) {
    mixes.push({
      id: 'buy-again',

      eyebrow: 'From your history',
      title: 'Buy it again',
      description:
        'Reliable selections from purchases you already completed.',

      reason:
        'Based on delivered orders',

      products:
        buyAgainProducts.slice(0, 10),

      href: '/orders'
    });
  }

  const selectedMixes:
    CommerceMix[] = [];

  const seenSignatures =
    new Set<string>();

  for (const mix of mixes) {
    const products =
      uniqueProducts(
        mix.products
      ).slice(0, 8);

    if (products.length === 0) {
      continue;
    }

    const signature =
      products
        .slice(0, 3)
        .map(product => product.id)
        .sort()
        .join('|');

    if (
      signature &&
      seenSignatures.has(signature)
    ) {
      continue;
    }

    if (signature) {
      seenSignatures.add(signature);
    }

    selectedMixes.push({
      ...mix,
      products
    });

    if (
      selectedMixes.length >=
      DASHBOARD_BUDGET.mixes
    ) {
      break;
    }
  }

  return selectedMixes;
}

function resolveAssistantActions(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience
): CommerceAssistantAction[] {
  const actions:
    CommerceAssistantAction[] = [
      {
        id: 'priority',

        title: priority.title,
        description:
          priority.description,

        actionLabel:
          priority.actionLabel,
        href: priority.href,

        prompt: `Help me with ${priority.title.toLowerCase()}`
      }
    ];

  if (data.pulse.cartQuantity > 0) {
    actions.push({
      id: 'cart-assist',

      title: 'Complete my cart',
      description:
        'Review what is waiting and help me continue confidently.',

      actionLabel: 'Open cart',
      href: '/cart',

      prompt:
        'Help me complete my current cart.'
    });
  }

  if (
    data.shoppingListProducts.length >
    0
  ) {
    actions.push({
      id: 'list-assist',

      title: 'Improve my shopping list',
      description:
        'Use the products already gathered as the foundation for the next suggestions.',

      actionLabel: 'Open lists',
      href: '/settings',

      prompt:
        'Help me improve my current shopping list.'
    });
  }

  if (
    data.pendingReviewProducts.length >
    0
  ) {
    actions.push({
      id: 'review-assist',

      title: 'Complete pending reviews',
      description:
        'Return to delivered products that still need your voice.',

      actionLabel: 'Review products',
      href: '/orders',

      prompt:
        'Show me the products waiting for my review.'
    });
  }

  actions.push({
    id: 'discover-assist',

    title: 'Shape my next experience',
    description:
      'Explore a personalized mix based on the activity already attached to this workspace.',

    actionLabel: 'Explore store',
    href: '/store',

    prompt:
      'Build a new shopping experience around my recent activity.'
  });

  return actions.slice(0, 4);
}

function resolveHubProjection(
  data: CommerceDashboardData,
  priority: CommercePriorityExperience,
  mixes: CommerceMix[]
): CommerceHubProjection {
  const signals =
    [
      {
        id: 'commerce-priority',
        groupId: 'home' as const,

        title: priority.title,
        description:
          priority.description,

        priority: 100,

        badge:
          priority.statusLabel,

        href: priority.href,

        productIds:
          priority.image
            ? []
            : []
      },

      data.pulse.cartQuantity > 0
        ? {
            id: 'commerce-cart',
            groupId:
              'shopping' as const,

            title: 'Cart waiting',
            description: `${data.pulse.cartQuantity} item${
              data.pulse
                .cartQuantity === 1
                ? ''
                : 's'
            } are ready to continue.`,

            priority: 90,

            badge: String(
              data.pulse.cartQuantity
            ),

            href: '/cart',

            productIds:
              data.cartItems.map(
                item =>
                  item.product.id
              )
          }
        : null,

      data.pulse.activeOrderCount > 0
        ? {
            id: 'commerce-orders',
            groupId:
              'orders' as const,

            title: 'Active orders',
            description: `${data.pulse.activeOrderCount} order${
              data.pulse
                .activeOrderCount === 1
                ? ''
                : 's'
            } are still moving.`,

            priority: 95,

            badge: String(
              data.pulse
                .activeOrderCount
            ),

            href: '/orders',

            productIds: data.orders
              .filter(order =>
                activeOrderStatuses.has(
                  order.status
                )
              )
              .flatMap(order =>
                order.items.map(
                  item =>
                    item.productId
                )
              )
          }
        : null,

      data.pulse.wishlistCount > 0
        ? {
            id: 'commerce-wishlist',
            groupId:
              'shopping' as const,

            title: 'Saved products',
            description: `${data.pulse.wishlistCount} saved selection${
              data.pulse
                .wishlistCount === 1
                ? ''
                : 's'
            } remain connected to you.`,

            priority: 70,

            badge: String(
              data.pulse
                .wishlistCount
            ),

            href: '/wishlist',

            productIds:
              data.wishlistProducts.map(
                product =>
                  product.id
              )
          }
        : null,

      data.pulse
        .pendingReviewCount > 0
        ? {
            id: 'commerce-reviews',
            groupId:
              'home' as const,

            title: 'Reviews waiting',
            description: `${data.pulse.pendingReviewCount} delivered product${
              data.pulse
                .pendingReviewCount ===
              1
                ? ''
                : 's'
            } can still receive your experience.`,

            priority: 76,

            badge: String(
              data.pulse
                .pendingReviewCount
            ),

            href: '/orders',

            productIds:
              data.pendingReviewProducts.map(
                product =>
                  product.id
              )
          }
        : null,

      mixes[0]
        ? {
            id: 'commerce-smart-picks',
            groupId: 'ai' as const,

            title: mixes[0].title,
            description:
              mixes[0].reason,

            priority: 80,

            badge: 'FOR YOU',

            href: mixes[0].href,

            productIds:
              mixes[0].products.map(
                product =>
                  product.id
              )
          }
        : null,

      {
        id: 'commerce-settings',
        groupId: 'settings' as const,

        title: 'Experience settings',
        description:
          'Control personalization, notifications and your commerce preferences.',

        priority: 10,

        badge: null,

        href: '/settings',

        productIds: []
      }
    ]
      .filter(
        (
          signal
        ): signal is NonNullable<
          typeof signal
        > => Boolean(signal)
      )
      .sort(
        (first, second) =>
          second.priority -
          first.priority
      );

  return {
    primaryGroupId:
      data.pulse.activeOrderCount > 0
        ? 'orders'
        : 'home',

    signals
  };
}


function resolveDashboardOrchestration({
  data,
  priority,
  summary,
  quickActions,
  activity,
  journeys,
  mixes,
  assistant
}: {
  data: CommerceDashboardData;
  priority: CommercePriorityExperience;
  summary: DashboardSummaryItem[];
  quickActions: DashboardQuickAction[];
  activity: DashboardActivityItem[];
  journeys: CommerceJourneyItem[];
  mixes: CommerceMix[];
  assistant: CommerceAssistantContext;
}): DashboardOrchestration {
  const operationalPriorityKinds =
    new Set<
      CommercePriorityExperience['kind']
    >([
      'active-delivery',
      'payment-attention',
      'order-progress',
      'cart-continuation',
      'pending-review'
    ]);

  const hasOperationalPriority =
    operationalPriorityKinds.has(
      priority.kind
    );

  const visibility = {
    overview: summary.length > 0,
    quickActions:
      quickActions.length > 0,
    activity: activity.length > 0,
    orders: data.orders.length > 0,
    companion:
      assistant.actions.length > 0,
    commerce:
      summary.length > 0 ||
      quickActions.length > 0 ||
      activity.length > 0 ||
      data.orders.length > 0 ||
      assistant.actions.length > 0,
    personalCommerce:
      journeys.length > 0 ||
      mixes.length > 0
  };

  return {
    budgets: {
      ...DASHBOARD_BUDGET
    },
    visibility,
    sections: {
      attention:
        hasOperationalPriority
          ? {
              eyebrow: 'Right now',
              title:
                'Needs your attention',
              description:
                'Only the commerce moments that are useful now—nothing noisy or intimidating.'
            }
          : {
              eyebrow: 'For this moment',
              title:
                'Continue naturally',
              description:
                'A focused starting point shaped by your latest meaningful activity.'
            },
      commerce: {
        eyebrow: 'Workspace',
        title: 'Your commerce',
        description:
          'Orders, shortcuts and activity arranged as a calm professional canvas.'
      },
      personalCommerce: {
        eyebrow:
          'Personal commerce',
        title:
          'Continue your experience',
        description:
          'Product worlds are previewed through stacked product headers, then opened only when you need more.'
      }
    }
  };
}

export function resolveCustomerDashboard(
  data: CommerceDashboardData
): ResolvedCustomerDashboard {
  const greeting = getGreeting(
    data.generatedAt
  );

  const priority =
    resolvePriorityExperience(data);

  const pulse = resolvePulse(data);

  const actions =
    resolveDashboardActions(
      data,
      priority
    );

  const summary =
    resolveDashboardSummary(data);

  const quickActions =
    resolveQuickActions(
      data,
      priority
    );

  const activity =
    resolveDashboardActivity(
      data,
      priority,
      actions
    );

  const journeys =
    resolveJourneys(
      data,
      priority,
      actions
    );

  const mixes = resolveMixes(data);

  const assistantActions =
    resolveAssistantActions(
      data,
      priority
    );

  const assistant:
    CommerceAssistantContext = {
    greeting: `${greeting}, ${data.identity.firstName}.`,

    summary:
      priority.description,

    workspaceId:
      data.workspace.id,
    workspaceMode:
      data.workspace.mode,

    priorityKind:
      priority.kind,

    cartQuantity:
      data.pulse.cartQuantity,

    wishlistCount:
      data.pulse.wishlistCount,

    activeOrderCount:
      data.pulse.activeOrderCount,

    pendingReviewCount:
      data.pulse.pendingReviewCount,

    recentProductIds:
      data.recentProducts.map(
        product => product.id
      ),

    preferredCategorySlugs:
      data.profile
        .preferredCategorySlugs,

    actions: assistantActions
  };

  const orchestration =
    resolveDashboardOrchestration({
      data,
      priority,
      summary,
      quickActions,
      activity,
      journeys,
      mixes,
      assistant
    });

  const hub = resolveHubProjection(
    data,
    priority,
    mixes
  );

  return {
    data,

    greeting,

    priority,
    pulse,

    actions,
    summary,
    quickActions,
    activity,

    journeys,
    mixes,

    orchestration,

    hub,
    assistant
  };
}
