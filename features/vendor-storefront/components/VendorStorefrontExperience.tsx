'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Store } from 'lucide-react';

import FeedExperienceWorkspace from '@/features/feed-experience/layout/FeedExperienceWorkspace';
import { useFollowingShops } from '../client/useFollowingShops';
import type { VendorStorefront } from '../contracts';

/** One Store experience per vendor. Identity actions sit in a compact toolbar. */
export default function VendorStorefrontExperience({ storefront }: { storefront: VendorStorefront }) {
  const { following, toggle } = useFollowingShops();
  const isFollowing = following.includes(storefront.slug);

  return (
    <main className="min-w-0 text-foreground">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-[var(--app-page-gutter)] py-2">
        <Link href="/vendors" aria-label="All vendors" className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
          {storefront.logoUrl ? <Image src={storefront.logoUrl} alt="" fill sizes="36px" className="object-cover" /> : <Store className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-sm font-semibold">{storefront.name}</h1>
          {storefront.description ? <p className="truncate text-xs text-muted-foreground">{storefront.description}</p> : null}
        </div>
        <button type="button" aria-pressed={isFollowing} onClick={() => toggle(storefront.slug)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          {isFollowing ? 'Following' : 'Follow'}
        </button>
        {storefront.email ? <a href={`mailto:${storefront.email}`} aria-label={`Email ${storefront.name}`} className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted"><Mail className="size-4" /></a> : null}
        {storefront.phone ? <a href={`tel:${storefront.phone}`} aria-label={`Call ${storefront.name}`} className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted"><Phone className="size-4" /></a> : null}
      </div>
      <FeedExperienceWorkspace vendorStorefront={storefront} />
    </main>
  );
}
