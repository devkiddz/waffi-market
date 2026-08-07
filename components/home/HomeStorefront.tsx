'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Truck
} from 'lucide-react';

import { useCatalog } from '@/features/catalog';

import HeroBackgroundMedia from './HeroBackgroundMedia';

type StorefrontHeroConfig = {
  mediaType: string;
  mediaUrl: string | null;
  posterUrl: string | null;

  eyebrow: string;
  title: string;
  summary: string | null;

  primaryLabel: string;
  primaryHref: string;

  secondaryLabel: string;
  secondaryHref: string;

  autoplay: boolean;
} | null;

type HomeStorefrontProps = {
  hero: StorefrontHeroConfig;
};

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?q=85&w=2400&auto=format&fit=crop';

const whyShopItems = [
  {
    icon: BadgeCheck,
    title: 'Premium selections',
    description: 'Every collection is carefully selected around quality, value and memorable experiences.'
  },
  {
    icon: Truck,
    title: 'Thoughtful delivery',
    description: 'Your products are prepared and delivered with the care your moments deserve.'
  },
  {
    icon: Sparkles,
    title: 'Experience-first shopping',
    description: 'We help you discover what fits the occasion, not merely what is available on a shelf.'
  },
  {
    icon: ShieldCheck,
    title: 'Trusted shopping',
    description: 'Clear information, secure checkout and dependable support from discovery to delivery.'
  }
];

