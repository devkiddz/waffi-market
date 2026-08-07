import Link from 'next/link';
import { Aperture, AtSign, Clock3, MapPin, ShieldCheck } from 'lucide-react';

import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { MarketplaceLink } from '@/features/commerce-mode/components/MarketplaceLink';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/store', label: 'Store discovery' },
  { href: '/store?view=grid', label: 'All products' },
  { href: '/promos', label: 'Promotions' }
];

const accountLinks = [
  { href: '/account', label: 'Customer dashboard' },
  { href: '/account/lists', label: 'Shopping lists' },
  { href: '/orders', label: 'Orders' },
  { href: '/wishlist', label: 'Wishlist' }
];

export default function FooterComponent({
  brandName,
  brandSlug
}: {
  brandName: string;
  brandSlug: string;
}) {
  return (
    <footer className="mt-auto w-full border-t border-border/60 bg-card/65 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[112rem] px-[var(--app-page-gutter)] py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <section>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Shelsea home">
              <span className="relative grid size-9 place-items-center rounded-2xl bg-foreground text-background">
                <Aperture className="size-4 motion-safe:animate-pulse" />
              </span>
              <span className="flex items-baseline gap-1">
                <strong className="text-lg text-secondary">{brandName}</strong>
                <span className="text-sm font-medium tracking-tight">{brandSlug}</span>
              </span>
            </Link>

            <h2 className="mt-5 max-w-sm text-xl font-black tracking-tight">
              A pinch of excellence in every choice.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              A curated destination for clothing, accessories, hair, fragrances and everyday style.
            </p>

            <div className="mt-5">
              <PWAInstallButton />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black">Discover</h3>
            <nav className="mt-4 flex flex-col items-start gap-3" aria-label="Discover">
              {quickLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition hover:text-foreground">
                  {link.label}
                </Link>
              ))}
              <MarketplaceLink className="text-sm text-muted-foreground transition hover:text-foreground">
                Verified shops
              </MarketplaceLink>
            </nav>
          </section>
          <FooterLinks title="Your account" links={accountLinks} />

          <section>
            <h3 className="text-sm font-black">Experience assurance</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                Serving customers from Nigeria through the Shelsea digital store.
              </p>
              <p className="flex items-start gap-2">
                <Clock3 className="mt-1 size-4 shrink-0 text-primary" />
                Shopping plans, orders and discovery experiences remain available whenever you return.
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
                Private account and operational pages are excluded from offline page caching.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <AtSign className="size-3.5" />
            {new Date().getFullYear()} {brandName} {brandSlug}. All rights reserved.
          </p>
          <p>Powered by the RCENTZ experience architecture.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section>
      <h3 className="text-sm font-black">{title}</h3>
      <nav className="mt-4 flex flex-col items-start gap-3" aria-label={title}>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground transition hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
