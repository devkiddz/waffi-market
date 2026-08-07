import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Clapperboard,
  Layers3,
  Store,
  UsersRound,
  type LucideIcon
} from 'lucide-react';

import type { VendorDirectoryItem } from '../contracts';

type VendorDirectoryExperienceProps = {
  workspaceName: string;
  vendors: VendorDirectoryItem[];
};

export default function VendorDirectoryExperience({
  workspaceName,
  vendors
}: VendorDirectoryExperienceProps) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-8 lg:px-7">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 p-6 shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
            <UsersRound className="size-3.5" />
            Verified merchant directory
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Shops on {workspaceName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Discover approved merchants through the same Shelsea Store,
            product experience and customer action system.
          </p>
        </div>
      </header>

      {vendors.length > 0 ? (
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map(vendor => (
            <article
              key={vendor.id}
              className="group rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-primary/25">
              <div className="flex items-start gap-4">
                {vendor.logoUrl ? (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted">
                    <Image
                      src={vendor.logoUrl}
                      alt={`${vendor.name} logo`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-border/60 bg-muted">
                    <Store className="size-6 text-muted-foreground" />
                  </span>
                )}

                <div className="min-w-0">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary">
                    Approved shop
                  </p>
                  <h2 className="mt-1 truncate text-xl font-black tracking-tight">
                    {vendor.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {vendor.description ??
                      'A verified merchant operating inside the Shelsea commerce experience.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-1 rounded-2xl bg-muted/35 p-3 text-center">
                <Metric icon={Boxes} value={vendor.productCount} label="Products" />
                <Metric icon={Layers3} value={vendor.collectionCount} label="Collections" />
                <Metric icon={BadgePercent} value={vendor.promotionCount} label="Offers" />
                <Metric icon={Clapperboard} value={vendor.storyCount} label="Stories" />
                <Metric icon={Clapperboard} value={vendor.reelCount} label="Reels" />
              </div>

              <Link
                href={`/shops/${encodeURIComponent(vendor.slug)}`}
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition group-hover:bg-primary group-hover:text-primary-foreground">
                Visit shop
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-7 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/50 p-8 text-center">
          <div>
            <Store className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">No public shops yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Approved vendor storefronts will appear here automatically.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({
  icon: Icon,
  value,
  label
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <Icon className="mx-auto size-3.5 text-primary" />
      <strong className="mt-1 block text-xs">{value}</strong>
      <span className="block truncate text-[0.48rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
