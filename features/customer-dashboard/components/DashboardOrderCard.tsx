import Image from 'next/image';
import Link from 'next/link';

import {
  ChevronRight,
  Clock3,
  PackageCheck
} from 'lucide-react';

import type {
  CommerceOrder
} from '../contracts/customerDashboardTypes';

const currencyFormatter =
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  });

function formatDate(
  value: string
): string {
  return new Date(
    value
  ).toLocaleDateString(
    'en-NG',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  );
}

function formatStatus(
  value: string
): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}

type DashboardOrderCardProps = {
  order: CommerceOrder;
};

export function DashboardOrderCard({
  order
}: DashboardOrderCardProps) {
  const firstItem =
    order.items[0];

  return (
    <Link
      href={`/orders?order=${order.id}`}
      className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-border/60 bg-background/70 p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {firstItem?.image ? (
          <Image
            src={firstItem.image}
            alt={firstItem.productName}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <PackageCheck className="size-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-primary">
            {order.orderNumber}
          </p>

          <span className="rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold">
            {formatStatus(
              order.status
            )}
          </span>
        </div>

        <p className="mt-1.5 truncate text-sm font-semibold">
          {firstItem?.productName ??
            'Shelsea order'}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {formatDate(
              order.createdAt
            )}
          </span>

          <span>
            {order.items.length}{' '}
            product
            {order.items.length === 1
              ? ''
              : 's'}
          </span>

          <span className="font-semibold text-foreground">
            {currencyFormatter.format(
              order.total
            )}
          </span>
        </div>
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}
