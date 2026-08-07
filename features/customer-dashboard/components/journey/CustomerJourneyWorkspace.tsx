'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Heart,
  History,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Truck
} from 'lucide-react';

import { openCustomerProductExperience } from '@/features/customer-experience';

import type {
  CommerceCartItem,
  CommerceHistoryEntry,
  CommerceOrder,
  CommerceProduct
} from '../../contracts/customerDashboardTypes';
import type { CustomerDashboardView } from '../../view/resolveCustomerDashboardView';

export const CUSTOMER_JOURNEY_SECTIONS = [
  'recent-views',
  'wishlist',
  'cart',
  'activity',
  'orders',
  'deliveries'
] as const;

export type CustomerJourneySection = (typeof CUSTOMER_JOURNEY_SECTIONS)[number];

type CustomerJourneyWorkspaceProps = {
  section: CustomerJourneySection;
  view: CustomerDashboardView;
};

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

const copy: Record<
  CustomerJourneySection,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: typeof Clock3;
  }
> = {
  'recent-views': {
    eyebrow: 'Experience journey',
    title: 'Recently viewed products',
    description: 'Return to products you explored and continue from the exact point where your interest began.',
    icon: Clock3
  },
  wishlist: {
    eyebrow: 'Saved interests',
    title: 'Your wishlist journey',
    description: 'Review products you saved, compare the moments they fit and move the right ones into your next plan.',
    icon: Heart
  },
  cart: {
    eyebrow: 'Active commerce',
    title: 'Your preserved cart',
    description: 'Every current cart selection is listed here with its quantity and value before checkout.',
    icon: ShoppingBag
  },
  activity: {
    eyebrow: 'Experience archive',
    title: 'Your activity journey',
    description: 'Revisit meaningful categories, products, searches and assembled experiences saved by Shelsea.',
    icon: History
  },
  orders: {
    eyebrow: 'Completed commerce',
    title: 'Your order history',
    description: 'Review previous order values, status and product lines from one dedicated destination.',
    icon: ReceiptText
  },
  deliveries: {
    eyebrow: 'Order movement',
    title: 'Active deliveries',
    description: 'Follow orders that are currently being prepared, dispatched or delivered.',
    icon: Truck
  }
};

