'use client';

import Image from 'next/image';

import { useEffect, useMemo, useRef } from 'react';

import {
  BadgeCheck,
  CalendarClock,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp
} from 'lucide-react';

import { ProductReviewsSection } from '@/features/reviews/components/ProductReviewsSection';

import type { ProductDetailsModuleDefinition } from '@/features/feed-experience/contracts';

import { useFeedExperienceContext } from '@/features/feed-experience/providers/FeedExperienceProvider';

import { ProductVariantScroller } from '@/features/feed-experience/product-details/ProductVariantScroller';

type ProductDetailsModuleProps = {
  module: ProductDetailsModuleDefinition;
};

function formatLabel(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function ProductDetailsModule({ module }: ProductDetailsModuleProps) {
  const { productDetailsDisclosure } = useFeedExperienceContext();

  const sectionRef = useRef<HTMLElement>(null);

  const { product, category, categoryDescription, reviews, locale = 'en-NG', currency = 'NGN' } = module.data;

  const visible = productDetailsDisclosure.expanded && productDetailsDisclosure.productId === product.id;

  const priceFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      });
    } catch {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
      });
    }
  }, [currency, locale]);

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1
      });
    } catch {
      return new Intl.NumberFormat('en-NG', {
        notation: 'compact',
        maximumFractionDigits: 1
      });
    }
  }, [locale]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [productDetailsDisclosure.requestId, visible]);

  if (!visible) {
    return null;
  }

  const longDescription = product.longDescription?.trim() || product.shortDescription?.trim();

  const visibleTags = (product.tags ?? []).filter(tag => !tag.includes(':'));

  const totalStock = product.variants.reduce((total, variant) => total + Math.max(0, variant.stockLeft), 0);

  const availableVariants = product.variants.filter(variant => variant.stockLeft > 0).length;

  const scrollToReviews = (): void => {
    document.getElementById(`product-reviews-${product.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section
      ref={sectionRef}
      id={`product-details-${product.id}`}
      aria-label={`Full details for ${product.name}`}
      className="
        scroll-mt-24 overflow-hidden rounded-3xl
        border border-primary/10
        bg-card/55 shadow-sm
      ">
      {/* ====================================================
          DETAILS INTRODUCTION
      ==================================================== */}

      <header className="relative overflow-hidden border-b border-primary/10 p-5 md:p-8">
        {category.coverImage ? (
          <Image src={category.coverImage} alt="" fill sizes="100vw" className="object-cover opacity-10" />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-primary/30" />

              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
                Full product details
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight md:text-4xl">
              Everything about {product.name}
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Complete product information, availability and customer experiences are revealed inside your
              active Feed.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-4" />
            Revealed in Feed
          </span>
        </div>
      </header>

      <div className="space-y-8 p-5 md:p-8">
        {/* ==================================================
            PRODUCT STORY
        ================================================== */}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background/70 p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Product story
            </p>

            <h3 className="mt-3 text-xl font-bold tracking-tight">About this selection</h3>

            {longDescription ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {longDescription}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Detailed editorial information has not yet been added for this product.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={scrollToReviews}
              className="
                rounded-3xl border border-border
                bg-background/70 p-4 text-left
                transition
                hover:border-amber-400/40
                hover:bg-amber-400/5
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
              ">
              <Star className="size-5 fill-amber-400 text-amber-400" />

              <p className="mt-4 text-2xl font-bold">{reviews.averageRating.toFixed(1)}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {numberFormatter.format(reviews.reviewCount)} reviews
              </p>
            </button>

            <article className="rounded-3xl border border-border bg-background/70 p-4">
              <TrendingUp className="size-5 text-primary" />

              <p className="mt-4 text-2xl font-bold">{numberFormatter.format(product.soldCount)}</p>

              <p className="mt-1 text-xs text-muted-foreground">Products sold</p>
            </article>

            <article className="rounded-3xl border border-border bg-background/70 p-4">
              <Layers3 className="size-5 text-primary" />

              <p className="mt-4 text-2xl font-bold">{product.variants.length}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {product.variants.length === 1 ? 'Available option' : 'Available options'}
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-background/70 p-4">
              <PackageCheck className="size-5 text-primary" />

              <p className="mt-4 text-2xl font-bold">{totalStock}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Units across {availableVariants} in-stock {availableVariants === 1 ? 'option' : 'options'}
              </p>
            </article>
          </div>
        </section>

        {/* ==================================================
            PRODUCT VARIANTS
        ================================================== */}

        <ProductVariantScroller product={product} priceFormatter={priceFormatter} />

        {/* ==================================================
            PRODUCT FACTS
        ================================================== */}

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Product information
          </p>

          <h3 className="mt-2 text-xl font-bold tracking-tight">Essential facts</h3>

          <dl className="mt-4 grid overflow-hidden rounded-3xl border border-border bg-background/70 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4 md:border-r">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="size-4" />
                Category
              </dt>

              <dd className="text-right text-sm font-semibold">{category.label}</dd>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers3 className="size-4" />
                Subcategory
              </dt>

              <dd className="text-right text-sm font-semibold">
                {product.subcategory ? formatLabel(product.subcategory) : 'General selection'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-border p-4 md:border-r">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="size-4" />
                Status
              </dt>

              <dd className="text-right text-sm font-semibold">
                {product.isNew
                  ? 'New arrival'
                  : product.featured
                    ? 'Featured selection'
                    : 'Available selection'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" />
                Discount
              </dt>

              <dd className="text-right text-sm font-semibold">
                {product.discountPercentage > 0 ? `${product.discountPercentage}% off` : 'Standard pricing'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 md:border-r">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4" />
                Delivery
              </dt>

              <dd className="text-right text-sm font-semibold">
                {product.estimatedDelivery || 'Calculated at checkout'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <PackageCheck className="size-4" />
                Availability
              </dt>

              <dd className="text-right text-sm font-semibold">
                {availableVariants > 0
                  ? `${availableVariants} ${availableVariants === 1 ? 'option' : 'options'} in stock`
                  : 'Currently unavailable'}
              </dd>
            </div>
          </dl>
        </section>

        {/* ==================================================
            CUSTOMER REVIEWS
        ================================================== */}

        <ProductReviewsSection productId={String(product.id)} data={reviews} />

        {/* ==================================================
            CHARACTERISTICS
        ================================================== */}

        {visibleTags.length > 0 ? (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Characteristics
            </p>

            <h3 className="mt-2 text-xl font-bold tracking-tight">Product tags</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {formatLabel(tag)}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* ==================================================
            SHOPPING ASSURANCES
        ================================================== */}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-background/70 p-5">
            <PackageCheck className="size-5 text-primary" />

            <h3 className="mt-4 text-sm font-semibold">Catalog availability</h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Variant prices and stock are resolved from the active Shelsea catalog.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/70 p-5">
            <CalendarClock className="size-5 text-primary" />

            <h3 className="mt-4 text-sm font-semibold">Delivery awareness</h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Delivery expectations remain connected to the product and checkout experience.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/70 p-5">
            <ShieldCheck className="size-5 text-primary" />

            <h3 className="mt-4 text-sm font-semibold">Secure shopping</h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Cart, wishlist and checkout actions continue through the shared commerce providers.
            </p>
          </article>
        </section>

        {/* ==================================================
            CATEGORY CONTEXT
        ================================================== */}

        {categoryDescription ? (
          <section className="rounded-3xl border border-primary/10 bg-primary/5 p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
              About {category.label}
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{categoryDescription}</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