export default function HomeStorefront({ hero }: HomeStorefrontProps) {
  const { categories } = useCatalog();
  const homeCategories = categories.slice(0, 6);
  const heroMedia = hero?.mediaUrl?.trim() || hero?.posterUrl?.trim() || DEFAULT_HERO_IMAGE;

  const heroFallbackImage = hero?.posterUrl?.trim() || DEFAULT_HERO_IMAGE;

  const eyebrow = hero?.eyebrow?.trim() || 'The Shelsea experience';

  const title = hero?.title?.trim() || 'Everything beautiful begins with the right experience.';

  const summary =
    hero?.summary?.trim() ||
    'Discover premium wines, thoughtful meals and unforgettable moments—carefully arranged around the experience you want to create.';

  const primaryLabel = hero ? hero.primaryLabel.trim() : 'Explore Shelsea';

  const primaryHref = hero ? hero.primaryHref.trim() : '/store';

  const secondaryLabel = hero ? hero.secondaryLabel.trim() : 'Discover wines';

  const secondaryHref = hero ? hero.secondaryHref.trim() : '/store?category=wines';

  const showPrimaryAction = Boolean(primaryLabel && primaryHref);

  const showSecondaryAction = Boolean(secondaryLabel && secondaryHref);

  return (
    <main className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020408] text-white scrollbar-none">
      {/* Cinematic hero */}

      <section className="relative isolate min-h-[44rem] overflow-hidden sm:min-h-[48rem] lg:min-h-[52rem]">
        <HeroBackgroundMedia
          mediaType={hero?.mediaType ?? 'IMAGE'}
          mediaUrl={heroMedia}
          fallbackImage={heroFallbackImage}
          autoplay={hero?.autoplay ?? true}
        />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/25" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(1,3,7,0.98)_0%,rgba(1,3,7,0.9)_28%,rgba(1,3,7,0.55)_52%,rgba(1,3,7,0.14)_78%,rgba(1,3,7,0.32)_100%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#020408_0%,rgba(2,4,8,0.96)_10%,rgba(2,4,8,0.62)_24%,transparent_58%,rgba(2,4,8,0.18)_100%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-24 size-96 rounded-full bg-amber-300/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/3 size-80 rounded-full bg-rose-700/10 blur-3xl"
        />

        <div className="relative z-10 mx-auto flex min-h-[44rem] max-w-7xl items-end px-5 pb-44 pt-24 sm:min-h-[48rem] sm:px-8 sm:pb-48 lg:min-h-[52rem] lg:px-12 lg:pb-52 xl:px-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/80 shadow-2xl backdrop-blur-xl">
              <Sparkles className="size-3.5 text-amber-300" />

              {eyebrow}
            </div>

            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:mt-6 sm:text-6xl lg:text-7xl xl:text-8xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
              {summary}
            </p>

            {showPrimaryAction || showSecondaryAction ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {showPrimaryAction ? (
                  <Link
                    href={primaryHref}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#07101d] shadow-[0_16px_45px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                    {primaryLabel}

                    <ArrowRight className="size-4" />
                  </Link>
                ) : null}

                {showSecondaryAction ? (
                  <Link
                    href={secondaryHref}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-bold text-white shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                    {secondaryLabel}

                    <ChevronRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-amber-300" />
                Premium selections
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-amber-300" />
                Convenient shopping
              </span>

              <span className="inline-flex items-center gap-1.5">
                <HeartHandshake className="size-3.5 text-amber-300" />
                Experience-led service
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Category experience grid */}

      <section className="relative z-20 -mt-36 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-end justify-between gap-4 px-1 sm:mb-5">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-300">
                Choose your experience
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                What are you shopping for today?
              </h2>
            </div>

            <Link
              href="/store?view=grid"
              className="hidden items-center gap-1 text-sm font-semibold text-white/55 transition hover:text-white sm:inline-flex">
              Explore everything
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            {homeCategories.map(category => {
              const categoryImage = category.coverImages?.[0] ?? category.image;

              const categoryLabel = category.slug === 'all' ? 'Store' : category.label;

              const categoryHref = category.slug === 'all' ? '/store' : `/store?category=${category.slug}`;

              const categoryDescription =
                category.slug === 'all'
                  ? 'Explore the complete Shelsea store.'
                  : category.shortDescription || 'Explore this experience.';

              const CategoryIcon = category.icon;

              return (
                <Link
                  key={category.id}
                  href={categoryHref}
                  aria-label={`Open ${categoryLabel}`}
                  className="group relative min-h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.38)] transition duration-500 hover:-translate-y-1 hover:border-amber-300/35 hover:shadow-[0_26px_70px_rgba(0,0,0,0.55)] sm:min-h-40 lg:min-h-44">
                  <Image
                    src={categoryImage}
                    alt={categoryLabel}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 grid size-8 place-items-center rounded-full border border-white/15 bg-black/25 text-amber-200 shadow-lg backdrop-blur-xl sm:left-4 sm:top-4 sm:size-9">
                    <CategoryIcon className="size-4" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4 lg:p-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold tracking-tight text-white sm:text-base lg:text-lg">
                        {categoryLabel}
                      </p>

                      <p className="mt-1 hidden line-clamp-1 text-xs leading-5 text-white/55 sm:block">
                        {categoryDescription}
                      </p>
                    </div>

                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-xl transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black">
                      <ChevronRight className="size-4" />
                    </span>
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-amber-300/20 transition group-hover:opacity-100"
                  />
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end sm:hidden">
            <Link
              href="/store?view=grid"
              className="inline-flex items-center gap-1 text-xs font-semibold text-white/55 transition hover:text-white">
              Explore everything
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why shop with Shelsea */}

      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pb-24 lg:px-10 lg:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-20 size-96 -translate-x-1/2 rounded-full bg-amber-300/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-300">
              Why shop with Shelsea
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              Shopping designed around the moment you want to create.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              Shelsea brings products, occasions and thoughtful recommendations together so that every
              purchase feels intentional.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
            {whyShopItems.map(item => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.07] sm:p-6">
                  <div className="absolute -right-10 -top-10 size-28 rounded-full bg-amber-300/5 blur-2xl transition group-hover:bg-amber-300/10" />

                  <div className="relative grid size-10 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="relative mt-5 text-base font-bold text-white">{item.title}</h3>

                  <p className="relative mt-2 text-sm leading-6 text-white/50">{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,rgba(163,22,33,0.3),rgba(11,18,32,0.92)_48%,rgba(201,164,92,0.18))] px-6 py-8 shadow-[0_26px_80px_rgba(0,0,0,0.38)] sm:px-8 sm:py-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-amber-300/10 blur-3xl"
            />

            <div className="relative max-w-2xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-300">
                Your next experience starts here
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Discover products selected for more than just shopping.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55 sm:text-base">
                Enter the store and let Shelsea help you assemble the right experience.
              </p>
            </div>

            <Link
              href="/store"
              className="relative mt-6 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#07101d] shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-amber-50 lg:mt-0">
              Enter Shelsea
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
