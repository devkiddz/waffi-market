'use client';

import {
  Boxes,
  Search,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

import type {
  FeedIntentType
} from '../contracts';

type FeedExperienceLoaderProps = {
  intentType?: FeedIntentType;
};

const loadingCopy: Partial<
  Record<
    FeedIntentType,
    {
      eyebrow: string;
      title: string;
      description: string;
    }
  >
> = {
  product: {
    eyebrow: 'Product experience',
    title: 'Preparing product details',
    description:
      'Connecting the product, related discoveries and active commerce controls.'
  },

  category: {
    eyebrow: 'Category experience',
    title: 'Reassembling your feed',
    description:
      'Selecting the most relevant products, collections and promotions.'
  },

  collection: {
    eyebrow: 'Collection experience',
    title: 'Opening the collection',
    description:
      'Preparing the collection story and its connected products.'
  },

  promotion: {
    eyebrow: 'Campaign experience',
    title: 'Preparing the offer',
    description:
      'Resolving campaign details, eligibility and connected products.'
  },

  search: {
    eyebrow: 'Search experience',
    title: 'Resolving your search',
    description:
      'Finding the strongest matches and organizing the next experience.'
  },

  'store-discovery': {
    eyebrow: 'Discovery experience',
    title: 'Refreshing your feed',
    description:
      'Reordering the Store around your current purpose.'
  }
};

export default function FeedExperienceLoader({
  intentType
}: FeedExperienceLoaderProps) {
  const copy =
    (intentType
      ? loadingCopy[intentType]
      : undefined) ?? {
      eyebrow: 'Shelsea experience',
      title: 'Preparing your next view',
      description:
        'Connecting the Feed and Discovery Hub to the same active experience.'
    };

  const Icon =
    intentType === 'product'
      ? ShoppingBag
      : intentType === 'search'
        ? Search
        : intentType === 'category' ||
            intentType ===
              'store-discovery'
          ? Boxes
          : Sparkles;

  return (
    <section
      className="
        relative min-h-80
        overflow-hidden rounded-3xl
        border border-primary/10
        bg-card/45 p-5
        md:p-8
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex min-h-64 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center rounded-2xl border border-primary/15 bg-background/80 shadow-sm">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/10" />

            <Icon className="relative size-5 text-primary" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/55">
              {copy.eyebrow}
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              Shelsea
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            {copy.title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>

          <div className="mt-6 space-y-3">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-primary/10" />

            <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-primary/10" />

            <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-primary/10" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />

          Feed and Discovery are synchronizing
        </div>
      </div>
    </section>
  );
}
