import { Aperture, Sparkles } from 'lucide-react';

import type { ReactNode } from 'react';

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthCard({ eyebrow, title, description, children }: AuthCardProps) {
  return (
    <section className="glass-surface-strong premium-card relative w-full max-w-md overflow-hidden rounded-3xl border border-border/70 p-6 shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full bg-rose-950/15 blur-3xl" />

      <div className="relative">
        <div className="mb-7 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Aperture className="size-4" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-foreground">Shelsea</p>

              <p className="text-xs text-muted-foreground">Personal commerce experience</p>
            </div>
          </div>

          <Sparkles className="size-4 text-primary" />
        </div>

        <header className="mb-7">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{title}</h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </header>

        {children}
      </div>
    </section>
  );
}
