'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';

import { CommerceStoryViewer } from '@/features/commerce-stories/components/CommerceStoryViewer';
import { getViewedStoryIds, markStoryAsViewed } from '@/features/commerce-stories/services';
import type { CommerceStory } from '@/features/commerce-stories/contracts';
import type { FeedActions } from '@/features/feed-experience/contracts';
import type { VendorDirectoryItem } from '@/features/vendor-storefront/contracts';
import { publishMediaExperienceState } from '@/lib/mediaExperienceEvents';

type StoryShop = {
  vendorId: string;
  stories: CommerceStory[];
  targets: Record<string, string>;
};

const VIEWER_OWNER = 'waffi-home-vendor-stories';

export default function FeaturedVendorRail({ vendors, storyShops }: {
  vendors: VendorDirectoryItem[];
  storyShops: StoryShop[];
}) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoLeft, setCanGoLeft] = useState(false);
  const [canGoRight, setCanGoRight] = useState(false);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const activeShop = storyShops.find(shop => shop.vendorId === activeVendorId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setViewedIds(getViewedStoryIds()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const closeStory = useCallback(() => {
    setActiveStoryId(null);
    setActiveVendorId(null);
    publishMediaExperienceState({ ownerId: VIEWER_OWNER, kind: 'commerce-story', open: false });
  }, []);

  useEffect(() => {
    const closeCompetingViewer = (event: Event) => {
      const detail = (event as CustomEvent<{ ownerId: string }>).detail;
      if (detail?.ownerId !== VIEWER_OWNER) closeStory();
    };
    window.addEventListener('rcentz:commerce-story-viewer-open', closeCompetingViewer);
    return () => window.removeEventListener('rcentz:commerce-story-viewer-open', closeCompetingViewer);
  }, [closeStory]);

  useEffect(() => () => {
    publishMediaExperienceState({ ownerId: VIEWER_OWNER, kind: 'commerce-story', open: false });
  }, []);

  const openStory = (shop: StoryShop) => {
    const firstUnviewed = shop.stories.find(story => !viewedIds.includes(story.id));
    setActiveVendorId(shop.vendorId);
    setActiveStoryId((firstUnviewed ?? shop.stories[0]).id);
    publishMediaExperienceState({ ownerId: VIEWER_OWNER, kind: 'commerce-story', open: true });
    window.dispatchEvent(new CustomEvent('rcentz:commerce-story-viewer-open', {
      detail: { ownerId: VIEWER_OWNER }
    }));
  };

  const handleViewed = useCallback((storyId: string) => {
    markStoryAsViewed(storyId);
    setViewedIds(ids => ids.includes(storyId) ? ids : [...ids, storyId]);
  }, []);

  const actions: FeedActions = {
    openExperience: target => {
      const key = target.type === 'product' ? `product:${target.productId}`
        : target.type === 'collection' ? `collection:${target.collectionId}`
        : target.type === 'promotion' ? `promotion:${target.promotionId}` : null;
      const href = key ? activeShop?.targets[key] : null;
      if (href) router.push(href);
    },
    restoreExperience: () => undefined,
    resetExperience: () => router.push('/store'),
    changeCategory: () => undefined,
    previewProduct: product => router.push(`/products/${encodeURIComponent(product.slug)}`),
    toggleLike: () => undefined,
    addToCart: async () => undefined,
    previewPromotion: id => {
      const href = activeShop?.targets[`promotion:${id}`];
      if (href) router.push(href);
    }
  };

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanGoLeft(rail.scrollLeft > 2);
    setCanGoRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    if (rail.firstElementChild) observer.observe(rail.firstElementChild);
    rail.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      rail.removeEventListener('scroll', measure);
    };
  }, [measure, vendors.length]);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.75, 240),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };

  return (
    <section aria-label="Featured shops" className="relative border-b border-border bg-card text-card-foreground">
      {vendors.length ? (
        <div className="relative mx-auto max-w-7xl">
          <div ref={railRef} role="region" aria-label="Featured shops, scroll horizontally for more"
            tabIndex={0} className="scrollbar-none snap-x snap-proximity overflow-x-auto py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:py-5">
            <div className="flex w-max min-w-full items-start justify-center gap-5 px-4 sm:gap-7 sm:px-8 lg:gap-8">
              {vendors.map(vendor => {
                const storyShop = storyShops.find(shop => shop.vendorId === vendor.id);
                const unviewed = storyShop?.stories.some(story => !viewedIds.includes(story.id));
                const content = <>
                  <span className="grid size-[4.75rem] place-items-center rounded-full p-[3px] sm:size-[5.5rem]"
                    style={{ background: unviewed
                      ? 'linear-gradient(35deg, var(--story-ring-start), var(--story-ring-middle), var(--story-ring-end))'
                      : 'var(--story-ring-viewed)' }}>
                    <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-card bg-muted text-muted-foreground">
                      {vendor.logoUrl ? (
                        <Image src={vendor.logoUrl} alt="" fill sizes="(max-width: 640px) 76px, 88px" className="object-cover transition-transform group-hover:scale-105" />
                      ) : <Store aria-hidden="true" className="size-7" />}
                    </span>
                  </span>
                  <span className="w-full truncate text-xs font-medium group-hover:underline">{vendor.name}</span>
                </>;
                const className = 'group flex w-20 shrink-0 snap-start flex-col items-center gap-2 rounded-md text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24';
                return storyShop ? (
                  <button key={vendor.id} type="button" onClick={() => openStory(storyShop)}
                    aria-label={`Watch stories from ${vendor.name}`} title={vendor.name} className={className}>
                    {content}
                  </button>
                ) : (
                  <Link key={vendor.id} href={`/shops/${encodeURIComponent(vendor.slug)}`}
                    aria-label={`Visit ${vendor.name}`} title={vendor.name} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
          {canGoLeft ? (
            <button type="button" onClick={() => move(-1)} aria-label="Scroll featured shops left"
              className="absolute left-2 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-md hover:bg-muted sm:grid">
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          {canGoRight ? (
            <button type="button" onClick={() => move(1)} aria-label="Scroll featured shops right"
              className="absolute right-2 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-md hover:bg-muted sm:grid">
              <ChevronRight className="size-5" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-8">
          Featured shops will appear here when approved merchants publish their products.
        </div>
      )}
      {activeShop && activeStoryId ? (
        <CommerceStoryViewer stories={activeShop.stories} activeStoryId={activeStoryId}
          actions={actions} onActiveStoryChange={setActiveStoryId}
          onViewed={handleViewed} onClose={closeStory} />
      ) : null}
    </section>
  );
}
