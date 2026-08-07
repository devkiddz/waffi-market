import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type CollectionProductsHeaderProps = {
  title: string;
  subtitle?: string;
  productCount: number;
  href?: string;
  actionLabel?: string;
  className?: string;
};

export default function CollectionProductsHeader({
  title,
  subtitle,
  productCount,
  href,
  actionLabel = 'View all',
  className
}: CollectionProductsHeaderProps) {
  return (
    <header
      className={cn(
        'flex min-w-0 items-start justify-between gap-4 px-1',
        className
      )}>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>

          <span className="shrink-0 text-[0.68rem] font-semibold text-muted-foreground sm:text-xs">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
        </div>

        {subtitle ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/75 px-3 text-[0.68rem] font-bold text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:px-4 sm:text-xs">
          <span>{actionLabel}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </header>
  );
}
