import Link from 'next/link';

import {
  ArrowRight,
  CircleDashed,
  Gift,
  ShieldCheck
} from 'lucide-react';

export default function RewardsPage() {
  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-200">
              <Gift className="size-5" />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                Membership foundation
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Rewards without imaginary balances.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Shelsea currently stores customer membership identity, but a verified points ledger and coupon wallet are not yet active.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CircleDashed className="size-4" />
              </span>

              <h2 className="text-lg font-black">
                Points ledger
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              No points total, expiry count or progress tier is shown until every earning and redemption event has a database-backed source.
            </p>
          </article>

          <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>

              <h2 className="text-lg font-black">
                Verified benefits only
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Active Store promotions remain available through the promotion engine. Customer-specific coupons will appear here only after the Coupon Engine exists.
            </p>
          </article>
        </section>

        <Link
          href="/store?category=deals"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
          Explore live promotions

          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
