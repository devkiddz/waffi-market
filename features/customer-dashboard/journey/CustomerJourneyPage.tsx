import Image from 'next/image';
import Link from 'next/link';

import type {
  ReactNode
} from 'react';

import type {
  LucideIcon
} from 'lucide-react';

import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  CreditCard,
  Heart,
  History,
  Layers3,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  WalletCards,
  Warehouse
} from 'lucide-react';

import {
  getCustomerJourneyDefinition,
  type CustomerJourneySlug
} from '@/features/customer-experience/customerJourneyRoutes';

import {
  CompactDeliveryMap
} from '@/features/delivery-runtime/CompactDeliveryMap';

import {
  cn
} from '@/lib/utils';

import type {
  CommerceCartItem,
  CommerceDashboardData,
  CommerceHistoryEntry,
  CommerceOrder,
  CommerceProduct
} from '../contracts/customerDashboardTypes';

type CustomerJourneyPageProps = {
  journey: CustomerJourneySlug;
  data: CommerceDashboardData;
};

type JourneyMetric = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

const ACTIVE_DELIVERY_STATUSES =
  new Set([
    'PENDING',
    'ASSIGNED',
    'BARCODE_SCANNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'ARRIVED'
  ]);

const DELIVERY_STAGES = [
  'ASSIGNED',
  'BARCODE_SCANNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED'
] as const;

const journeyVisuals = {
  'recent-views': {
    icon: Clock3,
    accent:
      'from-slate-500/18 via-slate-500/5 to-transparent',
    iconClass:
      'bg-slate-500/12 text-slate-700 dark:text-slate-200'
  },

  wishlist: {
    icon: Heart,
    accent:
      'from-rose-500/18 via-rose-500/5 to-transparent',
    iconClass:
      'bg-rose-500/12 text-rose-700 dark:text-rose-200'
  },

  cart: {
    icon: ShoppingBag,
    accent:
      'from-amber-500/18 via-amber-500/5 to-transparent',
    iconClass:
      'bg-amber-500/12 text-amber-700 dark:text-amber-200'
  },

  activity: {
    icon: History,
    accent:
      'from-violet-500/18 via-violet-500/5 to-transparent',
    iconClass:
      'bg-violet-500/12 text-violet-700 dark:text-violet-200'
  },

  orders: {
    icon: ReceiptText,
    accent:
      'from-indigo-500/18 via-indigo-500/5 to-transparent',
    iconClass:
      'bg-indigo-500/12 text-indigo-700 dark:text-indigo-200'
  },

  deliveries: {
    icon: Truck,
    accent:
      'from-emerald-500/18 via-emerald-500/5 to-transparent',
    iconClass:
      'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
  }
} satisfies Record<
  CustomerJourneySlug,
  {
    icon: LucideIcon;
    accent: string;
    iconClass: string;
  }
>;

