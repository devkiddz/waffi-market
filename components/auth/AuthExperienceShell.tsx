'use client';

import { BadgeCheck, ListChecks, ShoppingBag, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

const experiencePoints = [
  {
    icon: ShoppingBag,
    title: 'Continue naturally',
    description: 'Return to your cart, saved products, orders and recent discoveries.'
  },
  {
    icon: ListChecks,
    title: 'Shop with intention',
    description: 'Your activity is becoming a personalized commerce experience.'
  },
  {
    icon: BadgeCheck,
    title: 'Protected access',
    description: 'Your account, payments and shopping history remain securely connected.'
  }
];

/**
 * Authentication remains a customer-facing experience surface.
 *
 * The adaptive Discovery Hub is owned by ApplicationShell through
 * CustomerExperienceShell. This component must never mount another
 * Store/Discovery sidebar of its own.
 */
export default function AuthExperienceShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden px-3 py-4 sm:px-4">
      <main className="relative h-full min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 right-0 size-80 rounded-full bg-rose-950/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/4 size-56 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative grid h-full lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.72fr)]">
          <section className="relative hidden overflow-hidden border-r border-border/50 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-3.5" />
                Shelsea Experience
              </div>

              <div className="mt-10 max-w-xl">
                <p className="text-sm font-medium text-muted-foreground">Welcome into something deeper</p>

                <h2 className="mt-3 text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
                  Shopping that remembers where you were going.
                </h2>

                <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                  Sign in to continue your purchases, interests, reviews and personal Shelsea experience
                  without starting again.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {experiencePoints.map(point => {
                const Icon = point.icon;

                return (
                  <article key={point.title} className="glass-surface rounded-2xl border border-border/50 p-4">
                    <div className="flex gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{point.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Shelsea · Powered by the RCENTZ Experience Framework
            </p>
          </section>

          <section className="h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
