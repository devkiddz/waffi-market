'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { VendorDirectoryItem } from '@/features/vendor-storefront/contracts';

type Banner = NonNullable<VendorDirectoryItem['banners']>[number];

export default function VendorBannerCarousel({ banners, vendorName }: { banners: Banner[]; vendorName: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % banners.length),
      Math.max(3, banners[active]?.durationSeconds ?? 6) * 1000);
    return () => window.clearTimeout(timer);
  }, [active, banners, paused]);

  if (!banners.length) return null;

  const move = (direction: number) => setActive(current => (current + direction + banners.length) % banners.length);

  return (
    <div aria-label={`${vendorName} banners`} className="group relative mt-3 h-36 overflow-hidden rounded-xl border border-border bg-muted sm:h-44"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      {banners.map((banner, index) => (
        <div key={banner.id} aria-hidden={index !== active} className={`absolute inset-0 transition-opacity duration-500 ${index === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <Image src={banner.mediaUrl} alt="" fill sizes="(max-width: 768px) 100vw, 75vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/15" />
          <div className="relative flex h-full max-w-lg flex-col justify-center px-5 pr-12 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{vendorName}</p>
            <h3 className="mt-1 font-heading text-base font-semibold text-foreground sm:text-xl">{banner.title}</h3>
            {banner.description ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{banner.description}</p> : null}
            <Link tabIndex={index === active ? 0 : -1} href={banner.actionHref} className="mt-2 w-fit text-xs font-semibold text-primary hover:underline">Explore shop →</Link>
          </div>
        </div>
      ))}
      {banners.length > 1 ? (
        <>
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${vendorName} banner`}
            className="absolute left-1 top-1/2 z-10 hidden size-7 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-card-foreground opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100 sm:grid"><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${vendorName} banner`}
            className="absolute right-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-card-foreground shadow-sm sm:opacity-0 sm:transition sm:group-hover:opacity-100 focus-visible:opacity-100"><ChevronRight className="size-4" /></button>
          <div className="absolute bottom-2 right-3 z-10 flex gap-1.5" aria-label="Choose banner">
            {banners.map((banner, index) => (
              <button key={banner.id} type="button" aria-label={`Show banner ${index + 1}`} aria-current={index === active ? 'true' : undefined}
                onClick={() => setActive(index)} className={`h-1.5 rounded-full bg-primary transition-all ${index === active ? 'w-5' : 'w-1.5 opacity-40'}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
