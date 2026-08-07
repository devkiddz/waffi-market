'use client';

/* SHELSEA_PROMO_CAMPAIGN_GRID_V1 */

import Image from 'next/image';

import Link from 'next/link';

import {
  ArrowLeft,
  ArrowRight,
  Flame,
  ShieldCheck,
  Tag
} from 'lucide-react';

import PromoCountdown from '@/components/promos/PromoCountdown';

import type {
  Promo
} from '@/data/promos';

import {
  useCart
} from '@/features/cart';

import {
  useCatalog
} from '@/features/catalog';

import {
  openCustomerProductExperience
} from '@/features/customer-experience';

import {
  ProductCard
} from '@/features/products/cards/ProductCard';

import {
  cn
} from '@/lib/utils';

import {
  useDiscoveryHubOpen
} from './useDiscoveryHubOpen';

export default function PromoCampaignExperience({
  promo
}: {
  promo: Promo;
}) {
  const {
    products
  } =
    useCatalog();

  const {
    addToCart
  } =
    useCart();

  const hubOpen =
    useDiscoveryHubOpen();

  const promoProducts =
    products.filter(
      product =>
        promo.productIds.includes(
          product.id
        )
    );

  const heroImage =
    promo.image ??
    promoProducts[0]
      ?.variants[0]
      ?.image;

  const openProduct =
    (
      product:
        (typeof promoProducts)[number]
    ): void => {
      openCustomerProductExperience({
        id:
          product.id,
        name:
          product.name,
        shortDescription:
          product.shortDescription
      });
    };

  return (
    <main
      className="
        mx-auto min-h-dvh
        w-full max-w-[96rem]
        px-3 py-5
        sm:px-5 sm:py-8
        lg:px-7
      ">
      <Link
        href="/promos"
        className="
          mb-5 inline-flex
          items-center gap-2
          text-xs font-semibold
          text-muted-foreground
          transition
          hover:text-foreground
        ">
        <ArrowLeft className="size-4" />
        All promotions
      </Link>

      <section
        className="
          relative overflow-hidden
          rounded-[2rem]
          border border-white/10
          bg-black shadow-2xl
          sm:min-h-[28rem]
        ">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={promo.title}
            fill
            priority
            sizes="100vw"
            className="
              object-cover
              transition duration-700
              hover:scale-[1.02]
            "
          />
        ) : null}

        <div
          className="
            absolute inset-0
            bg-black/28
          "
        />

        <div
          className="
            absolute inset-0
            bg-gradient-to-r
            from-black/92
            via-black/58
            to-black/10
          "
        />

        <div
          className="
            absolute inset-x-0 bottom-0
            h-64
            bg-gradient-to-t
            from-black/85
            to-transparent
          "
        />

        <div
          aria-hidden="true"
          className="
            absolute -right-12 -top-20
            size-72 rounded-full
            bg-rose-500/20
            blur-3xl
          "
        />

        <div
          className="
            relative z-10
            flex min-h-[22rem]
            max-w-3xl
            flex-col justify-end
            p-6 text-white
            sm:min-h-[28rem]
            sm:p-10
          ">
          <div
            className="
              flex flex-wrap
              items-center gap-2
            ">
            <span
              className="
                inline-flex items-center
                gap-2 rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-bold
                backdrop-blur-xl
              ">
              <Flame className="size-3.5" />
              {promo.badge}
            </span>

            <span
              className="
                rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-semibold
                capitalize
                backdrop-blur-xl
              ">
              {promo.type}
            </span>
          </div>

          <h1
            className="
              mt-5 text-4xl
              font-black tracking-tight
              sm:text-6xl
            ">
            {promo.title}
          </h1>

          {promo.subtitle ? (
            <p
              className="
                mt-3 max-w-xl
                text-sm leading-6
                text-white/75
                sm:text-base
              ">
              {promo.subtitle}
            </p>
          ) : null}

          <div className="mt-6 max-w-md">
            <PromoCountdown
              startsAt={promo.startsAt}
              endsAt={promo.endsAt}
            />
          </div>

          <div
            className="
              mt-6 flex flex-wrap
              gap-2
            ">
            <a
              href="#campaign-products"
              className="
                inline-flex items-center
                gap-2 rounded-full
                bg-white
                px-5 py-2.5
                text-xs font-bold
                text-black
                transition
                hover:bg-rose-50
              ">
              Shop campaign
              <ArrowRight className="size-4" />
            </a>

            <Link
              href="/store"
              className="
                inline-flex items-center
                gap-2 rounded-full
                border border-white/20
                bg-white/10
                px-5 py-2.5
                text-xs font-bold
                backdrop-blur-xl
                transition
                hover:bg-white/15
              ">
              Continue browsing
            </Link>
          </div>
        </div>
      </section>

      <section
        className="
          mt-6 grid gap-4
          lg:grid-cols-[minmax(0,1fr)_22rem]
        ">
        <article
          className="
            rounded-[2rem]
            border border-border/60
            bg-card/70 p-6
          ">
          <div
            className="
              flex items-center gap-2
            ">
            <ShieldCheck
              className="
                size-5
                text-rose-500
              "
            />

            <h2
              className="
                text-lg font-bold
              ">
              Campaign details
            </h2>
          </div>

          <p
            className="
              mt-3 max-w-3xl
              text-sm leading-7
              text-muted-foreground
            ">
            {promo.description ??
              'Selected products and savings are available while this campaign remains active.'}
          </p>
        </article>

        <article
          className="
            rounded-[2rem]
            border border-border/60
            bg-card/70 p-6
          ">
          <div
            className="
              flex items-center gap-2
            ">
            <Tag
              className="
                size-5
                text-rose-500
              "
            />

            <h2
              className="
                text-lg font-bold
              ">
              Offer summary
            </h2>
          </div>

          <p
            className="
              mt-3 text-2xl
              font-black
            ">
            {promo.discountPercent
              ? `${promo.discountPercent}% off`
              : promo.badge}
          </p>

          <p
            className="
              mt-1 text-xs
              text-muted-foreground
            ">
            Across {promoProducts.length} selected products
          </p>
        </article>
      </section>

      <section
        id="campaign-products"
        className="
          mt-8 min-w-0
          scroll-mt-24
        ">
        <div
          className="
            flex min-w-0
            items-end justify-between
            gap-4
          ">
          <div className="min-w-0">
            <p
              className="
                text-[10px]
                font-semibold uppercase
                tracking-[0.2em]
                text-rose-500/80
              ">
              Included selection
            </p>

            <h2
              className="
                mt-1 text-2xl
                font-bold tracking-tight
              ">
              Shop this campaign
            </h2>

            <p
              className="
                mt-1 max-w-2xl
                text-xs leading-5
                text-muted-foreground
              ">
              Every product is presented in the same Shelsea commerce
              card system used across the Store.
            </p>
          </div>

          <span
            className="
              shrink-0 text-xs
              font-medium
              text-muted-foreground
            ">
            {promoProducts.length}{' '}
            {promoProducts.length === 1
              ? 'product'
              : 'products'}
          </span>
        </div>

        {promoProducts.length ? (
          <div
            data-promo-product-grid
            data-hub-open={
              hubOpen
                ? 'true'
                : 'false'
            }
            className={cn(
              'mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4',
              hubOpen
                ? '2xl:grid-cols-4'
                : '2xl:grid-cols-5'
            )}>
            {promoProducts.map(
              product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="h-full"
                  onPreview={
                    openProduct
                  }
                  onOpenExperience={
                    openProduct
                  }
                  onAddToCart={(
                    selectedProduct,
                    variant
                  ) => {
                    void addToCart({
                      product:
                        selectedProduct,
                      variant,
                      quantity: 1
                    });
                  }}
                />
              )
            )}
          </div>
        ) : (
          <div
            className="
              mt-5 rounded-[2rem]
              border border-dashed
              border-border/70
              bg-muted/20
              p-8 text-center
              text-sm
              text-muted-foreground
            ">
            No products are currently available for this campaign.
          </div>
        )}
      </section>

      {promo.terms?.length ? (
        <section
          className="
            mt-8 rounded-[2rem]
            border border-border/60
            bg-card/60 p-6
          ">
          <h2
            className="
              text-lg font-bold
            ">
            Terms
          </h2>

          <ul
            className="
              mt-3 space-y-2
              text-sm
              text-muted-foreground
            ">
            {promo.terms.map(
              term => (
                <li
                  key={term}
                  className="
                    flex gap-2
                  ">
                  <span
                    className="
                      mt-2 size-1.5
                      shrink-0
                      rounded-full
                      bg-rose-500
                    "
                  />

                  {term}
                </li>
              )
            )}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
