'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Boxes,
  Clapperboard,
  Layers3,
  Mail,
  Phone,
  Play,
  Sparkles,
  Store,
  type LucideIcon
} from 'lucide-react';

import { useActionFeedback } from '@/features/action-feedback';
import { useCart } from '@/features/cart';
import { CommerceStoryRail } from '@/features/commerce-stories';
import { openCustomerProductExperience } from '@/features/customer-experience';
import type { FeedActions } from '@/features/feed-experience/contracts';
import { ProductCard } from '@/features/products/cards';

import type { ProductType, ProductVariantType } from '@/types/types';

import type { VendorStorefront } from '../contracts';

type VendorStorefrontExperienceProps = {
  storefront: VendorStorefront;
};

export default function VendorStorefrontExperience({
  storefront
}: VendorStorefrontExperienceProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { error: showError } = useActionFeedback();

  const openProduct = useCallback((product: ProductType): void => {
    openCustomerProductExperience({
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription
    });
  }, []);

  const addProductToCart = useCallback(
    async (product: ProductType, variant: ProductVariantType): Promise<void> => {
      const addedItem = await addToCart({
        product,
        variant,
        quantity: 1
      });

      if (!addedItem) {
        showError({
          title: 'Unable to add product',
          description:
            'Shelsea could not add this product to your cart. Please try again.'
        });
      }
    },
    [addToCart, showError]
  );


  const storyActions = useMemo<FeedActions>(
    () => ({
      openExperience: target => {
        if (target.type === 'product') {
          const product = storefront.products.find(
            item => item.id === target.productId
          );

          if (product) {
            openProduct(product);
          }

          return;
        }

        if (target.type === 'collection') {
          const collection = storefront.collections.find(
            item => item.id === target.collectionId
          );

          if (collection) {
            router.push(
              `/collections/${encodeURIComponent(collection.slug)}`
            );
          }

          return;
        }

        if (target.type === 'promotion') {
          const promotion = storefront.promotions.find(
            item => item.id === target.promotionId
          );

          if (promotion) {
            router.push(promotion.href);
          }

          return;
        }

        router.push('/store');
      },
      restoreExperience: () => undefined,
      resetExperience: () => router.push('/store'),
      changeCategory: () => router.push('/store'),
      previewProduct: openProduct,
      toggleLike: () => undefined,
      addToCart: addProductToCart,
      previewPromotion: promotionId => {
        const promotion = storefront.promotions.find(
          item => item.id === promotionId
        );

        if (promotion) {
          router.push(promotion.href);
        }
      }
    }),
    [addProductToCart, openProduct, router, storefront]
  );

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-8 lg:px-7">
      <Link
        href="/shops"
        className="mb-4 inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 text-xs font-bold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        All shops
      </Link>

      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {storefront.logoUrl ? (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted shadow-lg sm:size-28">
              <Image
                src={storefront.logoUrl}
                alt={`${storefront.name} logo`}
                fill
                priority
                sizes="112px"
                className="object-cover"
              />
            </div>
          ) : (
            <span className="grid size-24 shrink-0 place-items-center rounded-[1.75rem] border border-border/60 bg-muted shadow-lg sm:size-28">
              <Store className="size-9 text-muted-foreground" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-emerald-600">
              <BadgeCheck className="size-3.5" />
              Verified Shelsea merchant
            </span>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {storefront.name}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {storefront.description ??
                'Explore this merchant through the connected Shelsea Store experience.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {storefront.email ? (
                <a
                  href={`mailto:${storefront.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold">
                  <Mail className="size-3.5" />
                  Email shop
                </a>
              ) : null}

              {storefront.phone ? (
                <a
                  href={`tel:${storefront.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold">
                  <Phone className="size-3.5" />
                  Call shop
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <SummaryMetric icon={Boxes} label="Products" value={storefront.products.length} />
          <SummaryMetric icon={Layers3} label="Collections" value={storefront.collections.length} />
          <SummaryMetric icon={BadgePercent} label="Offers" value={storefront.promotions.length} />
          <SummaryMetric icon={Clapperboard} label="Stories" value={storefront.stories.length} />
          <SummaryMetric icon={Play} label="Reels" value={storefront.reels.length} />
        </div>
      </header>

      {storefront.collections.length > 0 ? (
        <section className="mt-8">
          <SectionHeader
            eyebrow="Merchant collections"
            title="Curated by this shop"
            count={storefront.collections.length}
          />

          <div className="mt-4 space-y-4">
            {storefront.collections.map(collection => (
              <Link
                key={collection.id}
                href={`/collections/${encodeURIComponent(collection.slug)}`}
                className="group block overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 shadow-lg">
                {collection.banner?.image ? (
                  <div className="relative aspect-[9/2] w-full overflow-hidden bg-muted">
                    <Image
                      src={collection.banner.image}
                      alt={`${collection.title} collection cover`}
                      fill
                      sizes="(max-width: 768px) 100vw, 1400px"
                      className="object-cover transition duration-500 group-hover:scale-[1.01]"
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black">
                      {collection.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {collection.productIds.length}{' '}
                      {collection.productIds.length === 1 ? 'product' : 'products'}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-primary">
                    View collection
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {storefront.promotions.length > 0 ? (
        <section className="mt-8">
          <SectionHeader
            eyebrow="Live offers"
            title="Promotions from this shop"
            count={storefront.promotions.length}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {storefront.promotions.map(promotion => (
              <Link
                key={promotion.id}
                href={promotion.href}
                className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 shadow-lg transition hover:-translate-y-0.5 hover:border-primary/25">
                {promotion.imageUrl ? (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image
                      src={promotion.imageUrl}
                      alt={promotion.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 480px"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="p-5">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[0.62rem] font-bold text-primary">
                    {promotion.badge}
                  </span>
                  <h3 className="mt-3 text-lg font-black">{promotion.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {promotion.description ??
                      'A published offer from this Shelsea merchant.'}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">
                    {promotion.productCount}{' '}
                    {promotion.productCount === 1 ? 'product' : 'products'} included
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">
                    Open offer
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {storefront.stories.length > 0 ? (
        <section className="mt-8">
          <CommerceStoryRail
            title={`Stories from ${storefront.name}`}
            stories={storefront.stories}
            actions={storyActions}
          />
        </section>
      ) : null}

      {storefront.reels.length > 0 ? (
        <section className="mt-8">
          <SectionHeader
            eyebrow="Commerce media"
            title="Reels from this shop"
            count={storefront.reels.length}
          />

          <div className="mt-4 flex gap-3 overflow-x-auto pb-3 scrollbar-none">
            {storefront.reels.map(reel => (
              <Link key={reel.id} href={reel.href ?? '/store'}>
                <article className="group relative aspect-[9/16] w-40 shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-xl sm:w-48">
                  {reel.coverUrl ? (
                    <Image
                      src={reel.coverUrl}
                      alt={reel.title}
                      fill
                      sizes="192px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/65">
                      Reel
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-black">
                      {reel.title}
                    </h3>
                  </div>
                  <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-lg">
                    <Play className="size-4 fill-current" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="products" className="mt-8 scroll-mt-24">
        <SectionHeader
          eyebrow="Complete catalogue"
          title={`Shop ${storefront.name}`}
          count={storefront.products.length}
        />

        {storefront.products.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {storefront.products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPreview={openProduct}
                onOpenExperience={openProduct}
                onAddToCart={addProductToCart}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/50 p-8 text-center">
            <div>
              <Sparkles className="mx-auto size-8 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-bold">No published products</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This merchant has not published a product selection yet.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/55 p-3">
      <Icon className="size-4 text-primary" />
      <strong className="mt-2 block text-lg">{value}</strong>
      <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  count
}: {
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 truncate text-2xl font-black tracking-tight">
          {title}
        </h2>
      </div>
      <span className="shrink-0 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