export function CustomerJourneyWorkspace({ section, view }: CustomerJourneyWorkspaceProps) {
  const sectionCopy = copy[section];
  const Icon = sectionCopy.icon;

  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <header className="relative mt-5 overflow-hidden rounded-[2rem] border bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="grid size-11 place-items-center rounded-2xl border bg-background shadow-sm">
            <Icon className="size-5" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {sectionCopy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {sectionCopy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {sectionCopy.description}
          </p>
        </div>
      </header>

      <section className="mt-7">
        {section === 'recent-views' ? (
          <ProductGrid products={view.recentProducts} emptyLabel="No recently viewed products yet." />
        ) : null}

        {section === 'wishlist' ? (
          <ProductGrid products={view.wishlistProducts} emptyLabel="Your wishlist is currently empty." />
        ) : null}

        {section === 'cart' ? (
          <CartDestination items={view.cartItems} subtotal={view.cartSubtotal} />
        ) : null}

        {section === 'activity' ? <ActivityDestination history={view.history} /> : null}

        {section === 'orders' ? (
          <OrdersDestination orders={view.orders} emptyLabel="No orders have been recorded yet." />
        ) : null}

        {section === 'deliveries' ? (
          <OrdersDestination orders={view.activeDeliveries} emptyLabel="No active deliveries right now." delivery />
        ) : null}
      </section>
    </main>
  );
}

function ProductGrid({ products, emptyLabel }: { products: CommerceProduct[]; emptyLabel: string }) {
  const uniqueProducts = Array.from(new Map(products.map(product => [product.id, product])).values());

  if (uniqueProducts.length === 0) {
    return <EmptyState icon={ShoppingBag} title={emptyLabel} href="/store" action="Explore the Store" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {uniqueProducts.map(product => (
        <button
          type="button"
          key={product.id}
          onClick={() => openCustomerProductExperience({ id: product.id, name: product.name })}
          className="group overflow-hidden rounded-3xl text-left border bg-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="grid size-full place-items-center">
                <ShoppingBag className="size-7 text-muted-foreground" />
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 font-semibold">{product.name}</h2>
                <p className="mt-1 text-sm font-bold">{money.format(product.price)}</p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {product.available ? `${product.stockLeft} currently available` : 'Currently unavailable'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function CartDestination({ items, subtotal }: { items: CommerceCartItem[]; subtotal: number }) {
  if (items.length === 0) {
    return <EmptyState icon={ShoppingBag} title="Your cart is empty." href="/store" action="Start shopping" />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border bg-card">
        {items.map(item => (
          <div
            key={item.id}
            className="grid gap-4 border-b p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
            <button type="button" onClick={() => openCustomerProductExperience({ id: item.product.id, name: item.product.name })} className="flex min-w-0 items-center gap-4 text-left">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl border bg-muted">
                {item.product.image ? (
                  <Image src={item.product.image} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="grid size-full place-items-center">
                    <ShoppingBag className="size-5 text-muted-foreground" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{item.product.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {item.variantLabel} · Quantity {item.quantity}
                </span>
              </span>
            </button>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="font-semibold">{money.format(item.lineTotal)}</span>
              <Link href="/cart" className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold hover:bg-muted">
                Open cart
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current subtotal</p>
          <p className="mt-1 text-2xl font-bold">{money.format(subtotal)}</p>
        </div>
        <Link href="/cart" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">
          Continue with cart <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function ActivityDestination({ history }: { history: CommerceHistoryEntry[] }) {
  if (history.length === 0) {
    return <EmptyState icon={History} title="No experience activity has been preserved yet." href="/store" action="Explore Shelsea" />;
  }

  return (
    <div className="space-y-3">
      {history.map(entry => {
        const className = "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition hover:border-primary/25 hover:bg-muted/30 sm:p-5";

        const content = (
          <>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <History className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{entry.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {entry.subtitle ?? entry.categorySlug.replaceAll('-', ' ')}
              </span>
            </span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
              {new Date(entry.visitedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </>
        );

        return entry.productId ? (
          <button
            type="button"
            key={entry.id}
            onClick={() => openCustomerProductExperience({ id: entry.productId ?? '', name: entry.label })}
            className={className}>
            {content}
          </button>
        ) : (
          <Link
            key={entry.id}
            href={`/store?category=${encodeURIComponent(entry.categorySlug)}`}
            className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function OrdersDestination({
  orders,
  emptyLabel,
  delivery = false
}: {
  orders: CommerceOrder[];
  emptyLabel: string;
  delivery?: boolean;
}) {
  if (orders.length === 0) {
    return <EmptyState icon={delivery ? Truck : ReceiptText} title={emptyLabel} href="/store" action="Explore the Store" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orders.map(order => {
        const status = delivery ? order.delivery?.status ?? order.status : order.status;
        return (
          <Link
            key={order.id}
            href={`/orders?order=${encodeURIComponent(order.id)}`}
            className="rounded-3xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                {delivery ? <Truck className="size-4" /> : <PackageCheck className="size-4" />}
              </span>
              <span className="rounded-full border px-2.5 py-1 text-xs font-bold">
                {status.replaceAll('_', ' ')}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? 'product line' : 'product lines'} · {new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
            </p>
            <div className="mt-5 flex items-end justify-between gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Order value</p>
                <p className="mt-1 font-bold">{money.format(order.total)}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                View details <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  href,
  action
}: {
  icon: typeof ShoppingBag;
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed bg-muted/10 p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-background shadow-sm">
          <Icon className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <Link href={href} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background">
          {action} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