export function CustomerJourneyPage({
  journey,
  data
}: CustomerJourneyPageProps) {
  const definition =
    getCustomerJourneyDefinition(journey);

  const visual =
    journeyVisuals[journey];

  const JourneyIcon =
    visual.icon;

  const activeDeliveries =
    data.orders.filter(order => {
      const status =
        order.delivery?.status ??
        order.status;

      return ACTIVE_DELIVERY_STATUSES.has(
        status.toUpperCase()
      );
    });

  const metrics =
    resolveJourneyMetrics(
      journey,
      data,
      activeDeliveries
    );

  const currency =
    data.workspace.wallet?.currency ??
    'NGN';

  return (
    <main
      className="
        min-h-dvh bg-muted/20
        px-[var(--app-page-gutter)]
        py-4 sm:py-5
      ">
      <div className="mx-auto w-full max-w-[96rem] space-y-4">
        <section
          className="
            relative overflow-hidden
            rounded-[var(--app-card-radius)]
            border border-border/60
            bg-card/80 shadow-sm
          ">
          <div
            className={cn(
              `
                pointer-events-none
                absolute inset-0
                bg-gradient-to-br
              `,
              visual.accent
            )}
          />

          <div
            className="
              relative grid gap-5
              p-4 sm:p-5
              xl:grid-cols-[minmax(0,1fr)_auto]
              xl:items-end
            ">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    `
                      grid size-11 shrink-0
                      place-items-center
                      rounded-2xl
                      [&_svg]:size-5
                    `,
                    visual.iconClass
                  )}>
                  <JourneyIcon />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="
                        rounded-full
                        border border-border/60
                        bg-background/70
                        px-2.5 py-1
                        text-[10px] font-bold
                        uppercase tracking-[0.16em]
                        text-muted-foreground
                      ">
                      {definition.code}
                    </span>

                    <span
                      className="
                        text-[10px] font-bold
                        uppercase tracking-[0.18em]
                        text-primary/65
                      ">
                      {definition.eyebrow}
                    </span>
                  </div>

                  <h1
                    className="
                      mt-2 text-2xl
                      font-black tracking-tight
                      sm:text-3xl
                    ">
                    {definition.title}
                  </h1>

                  <p
                    className="
                      mt-2 max-w-3xl
                      text-sm leading-6
                      text-muted-foreground
                    ">
                    {definition.description}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                flex flex-wrap items-center
                gap-2 xl:justify-end
              ">
              <JourneyContextBadge
                icon={BadgeCheck}
                label={
                  data.workspace.name
                }
              />

              <JourneyContextBadge
                icon={Layers3}
                label={
                  data.workspace.mode
                }
              />

              <JourneyContextBadge
                icon={CalendarDays}
                label={formatDateTime(
                  data.generatedAt
                )}
              />
            </div>
          </div>

          <div
            className="
              relative grid gap-2.5
              border-t border-border/50
              p-3 sm:grid-cols-2
              sm:p-4 xl:grid-cols-4
            ">
            {metrics.map(metric => (
              <JourneyMetricCard
                key={metric.label}
                metric={metric}
              />
            ))}
          </div>
        </section>

        <JourneyBody
          journey={journey}
          data={data}
          activeDeliveries={
            activeDeliveries
          }
          currency={currency}
        />

        <section
          className="
            rounded-2xl border
            border-border/50
            bg-card/50 px-4 py-3
            text-xs leading-5
            text-muted-foreground
          ">
          This dedicated page contains the complete
          available record for this journey inside the
          active workspace. Use the single global
          Experience History control in the navbar to
          return to, or jump between, earlier contexts.
        </section>

        <div className="h-20 lg:h-8" />
      </div>
    </main>
  );
}

function JourneyBody({
  journey,
  data,
  activeDeliveries,
  currency
}: {
  journey: CustomerJourneySlug;
  data: CommerceDashboardData;
  activeDeliveries: CommerceOrder[];
  currency: string;
}) {
  switch (journey) {
    case 'recent-views':
      return (
        <ProductJourneyCollection
          products={data.recentProducts}
          currency={currency}
          mode="recent"
        />
      );

    case 'wishlist':
      return (
        <ProductJourneyCollection
          products={data.wishlistProducts}
          currency={currency}
          mode="wishlist"
        />
      );

    case 'cart':
      return (
        <CartJourneyDetails
          items={data.cartItems}
          quantity={
            data.pulse.cartQuantity
          }
          subtotal={
            data.pulse.cartSubtotal
          }
          currency={currency}
        />
      );

    case 'activity':
      return (
        <ActivityJourneyDetails
          history={data.history}
        />
      );

    case 'orders':
      return (
        <OrdersJourneyDetails
          orders={data.orders}
          currency={currency}
        />
      );

    case 'deliveries':
      return (
        <DeliveriesJourneyDetails
          orders={activeDeliveries}
          currency={currency}
          workspaceId={data.workspace.id}
        />
      );
  }
}

function JourneyContextBadge({
  icon: Icon,
  label
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span
      className="
        inline-flex min-h-9
        items-center gap-2
        rounded-full
        border border-border/60
        bg-background/70
        px-3 text-[11px]
        font-semibold
        text-muted-foreground
        shadow-sm
      ">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function JourneyMetricCard({
  metric
}: {
  metric: JourneyMetric;
}) {
  const Icon =
    metric.icon;

  return (
    <article
      className="
        flex min-w-0 items-center
        gap-3 rounded-2xl
        border border-border/50
        bg-background/65
        p-3 shadow-sm
      ">
      <span
        className="
          grid size-9 shrink-0
          place-items-center
          rounded-xl
          bg-primary/10
          text-primary
        ">
        <Icon className="size-4" />
      </span>

      <div className="min-w-0">
        <p
          className="
            truncate text-lg
            font-black leading-none
          ">
          {metric.value}
        </p>

        <p
          className="
            mt-1 truncate
            text-[11px] font-semibold
          ">
          {metric.label}
        </p>

        <p
          className="
            mt-0.5 truncate
            text-[10px]
            text-muted-foreground
          ">
          {metric.helper}
        </p>
      </div>
    </article>
  );
}

function resolveJourneyMetrics(
  journey: CustomerJourneySlug,
  data: CommerceDashboardData,
  activeDeliveries: CommerceOrder[]
): JourneyMetric[] {
  const currency =
    data.workspace.wallet?.currency ??
    'NGN';

  switch (journey) {
    case 'recent-views': {
      const products =
        data.recentProducts;

      const categories =
        new Set(
          products.map(
            product =>
              product.categorySlug
          )
        ).size;

      const averageRating =
        products.length > 0
          ? products.reduce(
              (
                total,
                product
              ) =>
                total +
                product.rating,
              0
            ) /
            products.length
          : 0;

      return [
        {
          label: 'Products viewed',
          value:
            products.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Latest recorded interests',
          icon: Clock3
        },
        {
          label: 'Available now',
          value:
            products
              .filter(
                product =>
                  product.available
              )
              .length.toLocaleString(
                'en-NG'
              ),
          helper:
            'Ready for purchase',
          icon: PackageCheck
        },
        {
          label: 'Categories',
          value:
            categories.toLocaleString(
              'en-NG'
            ),
          helper:
            'Discovery spread',
          icon: Layers3
        },
        {
          label: 'Average rating',
          value:
            averageRating.toFixed(1),
          helper:
            'Across viewed products',
          icon: Star
        }
      ];
    }

    case 'wishlist': {
      const products =
        data.wishlistProducts;

      const estimatedValue =
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.price,
          0
        );

      return [
        {
          label: 'Saved products',
          value:
            products.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Your deliberate interests',
          icon: Heart
        },
        {
          label: 'In stock',
          value:
            products
              .filter(
                product =>
                  product.available
              )
              .length.toLocaleString(
                'en-NG'
              ),
          helper:
            'Available now',
          icon: Warehouse
        },
        {
          label: 'Estimated value',
          value: formatMoney(
            estimatedValue,
            currency
          ),
          helper:
            'Current listed prices',
          icon: WalletCards
        },
        {
          label: 'Low stock',
          value:
            products
              .filter(
                product =>
                  product.available &&
                  product.stockLeft <=
                    5
              )
              .length.toLocaleString(
                'en-NG'
              ),
          helper:
            'Five or fewer remaining',
          icon: Sparkles
        }
      ];
    }

    case 'cart':
      return [
        {
          label: 'Cart units',
          value:
            data.pulse.cartQuantity.toLocaleString(
              'en-NG'
            ),
          helper:
            'Total quantity prepared',
          icon: ShoppingBag
        },
        {
          label: 'Product lines',
          value:
            data.cartItems.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Distinct cart entries',
          icon: Layers3
        },
        {
          label: 'Subtotal',
          value: formatMoney(
            data.pulse.cartSubtotal,
            currency
          ),
          helper:
            'Before delivery and discounts',
          icon: WalletCards
        },
        {
          label: 'Available lines',
          value:
            data.cartItems
              .filter(
                item =>
                  item.product.available
              )
              .length.toLocaleString(
                'en-NG'
              ),
          helper:
            'Currently purchasable',
          icon: PackageCheck
        }
      ];

    case 'activity': {
      const sources =
        new Set(
          data.history.map(
            entry =>
              entry.source
          )
        ).size;

      const productEntries =
        data.history.filter(
          entry =>
            Boolean(
              entry.productId
            )
        ).length;

      return [
        {
          label: 'Recorded entries',
          value:
            data.history.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Meaningful experiences',
          icon: History
        },
        {
          label: 'Journey sources',
          value:
            sources.toLocaleString(
              'en-NG'
            ),
          helper:
            'Discovery channels',
          icon: Activity
        },
        {
          label: 'Product contexts',
          value:
            productEntries.toLocaleString(
              'en-NG'
            ),
          helper:
            'Product-linked moments',
          icon: PackageCheck
        },
        {
          label: 'Latest activity',
          value:
            data.history[0]
              ? formatDate(
                  data.history[0]
                    .visitedAt
                )
              : 'None',
          helper:
            'Newest retained record',
          icon: CalendarDays
        }
      ];
    }

    case 'orders': {
      const paid =
        data.orders.filter(
          order =>
            order.paymentStatus ===
            'PAID'
        ).length;

      const delivered =
        data.orders.filter(
          order =>
            order.status ===
            'DELIVERED'
        ).length;

      const recordedValue =
        data.orders.reduce(
          (
            total,
            order
          ) =>
            total +
            order.total,
          0
        );

      return [
        {
          label: 'Recorded orders',
          value:
            data.orders.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Newest order records',
          icon: ReceiptText
        },
        {
          label: 'Paid orders',
          value:
            paid.toLocaleString(
              'en-NG'
            ),
          helper:
            'Confirmed payments',
          icon: CreditCard
        },
        {
          label: 'Delivered',
          value:
            delivered.toLocaleString(
              'en-NG'
            ),
          helper:
            'Completed fulfilments',
          icon: PackageCheck
        },
        {
          label: 'Recorded value',
          value: formatMoney(
            recordedValue,
            currency
          ),
          helper:
            'Across visible orders',
          icon: WalletCards
        }
      ];
    }

    case 'deliveries': {
      const trackingEnabled =
        activeDeliveries.filter(
          order =>
            order.delivery
              ?.trackingEnabled
        ).length;

      const estimated =
        activeDeliveries.filter(
          order =>
            Boolean(
              order.delivery
                ?.estimatedArrival
            )
        ).length;

      const units =
        activeDeliveries.reduce(
          (
            orderTotal,
            order
          ) =>
            orderTotal +
            order.items.reduce(
              (
                itemTotal,
                item
              ) =>
                itemTotal +
                item.quantity,
              0
            ),
          0
        );

      return [
        {
          label: 'Active deliveries',
          value:
            activeDeliveries.length.toLocaleString(
              'en-NG'
            ),
          helper:
            'Current fulfilment journeys',
          icon: Truck
        },
        {
          label: 'Live tracking',
          value:
            trackingEnabled.toLocaleString(
              'en-NG'
            ),
          helper:
            'Tracking-enabled records',
          icon: Activity
        },
        {
          label: 'ETA available',
          value:
            estimated.toLocaleString(
              'en-NG'
            ),
          helper:
            'Estimated arrival recorded',
          icon: Clock3
        },
        {
          label: 'Units moving',
          value:
            units.toLocaleString(
              'en-NG'
            ),
          helper:
            'Items across active orders',
          icon: ShoppingBag
        }
      ];
    }
  }
}

function ProductJourneyCollection({
  products,
  currency,
  mode
}: {
  products: CommerceProduct[];
  currency: string;
  mode: 'recent' | 'wishlist';
}) {
  const title =
    mode === 'recent'
      ? 'Complete viewing trail'
      : 'Complete saved collection';

  const description =
    mode === 'recent'
      ? 'Every recently viewed product is presented with current price, stock position, rating and category context.'
      : 'Every saved product is presented with current value, availability and stock pressure so your wishlist remains actionable.';

  if (products.length === 0) {
    return (
      <EmptyJourneyState
        title={
          mode === 'recent'
            ? 'No recent products yet'
            : 'Your wishlist is empty'
        }
        description={
          mode === 'recent'
            ? 'Products you inspect in the Store will appear here as your browsing memory grows.'
            : 'Save products from the Store and they will become part of this dedicated wishlist journey.'
        }
      />
    );
  }

  return (
    <section
      className="
        rounded-[var(--app-card-radius)]
        border border-border/60
        bg-card/70 p-4
        shadow-sm sm:p-5
      ">
      <header
        className="
          flex flex-col gap-3
          border-b border-border/50
          pb-4 sm:flex-row
          sm:items-end
          sm:justify-between
        ">
        <div>
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.18em]
              text-primary/65
            ">
            Product journey
          </p>

          <h2
            className="
              mt-1 text-xl
              font-black tracking-tight
            ">
            {title}
          </h2>

          <p
            className="
              mt-1 max-w-3xl
              text-sm leading-6
              text-muted-foreground
            ">
            {description}
          </p>
        </div>

        <span
          className="
            w-fit rounded-full
            bg-muted px-3 py-1.5
            text-xs font-bold
            text-muted-foreground
          ">
          {products.length}{' '}
          {products.length === 1
            ? 'product'
            : 'products'}
        </span>
      </header>

      <div
        className="
          mt-4 grid gap-3
          sm:grid-cols-2
          xl:grid-cols-3
          2xl:grid-cols-4
        ">
        {products.map(product => (
          <JourneyProductCard
            key={product.id}
            product={product}
            currency={currency}
            mode={mode}
          />
        ))}
      </div>
    </section>
  );
}

function JourneyProductCard({
  product,
  currency,
  mode
}: {
  product: CommerceProduct;
  currency: string;
  mode: 'recent' | 'wishlist';
}) {
  return (
    <Link
      href={`/products/${encodeURIComponent(
        product.slug
      )}`}
      className="
        group overflow-hidden
        rounded-2xl border
        border-border/60
        bg-background/70
        shadow-sm transition
        hover:-translate-y-0.5
        hover:border-primary/25
        hover:shadow-md
      ">
      <div
        className="
          relative aspect-[4/3]
          overflow-hidden bg-muted
        ">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="
              (max-width: 640px) 100vw,
              (max-width: 1280px) 50vw,
              25vw
            "
            className="
              object-cover
              transition duration-500
              group-hover:scale-[1.03]
            "
          />
        ) : (
          <div className="grid size-full place-items-center">
            <ShoppingBag className="size-8 text-muted-foreground" />
          </div>
        )}

        <div
          className="
            absolute inset-x-0 bottom-0
            h-24 bg-gradient-to-t
            from-black/70 via-black/15
            to-transparent
          "
        />

        <div
          className="
            absolute left-2 top-2
            flex flex-wrap gap-1.5
          ">
          <span
            className="
              rounded-full bg-black/55
              px-2 py-1
              text-[9px] font-bold
              text-white backdrop-blur
            ">
            {mode === 'recent'
              ? 'Recently viewed'
              : 'Saved'}
          </span>

          {product.featured ? (
            <span
              className="
                rounded-full
                bg-amber-400
                px-2 py-1
                text-[9px] font-bold
                text-black
              ">
              Featured
            </span>
          ) : null}

          {product.isNew ? (
            <span
              className="
                rounded-full
                bg-emerald-500
                px-2 py-1
                text-[9px] font-bold
                text-white
              ">
              New
            </span>
          ) : null}
        </div>

        <span
          className="
            absolute bottom-2 right-2
            grid size-8 place-items-center
            rounded-xl bg-white/90
            text-slate-950 shadow-sm
          ">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="p-3.5">
        <p
          className="
            text-[10px] font-bold
            uppercase tracking-[0.14em]
            text-muted-foreground
          ">
          {product.categorySlug.replaceAll(
            '-',
            ' '
          )}
        </p>

        <h3
          className="
            mt-1 line-clamp-2
            min-h-10 text-sm
            font-bold leading-5
          ">
          {product.name}
        </h3>

        <div
          className="
            mt-3 flex items-end
            justify-between gap-3
          ">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">
              {formatMoney(
                product.price,
                currency
              )}
            </p>

            <p
              className={cn(
                `
                  mt-1 text-[10px]
                  font-semibold
                `,
                product.available
                  ? 'text-emerald-600 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              )}>
              {product.available
                ? `${product.stockLeft} left`
                : 'Unavailable'}
            </p>
          </div>

          <span
            className="
              flex shrink-0
              items-center gap-1
              text-xs font-bold
              text-muted-foreground
            ">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(
              1
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CartJourneyDetails({
  items,
  quantity,
  subtotal,
  currency
}: {
  items: CommerceCartItem[];
  quantity: number;
  subtotal: number;
  currency: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyJourneyState
        title="Your cart journey is empty"
        description="Add products from the Store and this page will present the complete purchase composition before checkout."
      />
    );
  }

  const availableLines =
    items.filter(
      item =>
        item.product.available
    ).length;

  return (
    <section
      className="
        grid gap-4
        xl:grid-cols-[minmax(0,1fr)_20rem]
      ">
      <div
        className="
          rounded-[var(--app-card-radius)]
          border border-border/60
          bg-card/70 p-4
          shadow-sm sm:p-5
        ">
        <header
          className="
            border-b border-border/50
            pb-4
          ">
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.18em]
              text-primary/65
            ">
            Prepared products
          </p>

          <h2 className="mt-1 text-xl font-black">
            Cart composition
          </h2>

          <p
            className="
              mt-1 text-sm leading-6
              text-muted-foreground
            ">
            Variants, quantities, current availability
            and exact line totals for every product
            prepared in this cart.
          </p>
        </header>

        <div className="mt-4 space-y-3">
          {items.map(item => (
            <article
              key={item.id}
              className="
                grid gap-3 rounded-2xl
                border border-border/55
                bg-background/65 p-3
                sm:grid-cols-[5rem_minmax(0,1fr)_auto]
                sm:items-center
              ">
              <Link
                href={`/products/${encodeURIComponent(
                  item.product.slug
                )}`}
                className="
                  relative aspect-square
                  overflow-hidden rounded-xl
                  bg-muted
                ">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <ShoppingBag className="absolute inset-0 m-auto size-6 text-muted-foreground" />
                )}
              </Link>

              <div className="min-w-0">
                <Link
                  href={`/products/${encodeURIComponent(
                    item.product.slug
                  )}`}
                  className="
                    line-clamp-2 text-sm
                    font-bold leading-5
                    hover:text-primary/70
                  ">
                  {item.product.name}
                </Link>

                <div
                  className="
                    mt-2 flex flex-wrap
                    items-center gap-2
                    text-[11px]
                    text-muted-foreground
                  ">
                  <span
                    className="
                      rounded-full bg-muted
                      px-2 py-1
                      font-semibold
                    ">
                    {item.variantLabel}
                  </span>

                  <span>
                    Quantity{' '}
                    <strong className="text-foreground">
                      {item.quantity}
                    </strong>
                  </span>

                  <span>
                    {formatMoney(
                      item.unitPrice,
                      currency
                    )}{' '}
                    each
                  </span>
                </div>

                <p
                  className={cn(
                    `
                      mt-2 text-[11px]
                      font-semibold
                    `,
                    item.product.available
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                  )}>
                  {item.product.available
                    ? `${item.product.stockLeft} currently available`
                    : 'This product is currently unavailable'}
                </p>
              </div>

              <div className="sm:text-right">
                <p
                  className="
                    text-[10px] font-bold
                    uppercase tracking-[0.14em]
                    text-muted-foreground
                  ">
                  Line total
                </p>

                <p className="mt-1 text-base font-black">
                  {formatMoney(
                    item.lineTotal,
                    currency
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside
        className="
          h-fit rounded-[var(--app-card-radius)]
          border border-border/60
          bg-card/80 p-4
          shadow-sm xl:sticky
          xl:top-[calc(var(--app-navbar-height)+1rem)]
        ">
        <p
          className="
            text-[10px] font-bold
            uppercase tracking-[0.18em]
            text-primary/65
          ">
          Cart readiness
        </p>

        <h2 className="mt-1 text-lg font-black">
          Journey summary
        </h2>

        <div className="mt-4 space-y-3">
          <SummaryLine
            label="Product lines"
            value={items.length.toLocaleString(
              'en-NG'
            )}
          />

          <SummaryLine
            label="Total quantity"
            value={quantity.toLocaleString(
              'en-NG'
            )}
          />

          <SummaryLine
            label="Available lines"
            value={availableLines.toLocaleString(
              'en-NG'
            )}
          />

          <SummaryLine
            label="Subtotal"
            value={formatMoney(
              subtotal,
              currency
            )}
            strong
          />
        </div>

        <Link
          href="/cart"
          className="
            mt-5 inline-flex
            h-11 w-full items-center
            justify-center gap-2
            rounded-xl bg-foreground
            px-4 text-xs font-bold
            text-background
            transition hover:opacity-90
          ">
          Manage live cart
          <ArrowUpRight className="size-4" />
        </Link>
      </aside>
    </section>
  );
}

function ActivityJourneyDetails({
  history
}: {
  history: CommerceHistoryEntry[];
}) {
  if (history.length === 0) {
    return (
      <EmptyJourneyState
        title="No activity has been retained yet"
        description="Meaningful products, collections, campaigns, searches and Discovery Hub experiences will appear here as your journey grows."
      />
    );
  }

  const sourceCounts =
    Array.from(
      history.reduce(
        (
          counts,
          entry
        ) => {
          counts.set(
            entry.source,
            (counts.get(
              entry.source
            ) ?? 0) + 1
          );

          return counts;
        },
        new Map<
          CommerceHistoryEntry['source'],
          number
        >()
      )
    ).sort(
      (
        first,
        second
      ) =>
        second[1] -
        first[1]
    );

  return (
    <section
      className="
        grid gap-4
        xl:grid-cols-[minmax(0,1fr)_20rem]
      ">
      <div
        className="
          rounded-[var(--app-card-radius)]
          border border-border/60
          bg-card/70 p-4
          shadow-sm sm:p-5
        ">
        <header
          className="
            border-b border-border/50
            pb-4
          ">
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.18em]
              text-primary/65
            ">
            Retained transitions
          </p>

          <h2 className="mt-1 text-xl font-black">
            Experience timeline
          </h2>

          <p
            className="
              mt-1 text-sm leading-6
              text-muted-foreground
            ">
            Newest experiences appear first. Each
            record preserves the context that made the
            transition meaningful.
          </p>
        </header>

        <div className="mt-4 space-y-2">
          {history.map(
            (
              entry,
              index
            ) => {
              const destination =
                historyDestination(
                  entry
                );

              return (
                <article
                  key={entry.id}
                  className="
                    relative grid gap-3
                    rounded-2xl border
                    border-border/55
                    bg-background/65
                    p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]
                    sm:items-center
                  ">
                  <span
                    className="
                      grid size-9 shrink-0
                      place-items-center
                      rounded-xl
                      bg-primary/10
                      text-xs font-black
                      text-primary
                    ">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      '0'
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="
                          rounded-full
                          bg-muted px-2 py-1
                          text-[9px] font-bold
                          uppercase tracking-[0.12em]
                          text-muted-foreground
                        ">
                        {formatStatus(
                          entry.source
                        )}
                      </span>

                      <time
                        dateTime={
                          entry.visitedAt
                        }
                        className="
                          text-[10px]
                          text-muted-foreground
                        ">
                        {formatDateTime(
                          entry.visitedAt
                        )}
                      </time>
                    </div>

                    <h3
                      className="
                        mt-2 text-sm
                        font-bold
                      ">
                      {entry.label}
                    </h3>

                    <p
                      className="
                        mt-1 line-clamp-2
                        text-xs leading-5
                        text-muted-foreground
                      ">
                      {entry.subtitle ??
                        `Context preserved in ${entry.categorySlug.replaceAll(
                          '-',
                          ' '
                        )}.`}
                    </p>
                  </div>

                  <Link
                    href={destination}
                    className="
                      inline-flex h-9
                      items-center justify-center
                      gap-2 rounded-xl
                      border border-border/60
                      bg-background px-3
                      text-[10px] font-bold
                      transition
                      hover:border-primary/25
                      hover:bg-muted
                    ">
                    Open context
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </article>
              );
            }
          )}
        </div>
      </div>

      <aside
        className="
          h-fit rounded-[var(--app-card-radius)]
          border border-border/60
          bg-card/80 p-4
          shadow-sm xl:sticky
          xl:top-[calc(var(--app-navbar-height)+1rem)]
        ">
        <p
          className="
            text-[10px] font-bold
            uppercase tracking-[0.18em]
            text-primary/65
          ">
          Source intelligence
        </p>

        <h2 className="mt-1 text-lg font-black">
          Journey composition
        </h2>

        <div className="mt-4 space-y-2">
          {sourceCounts.map(
            ([
              source,
              count
            ]) => (
              <div
                key={source}
                className="
                  flex items-center
                  justify-between gap-3
                  rounded-xl
                  border border-border/50
                  bg-background/60
                  px-3 py-2.5
                ">
                <span
                  className="
                    min-w-0 truncate
                    text-xs font-semibold
                  ">
                  {formatStatus(
                    source
                  )}
                </span>

                <span
                  className="
                    rounded-full
                    bg-primary/10
                    px-2 py-1
                    text-[10px] font-black
                    text-primary
                  ">
                  {count}
                </span>
              </div>
            )
          )}
        </div>
      </aside>
    </section>
  );
}

function OrdersJourneyDetails({
  orders,
  currency
}: {
  orders: CommerceOrder[];
  currency: string;
}) {
  if (orders.length === 0) {
    return (
      <EmptyJourneyState
        title="No order history yet"
        description="Orders completed or prepared through Shelsea will appear here with their complete commerce record."
      />
    );
  }

  return (
    <section className="space-y-4">
      {orders.map(order => (
        <OrderJourneyCard
          key={order.id}
          order={order}
          currency={currency}
        />
      ))}
    </section>
  );
}

function OrderJourneyCard({
  order,
  currency
}: {
  order: CommerceOrder;
  currency: string;
}) {
  return (
    <article
      className="
        overflow-hidden
        rounded-[var(--app-card-radius)]
        border border-border/60
        bg-card/75 shadow-sm
      ">
      <header
        className="
          flex flex-col gap-3
          border-b border-border/50
          p-4 sm:flex-row
          sm:items-start
          sm:justify-between
          sm:p-5
        ">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              value={order.status}
            />

            <StatusPill
              value={
                order.paymentStatus
              }
              payment
            />
          </div>

          <h2 className="mt-3 text-lg font-black">
            Order {order.orderNumber}
          </h2>

          <p
            className="
              mt-1 text-xs
              text-muted-foreground
            ">
            Created{' '}
            {formatDateTime(
              order.createdAt
            )}
          </p>
        </div>

        <div className="sm:text-right">
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.16em]
              text-muted-foreground
            ">
            Order total
          </p>

          <p className="mt-1 text-xl font-black">
            {formatMoney(
              order.total,
              currency
            )}
          </p>
        </div>
      </header>

      <div
        className="
          grid gap-4 p-4
          sm:p-5 xl:grid-cols-[minmax(0,1fr)_19rem]
        ">
        <div>
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.16em]
              text-primary/65
            ">
            Order items
          </p>

          <div className="mt-3 space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="
                  grid gap-3 rounded-2xl
                  border border-border/50
                  bg-background/60 p-3
                  sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]
                  sm:items-center
                ">
                <Link
                  href={`/products/${encodeURIComponent(
                    item.productSlug
                  )}`}
                  className="
                    relative aspect-square
                    overflow-hidden
                    rounded-xl bg-muted
                  ">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <ShoppingBag className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                  )}
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/products/${encodeURIComponent(
                      item.productSlug
                    )}`}
                    className="
                      line-clamp-2
                      text-sm font-bold
                      hover:text-primary/70
                    ">
                    {item.productName}
                  </Link>

                  <p
                    className="
                      mt-1 text-[11px]
                      text-muted-foreground
                    ">
                    {item.variantLabel}
                    {' · '}
                    Qty {item.quantity}
                    {' · '}
                    {formatMoney(
                      item.unitPrice,
                      currency
                    )}{' '}
                    each
                  </p>
                </div>

                <p className="text-sm font-black sm:text-right">
                  {formatMoney(
                    item.totalPrice,
                    currency
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="
            rounded-2xl border
            border-border/50
            bg-background/60 p-3.5
          ">
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.16em]
              text-primary/65
            ">
            Financial record
          </p>

          <div className="mt-3 space-y-2.5">
            <SummaryLine
              label="Subtotal"
              value={formatMoney(
                order.subtotal,
                currency
              )}
            />

            <SummaryLine
              label="Discount"
              value={`-${formatMoney(
                order.discountAmount,
                currency
              )}`}
            />

            <SummaryLine
              label="Delivery"
              value={formatMoney(
                order.deliveryFee,
                currency
              )}
            />

            <SummaryLine
              label="Total"
              value={formatMoney(
                order.total,
                currency
              )}
              strong
            />
          </div>

          <div
            className="
              mt-4 border-t
              border-border/50 pt-3
            ">
            <p className="text-[10px] text-muted-foreground">
              Payment reference
            </p>

            <p
              className="
                mt-1 break-all
                text-[11px] font-semibold
              ">
              {order.paymentReference ??
                'Not recorded'}
            </p>

            <p
              className="
                mt-3 text-[10px]
                text-muted-foreground
              ">
              Paid at
            </p>

            <p className="mt-1 text-[11px] font-semibold">
              {order.paidAt
                ? formatDateTime(
                    order.paidAt
                  )
                : 'Payment not completed'}
            </p>
          </div>

          {order.delivery ? (
            <div
              className="
                mt-4 rounded-xl
                bg-muted/60 p-3
              ">
              <p className="text-[10px] font-bold">
                Delivery
              </p>

              <p
                className="
                  mt-1 text-[11px]
                  text-muted-foreground
                ">
                {formatStatus(
                  order.delivery.method
                )}
                {' · '}
                {formatStatus(
                  order.delivery.status
                )}
              </p>

              <p
                className="
                  mt-2 break-all
                  text-[10px] font-semibold
                ">
                {order.delivery.trackingCode}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function DeliveriesJourneyDetails({
  orders,
  currency,
  workspaceId
}: {
  orders: CommerceOrder[];
  currency: string;
  workspaceId: string;
}) {
  if (orders.length === 0) {
    return (
      <EmptyJourneyState
        title="No active deliveries"
        description="Orders currently being assigned, picked up, transported or delivered will appear here automatically."
      />
    );
  }

  return (
    <section className="space-y-4">
      {orders.map(order => (
        <DeliveryJourneyCard
          key={order.id}
          order={order}
          currency={currency}
          workspaceId={workspaceId}
        />
      ))}
    </section>
  );
}

function DeliveryJourneyCard({
  order,
  currency,
  workspaceId
}: {
  order: CommerceOrder;
  currency: string;
  workspaceId: string;
}) {
  const delivery =
    order.delivery;

  const status =
    delivery?.status ??
    'PENDING';

  const progress =
    resolveDeliveryProgress(
      status
    );

  return (
    <article
      className="
        overflow-hidden
        rounded-[var(--app-card-radius)]
        border border-emerald-500/20
        bg-card/75 shadow-sm
      ">
      <header
        className="
          relative overflow-hidden
          border-b border-border/50
          p-4 sm:p-5
        ">
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-br
            from-emerald-500/12
            via-transparent
            to-transparent
          "
        />

        <div
          className="
            relative flex flex-col
            gap-4 sm:flex-row
            sm:items-start
            sm:justify-between
          ">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                value={status}
              />

              {delivery?.trackingEnabled ? (
                <span
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-full
                    bg-emerald-500/12
                    px-2.5 py-1
                    text-[10px] font-bold
                    text-emerald-700
                    dark:text-emerald-200
                  ">
                  <Activity className="size-3" />
                  Tracking enabled
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 text-lg font-black">
              Delivery for {order.orderNumber}
            </h2>

            <p
              className="
                mt-1 text-xs
                text-muted-foreground
              ">
              {delivery
                ? formatStatus(
                    delivery.method
                  )
                : 'Delivery record is being prepared'}
            </p>
          </div>

          <div className="sm:text-right">
            <p
              className="
                text-[10px] font-bold
                uppercase tracking-[0.16em]
                text-muted-foreground
              ">
              Estimated arrival
            </p>

            <p className="mt-1 text-sm font-black">
              {delivery
                ?.estimatedArrival
                ? formatDateTime(
                    delivery.estimatedArrival
                  )
                : 'Not yet available'}
            </p>
          </div>
        </div>
      </header>

      {delivery ? (
        <div className="border-b border-border/50 p-4 sm:p-5">
          <CompactDeliveryMap
            orderId={order.id}
            workspaceId={workspaceId}
            initialLatitude={delivery.lastLatitude}
            initialLongitude={delivery.lastLongitude}
            initialLastLocationAt={delivery.lastLocationAt}
            initialStatus={delivery.status}
            initialTrackingEnabled={delivery.trackingEnabled}
            variant="journey"
          />
        </div>
      ) : null}

      <div
        className="
          grid gap-4 p-4
          sm:p-5
          xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)]
        ">
        <div>
          <div
            className="
              rounded-2xl border
              border-border/50
              bg-background/60 p-4
            ">
            <div
              className="
                flex items-center
                justify-between gap-3
              ">
              <div>
                <p
                  className="
                    text-[10px] font-bold
                    uppercase tracking-[0.16em]
                    text-primary/65
                  ">
                  Fulfilment progress
                </p>

                <p className="mt-1 text-sm font-black">
                  {progress}% complete
                </p>
              </div>

              <Truck className="size-5 text-emerald-500" />
            </div>

            <div
              className="
                mt-4 h-2 overflow-hidden
                rounded-full bg-muted
              ">
              <div
                className="
                  h-full rounded-full
                  bg-emerald-500
                  transition-all
                "
                style={{
                  width:
                    `${progress}%`
                }}
              />
            </div>

            <div
              className="
                mt-4 grid gap-2
                sm:grid-cols-3
                2xl:grid-cols-6
              ">
              {DELIVERY_STAGES.map(
                stage => {
                  const completed =
                    isDeliveryStageComplete(
                      status,
                      stage
                    );

                  return (
                    <div
                      key={stage}
                      className={cn(
                        `
                          rounded-xl border
                          px-2.5 py-2
                        `,
                        completed
                          ? 'border-emerald-500/20 bg-emerald-500/8'
                          : 'border-border/50 bg-background/50'
                      )}>
                      {completed ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <CircleDot className="size-4 text-muted-foreground" />
                      )}

                      <p
                        className="
                          mt-2 text-[9px]
                          font-bold leading-4
                        ">
                        {formatStatus(
                          stage
                        )}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div
            className="
              mt-4 rounded-2xl
              border border-border/50
              bg-background/60 p-4
            ">
            <p
              className="
                text-[10px] font-bold
                uppercase tracking-[0.16em]
                text-primary/65
              ">
              Items on this delivery
            </p>

            <div className="mt-3 space-y-2">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="
                    flex items-center gap-3
                    rounded-xl bg-muted/50
                    p-2.5
                  ">
                  <div
                    className="
                      relative size-11
                      shrink-0 overflow-hidden
                      rounded-lg bg-background
                    ">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate text-xs
                        font-bold
                      ">
                      {item.productName}
                    </p>

                    <p
                      className="
                        mt-1 truncate
                        text-[10px]
                        text-muted-foreground
                      ">
                      {item.variantLabel}
                      {' · '}
                      Qty {item.quantity}
                    </p>
                  </div>

                  <span
                    className="
                      shrink-0 text-[11px]
                      font-bold
                    ">
                    {formatMoney(
                      item.totalPrice,
                      currency
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside
          className="
            rounded-2xl border
            border-border/50
            bg-background/60 p-4
          ">
          <p
            className="
              text-[10px] font-bold
              uppercase tracking-[0.16em]
              text-primary/65
            ">
            Tracking record
          </p>

          <div className="mt-3 space-y-3">
            <SummaryLine
              label="Tracking code"
              value={
                delivery?.trackingCode ??
                'Pending'
              }
              strong
            />

            <SummaryLine
              label="Picked up"
              value={
                delivery?.pickedUpAt
                  ? formatDateTime(
                      delivery.pickedUpAt
                    )
                  : 'Not yet'
              }
            />

            <SummaryLine
              label="Order value"
              value={formatMoney(
                order.total,
                currency
              )}
            />
          </div>

          <div
            className="
              mt-4 border-t
              border-border/50 pt-4
            ">
            <p
              className="
                text-[10px] font-bold
                uppercase tracking-[0.16em]
                text-primary/65
              ">
              Latest movement
            </p>

            {delivery?.events.length ? (
              <div className="mt-3 space-y-3">
                {delivery.events.map(
                  (
                    event,
                    index
                  ) => (
                    <div
                      key={`${event.status}:${event.createdAt}:${index}`}
                      className="flex gap-3">
                      <span
                        className="
                          mt-1 size-2
                          shrink-0 rounded-full
                          bg-emerald-500
                        "
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-bold">
                          {formatStatus(
                            event.status
                          )}
                        </p>

                        <p
                          className="
                            mt-0.5 text-[10px]
                            text-muted-foreground
                          ">
                          {formatDateTime(
                            event.createdAt
                          )}
                        </p>

                        {event.note ? (
                          <p
                            className="
                              mt-1 text-[11px]
                              leading-5
                              text-muted-foreground
                            ">
                            {event.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p
                className="
                  mt-3 text-xs
                  leading-5
                  text-muted-foreground
                ">
                Movement events will appear as
                fulfilment progresses.
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function SummaryLine({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className="
        flex items-start
        justify-between gap-3
      ">
      <span
        className="
          text-[11px]
          text-muted-foreground
        ">
        {label}
      </span>

      <span
        className={cn(
          `
            max-w-[60%]
            break-words text-right
            text-[11px] font-semibold
          `,
          strong &&
            'text-sm font-black text-foreground'
        )}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({
  value,
  payment = false
}: {
  value: string;
  payment?: boolean;
}) {
  const normalized =
    value.toUpperCase();

  const className =
    payment
      ? normalized === 'PAID'
        ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
        : normalized === 'FAILED'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-amber-500/12 text-amber-700 dark:text-amber-200'
      : normalized === 'DELIVERED'
        ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
        : normalized === 'CANCELLED' ||
            normalized === 'REFUNDED' ||
            normalized === 'FAILED'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-primary/10 text-primary';

  return (
    <span
      className={cn(
        `
          rounded-full px-2.5 py-1
          text-[10px] font-bold
        `,
        className
      )}>
      {formatStatus(value)}
    </span>
  );
}

function EmptyJourneyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section
      className="
        grid min-h-80
        place-items-center
        rounded-[var(--app-card-radius)]
        border border-dashed
        border-border/70
        bg-card/60 p-6
        text-center
      ">
      <div className="max-w-md">
        <span
          className="
            mx-auto grid size-12
            place-items-center
            rounded-2xl
            bg-primary/10
            text-primary
          ">
          <PackageOpen className="size-5" />
        </span>

        <h2 className="mt-4 text-lg font-black">
          {title}
        </h2>

        <p
          className="
            mt-2 text-sm
            leading-6
            text-muted-foreground
          ">
          {description}
        </p>

        <Link
          href="/store"
          className="
            mt-5 inline-flex h-10
            items-center justify-center
            gap-2 rounded-xl
            bg-foreground px-4
            text-xs font-bold
            text-background
            transition hover:opacity-90
          ">
          Explore the Store
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function historyDestination(
  entry: CommerceHistoryEntry
): string {
  if (entry.productId) {
    return `/products/${encodeURIComponent(
      entry.productId
    )}`;
  }

  if (entry.collectionId) {
    return `/store?collection=${encodeURIComponent(
      entry.collectionId
    )}`;
  }

  if (entry.campaignId) {
    return `/store?promotion=${encodeURIComponent(
      entry.campaignId
    )}`;
  }

  if (
    entry.categorySlug &&
    entry.categorySlug !== 'all'
  ) {
    return `/store?category=${encodeURIComponent(
      entry.categorySlug
    )}`;
  }

  return '/store';
}

function resolveDeliveryProgress(
  status: string
): number {
  const normalized =
    status.toUpperCase();

  const stageIndex =
    DELIVERY_STAGES.findIndex(
      stage =>
        stage === normalized
    );

  if (stageIndex < 0) {
    return 8;
  }

  return Math.round(
    ((stageIndex + 1) /
      DELIVERY_STAGES.length) *
      100
  );
}

function isDeliveryStageComplete(
  currentStatus: string,
  stage: (typeof DELIVERY_STAGES)[number]
): boolean {
  const currentIndex =
    DELIVERY_STAGES.findIndex(
      item =>
        item ===
        currentStatus.toUpperCase()
    );

  const stageIndex =
    DELIVERY_STAGES.indexOf(
      stage
    );

  return (
    currentIndex >= 0 &&
    stageIndex <= currentIndex
  );
}

function formatMoney(
  value: number,
  currency: string
): string {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }
  ).format(value);
}

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown';
  }

  return date.toLocaleDateString(
    'en-NG',
    {
      day: 'numeric',
      month: 'short'
    }
  );
}

function formatDateTime(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown';
  }

  return date.toLocaleString(
    'en-NG',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  );
}

function formatStatus(
  value: string
): string {
  return value
    .replaceAll(
      '_',
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}
