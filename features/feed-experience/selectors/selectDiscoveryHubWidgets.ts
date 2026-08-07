import type {
  HubWidget
} from '@/components/discovery-hub-panel/discoveryHubTypes';

import type {
  FeedContext
} from '../contracts';

type SelectDiscoveryHubWidgetsInput = {
  widgets: HubWidget[];
  context: FeedContext;
};

export function selectDiscoveryHubWidgets({
  widgets,
  context
}: SelectDiscoveryHubWidgetsInput): HubWidget[] {
  const { user, experience } = context;

  const cartCount = new Set(
    user.cartProductIds
  ).size;

  const wishlistCount = new Set(
    user.wishlistProductIds
  ).size;

  const recentCount = new Set([
    ...user.recentProductIds,
    ...(context.commerce?.history
      .map(entry => entry.productId)
      .filter((productId): productId is string => Boolean(productId)) ?? [])
  ]).size;

  const commerceOrders = context.commerce?.orders.recent ?? [];
  const commerceActiveDelivery = context.commerce?.orders.activeDelivery;

  /*
   * Commerce and activity widgets must still resolve when
   * optional mock experience data is unavailable.
   *
   * This is important for the standalone mobile Hub shell.
   */
  const resolvedWidgets = widgets.map(
    widget => {
      switch (widget.id) {
        case 'cart-summary':
          return {
            ...widget,

            /*
             * Keep the cart widget mounted while empty so its
             * custom component can render an empty state.
             */
            enabled: widget.enabled,

            badge:
              cartCount > 0
                ? `${cartCount} ${
                    cartCount === 1
                      ? 'selection'
                      : 'selections'
                  }`
                : undefined,

            description:
              cartCount > 0
                ? 'Your current cart is ready to continue.'
                : 'Your cart is currently empty.'
          };

        case 'wishlist-alert':
        case 'wishlisted-products':
          return {
            ...widget,

            enabled:
              widget.enabled &&
              wishlistCount > 0,

            badge:
              wishlistCount > 0
                ? `${wishlistCount} saved`
                : undefined,

            description:
              wishlistCount > 0
                ? 'Saved products are ready to revisit.'
                : 'You currently have no saved products.'
          };

        case 'continue-shopping':
        case 'recently-viewed':
          return {
            ...widget,

            enabled:
              widget.enabled &&
              recentCount > 0,

            badge:
              recentCount > 0
                ? `${recentCount} recent`
                : undefined,

            description:
              recentCount > 0
                ? 'Continue exactly where you stopped.'
                : widget.description
          };

        /*
         * Everything below this point requires the optional
         * experience dataset.
         *
         * When it is unavailable, preserve the configured
         * widget instead of exiting before commerce resolution.
         */
        case 'delivery-tracker':
        case 'active-delivery': {
          if (commerceActiveDelivery) {
            const statusLabel = commerceActiveDelivery.status.replaceAll('_', ' ').toLowerCase();
            const timeline = commerceActiveDelivery.events.slice(-5).map((event, index, events) => ({
              id: event.id,
              label: event.status.replaceAll('_', ' '),
              description: event.note ?? undefined,
              completed: index < events.length - 1,
              active: index === events.length - 1,
              time: new Date(event.createdAt).toLocaleTimeString('en-NG', {
                hour: 'numeric',
                minute: '2-digit'
              })
            }));

            return {
              ...widget,
              enabled: widget.enabled,
              badge: 'Live',
              description: `Order ${commerceActiveDelivery.orderNumber} is ${statusLabel}.`,
              location: commerceActiveDelivery.location
                ? {
                    title: 'Latest delivery position',
                    subtitle: commerceActiveDelivery.lastLocationAt
                      ? `Updated ${new Date(commerceActiveDelivery.lastLocationAt).toLocaleString('en-NG')}`
                      : undefined,
                    coordinates: commerceActiveDelivery.location
                  }
                : widget.location,
              progress: {
                label: 'Delivery progress',
                value:
                  commerceActiveDelivery.status === 'ARRIVED'
                    ? 90
                    : commerceActiveDelivery.status === 'IN_TRANSIT'
                      ? 72
                      : commerceActiveDelivery.status === 'PICKED_UP'
                        ? 55
                        : commerceActiveDelivery.status === 'ASSIGNED'
                          ? 30
                          : 15,
                helper: statusLabel
              },
              timeline: timeline.length > 0 ? timeline : widget.timeline,
              stats: [
                {
                  label: 'Order',
                  value: commerceActiveDelivery.orderNumber
                },
                {
                  label: 'Status',
                  value: commerceActiveDelivery.status.replaceAll('_', ' ')
                }
              ],
              action: {
                label: 'Track order',
                href: `/orders?order=${encodeURIComponent(commerceActiveDelivery.orderId)}`
              }
            };
          }

          if (!experience) {
            return {
              ...widget,
              enabled: false
            };
          }

          const activeDelivery = experience.orders.activeDelivery;

          return {
            ...widget,
            enabled: widget.enabled && Boolean(activeDelivery),
            badge: activeDelivery ? `${activeDelivery.etaMinutes} min` : undefined,
            description: activeDelivery
              ? `Order #${activeDelivery.orderId} is ${activeDelivery.status.replace(/-/g, ' ')}.`
              : widget.description,
            location: activeDelivery?.location,
            progress: activeDelivery
              ? {
                  label: 'Delivery progress',
                  value: activeDelivery.progress,
                  helper: activeDelivery.status.replace(/-/g, ' ')
                }
              : widget.progress,
            timeline: activeDelivery?.timeline,
            conditions: activeDelivery?.conditions,
            stats: activeDelivery
              ? [
                  {
                    label: 'ETA',
                    value: `${activeDelivery.etaMinutes} mins`
                  },
                  {
                    label: 'Order',
                    value: `#${activeDelivery.orderId}`
                  }
                ]
              : widget.stats
          };
        }

        case 'recent-orders': {
          if (commerceOrders.length > 0) {
            const completedOrderCount = commerceOrders.filter(
              order => order.status === 'DELIVERED'
            ).length;
            const activeOrderCount = commerceOrders.filter(
              order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
            ).length;
            const inProgressCount = activeOrderCount + (cartCount > 0 ? 1 : 0);

            return {
              ...widget,
              enabled: widget.enabled,
              badge: inProgressCount > 0 ? `${inProgressCount} in progress` : undefined,
              description:
                cartCount > 0
                  ? `${cartCount} ${
                      cartCount === 1 ? 'cart selection is' : 'cart selections are'
                    } waiting alongside your orders.`
                  : 'Your latest Shelsea order activity.',
              stats: [
                {
                  label: 'Completed',
                  value: completedOrderCount
                },
                {
                  label: 'In progress',
                  value: inProgressCount
                },
                {
                  label: 'Orders',
                  value: commerceOrders.length
                }
              ],
              action: {
                label: 'View orders',
                href: '/orders'
              }
            };
          }

          const recentOrders = experience?.orders.recent ?? [];
          const completedOrderCount = recentOrders.filter(
            order => order.status === 'delivered'
          ).length;
          const activeOrderCount = recentOrders.filter(
            order => order.status !== 'delivered'
          ).length;
          const inProgressCount = activeOrderCount + (cartCount > 0 ? 1 : 0);

          return {
            ...widget,
            enabled: widget.enabled && (recentOrders.length > 0 || cartCount > 0),
            badge: inProgressCount > 0 ? `${inProgressCount} in progress` : undefined,
            description:
              cartCount > 0
                ? `${cartCount} ${
                    cartCount === 1 ? 'cart selection is' : 'cart selections are'
                  } waiting alongside your active orders.`
                : recentOrders.length > 0
                  ? 'Your latest Shelsea order activity.'
                  : 'You have no active shopping activity yet.',
            stats: [
              {
                label: 'Completed',
                value: completedOrderCount
              },
              {
                label: 'In progress',
                value: inProgressCount
              },
              {
                label: 'Cart items',
                value: cartCount
              }
            ]
          };
        }

        case 'rewards-summary':
        case 'reward-points': {
          if (!experience) {
            return widget;
          }

          const rewards = experience.rewards;

          return {
            ...widget,

            enabled:
              widget.enabled &&
              rewards.tier !== 'guest',

            badge:
              rewards.tier === 'premium'
                ? 'Premium'
                : 'Member',

            stats: [
              {
                label: 'Points',
                value:
                  rewards.points.toLocaleString()
              },
              {
                label: 'Coupons',
                value: rewards.coupons
              }
            ],

            progress: {
              label: rewards.nextTier
                ? `To ${rewards.nextTier}`
                : 'Membership progress',

              value:
                rewards.progressToNextTier,

              helper: rewards.nextTier
                ? `${
                    100 -
                    rewards.progressToNextTier
                  }% remaining`
                : undefined
            },

            insight:
              rewards.expiringPoints
                ? `${rewards.expiringPoints} points will expire soon.`
                : widget.insight
          };
      }

        case 'coupons': {
          if (!experience) {
            return widget;
          }

          const coupons = experience.coupons;

          return {
            ...widget,

            enabled:
              widget.enabled &&
              coupons.length > 0,

            badge:
              coupons.length > 0
                ? `${coupons.length} active`
                : undefined,

            slides: coupons.map(coupon => ({
              id: coupon.id,
              title: coupon.title,
              subtitle: coupon.description,
              badge: coupon.badge,
              image: coupon.image
            }))
          };
        }

        case 'suggested-picks':
        case 'ai-suggestions': {
          if (!experience) {
            return widget;
          }

          const intelligence =
            experience.intelligence;

          return {
            ...widget,

            enabled:
              widget.enabled &&
              intelligence.suggestedProductIds
                .length > 0,

            title:
              user.tier === 'premium'
                ? 'Premium Intelligence'
                : 'AJ AI Suggestions',

            description:
              intelligence.headline,

            insight:
              intelligence.insight,

            badge:
              user.tier === 'premium'
                ? 'Exclusive'
                : 'Smart'
          };
        }

        case 'pairing-assistant': {
          if (!experience) {
            return widget;
          }

          const intelligence =
            experience.intelligence;

          return {
            ...widget,

            enabled:
              widget.enabled &&
              intelligence.pairingProductIds
                .length > 0,

            insight:
              intelligence.insight
          };
        }

        case 'shopping-promos':
        case 'home-deals':
          if (!experience) {
            return widget;
          }

          return {
            ...widget,

            description:
              experience.promotions
                .bannerMessage,

            badge:
              user.tier === 'premium'
                ? 'Reserved'
                : widget.badge
          };

        default:
          return widget;
      }
    }
  );

  return resolvedWidgets
    .filter(widget => widget.enabled)
    .sort(
      (firstWidget, secondWidget) =>
        firstWidget.order -
        secondWidget.order
    );
}