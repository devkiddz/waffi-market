'use client';

import Image from 'next/image';

import {
  ArrowRight,
  BadgePercent,
  PackageSearch,
  Sparkles
} from 'lucide-react';

import {
  useMemo
} from 'react';

import {
  useFeedExperience
} from '@/features/feed-experience';

import {
  ProductActionTray
} from '@/features/products/cards/ProductActionTray';

import type {
  ProductType
} from '@/types/types';

type ProductRuntimeGridProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyLabel: string;
  products: ProductType[];
};

function ProductRuntimeGrid({
  eyebrow,
  title,
  description,
  emptyLabel,
  products
}: ProductRuntimeGridProps) {
  const {
    actions
  } = useFeedExperience();

  return (
    <section
      className="
        overflow-hidden rounded-3xl
        border border-primary/12
        bg-card/40 p-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.25)]
      ">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/45">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-base font-bold tracking-tight text-primary">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            {description}
          </p>
        </div>

        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
      </header>

      {products.length ===
      0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-primary/15 bg-background/30 p-5 text-center">
          <PackageSearch className="mx-auto size-7 text-primary/35" />

          <p className="mt-3 text-sm font-semibold text-primary">
            {emptyLabel}
          </p>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            The card stays empty instead of substituting prepared fixture products.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {products.map(
            product => {
              const variant =
                product.variants.find(
                  item =>
                    item.stockLeft >
                    0
                ) ??
                product.variants[0];

              if (
                !variant
              ) {
                return null;
              }

              return (
                <article
                  key={
                    product.id
                  }
                  className="
                    group min-w-0
                    overflow-hidden
                    rounded-2xl border
                    border-primary/10
                    bg-background/40
                  ">
                  <button
                    type="button"
                    onClick={() =>
                      actions.openExperience({
                        type:
                          'product',

                        productId:
                          product.id
                      })
                    }
                    className="block w-full text-left">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={
                          variant.image
                        }
                        alt={
                          product.name
                        }
                        fill
                        sizes="150px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-2.5">
                      <p className="line-clamp-2 min-h-8 text-[11px] font-semibold leading-4 text-primary">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 truncate text-[10px] text-primary/45">
                        {
                          product.category
                        }
                      </p>
                    </div>
                  </button>

                  <div className="px-2.5 pb-2.5">
                    <ProductActionTray
                      product={
                        product
                      }
                      variant={
                        variant
                      }
                      presentation="inline"
                      compact
                      className="w-fit max-w-full border-primary/10 bg-background/70"
                    />
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

export function SuggestedPicksWidget() {
  const {
    intent,
    context
  } = useFeedExperience();

  const products =
    useMemo(() => {
      const productById =
        new Map(
          context.catalog.products.map(
            product => [
              String(
                product.id
              ),
              product
            ]
          )
        );

      const signalIds =
        Array.from(
          new Set([
            ...(intent.type ===
              'product' &&
            intent.targetId
              ? [
                  intent.targetId
                ]
              : []),

            ...context.user
              .recentProductIds,

            ...context.user
              .wishlistProductIds,

            ...context.user
              .cartProductIds,

            ...context.activity
              .viewedProductIds
          ])
        );

      const preferredCategories =
        new Set(
          signalIds
            .map(
              productId =>
                productById.get(
                  String(
                    productId
                  )
                )?.category
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(
                  value
                )
            )
        );

      return [
        ...context.catalog.products
      ]
        .sort(
          (
            first,
            second
          ) => {
            const firstCategoryScore =
              preferredCategories.has(
                first.category
              )
                ? 1
                : 0;

            const secondCategoryScore =
              preferredCategories.has(
                second.category
              )
                ? 1
                : 0;

            return (
              secondCategoryScore -
                firstCategoryScore ||
              Number(
                second.featured
              ) -
                Number(
                  first.featured
                ) ||
              second.rating -
                first.rating ||
              second.soldCount -
                first.soldCount
            );
          }
        )
        .slice(
          0,
          4
        );
    }, [
      context.activity
        .viewedProductIds,
      context.catalog.products,
      context.user
        .cartProductIds,
      context.user
        .recentProductIds,
      context.user
        .wishlistProductIds,
      intent.targetId,
      intent.type
    ]);

  return (
    <ProductRuntimeGrid
      eyebrow="Signal-based discovery"
      title="Suggested Picks"
      description="Resolved from live catalogue and customer activity signals. This is not presented as an AI-generated result."
      emptyLabel="No catalogue suggestion is available"
      products={
        products
      }
    />
  );
}

export function NewProductsWidget() {
  const {
    context
  } = useFeedExperience();

  const products =
    useMemo(
      () =>
        context.catalog.products
          .filter(
            product =>
              product.isNew
          )
          .sort(
            (
              first,
              second
            ) =>
              second.rating -
                first.rating ||
              second.soldCount -
                first.soldCount
          )
          .slice(
            0,
            4
          ),
      [
        context.catalog.products
      ]
    );

  return (
    <ProductRuntimeGrid
      eyebrow="Catalogue update"
      title="New Products"
      description="Products currently marked as new in the active Shelsea catalogue."
      emptyLabel="No product is currently marked new"
      products={
        products
      }
    />
  );
}

export function LivePromotionsWidget() {
  const {
    actions,
    context
  } = useFeedExperience();

  const promotions =
    useMemo(() => {
      const now =
        new Date(
          context.environment.now
        ).getTime();

      return context.catalog.promotions
        .filter(
          promotion => {
            if (
              !promotion.active
            ) {
              return false;
            }

            const startsAt =
              promotion.startsAt
                ? new Date(
                    promotion.startsAt
                  ).getTime()
                : null;

            const endsAt =
              promotion.endsAt
                ? new Date(
                    promotion.endsAt
                  ).getTime()
                : null;

            return (
              (
                startsAt ===
                  null ||
                startsAt <=
                  now
              ) &&
              (
                endsAt ===
                  null ||
                endsAt >=
                  now
              )
            );
          }
        )
        .sort(
          (
            first,
            second
          ) =>
            first.priority -
            second.priority
        )
        .slice(
          0,
          3
        );
    }, [
      context.catalog.promotions,
      context.environment.now
    ]);

  return (
    <section
      className="
        overflow-hidden rounded-3xl
        border border-primary/12
        bg-card/40 p-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.25)]
      ">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/45">
            Store campaigns
          </p>

          <h3 className="mt-1 text-base font-bold tracking-tight text-primary">
            Live Promotions
          </h3>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            Only active promotions inside their configured date window appear here.
          </p>
        </div>

        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BadgePercent className="size-5" />
        </span>
      </header>

      {promotions.length ===
      0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-primary/15 bg-background/30 p-5 text-center">
          <BadgePercent className="mx-auto size-7 text-primary/35" />

          <p className="mt-3 text-sm font-semibold text-primary">
            No live promotion
          </p>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            Expired and inactive campaigns are not presented as customer offers.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {promotions.map(
            promotion => (
              <button
                key={
                  promotion.id
                }
                type="button"
                onClick={() =>
                  actions.openExperience({
                    type:
                      'promotion',

                    promotionId:
                      promotion.id
                  })
                }
                className="
                  group flex w-full
                  items-center gap-3
                  rounded-2xl border
                  border-primary/10
                  bg-background/35
                  p-3 text-left
                  transition
                  hover:border-primary/20
                  hover:bg-background/55
                ">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-[9px] font-black uppercase text-primary">
                  {
                    promotion.discountPercent
                      ? `${promotion.discountPercent}%`
                      : promotion.badge.slice(
                          0,
                          4
                        )
                  }
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-primary">
                    {
                      promotion.title
                    }
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-primary/45">
                    {promotion.subtitle ??
                      `${promotion.productIds.length} connected products`}
                  </span>
                </span>

                <ArrowRight className="size-4 shrink-0 text-primary/35 transition group-hover:translate-x-1" />
              </button>
            )
          )}
        </div>
      )}
    </section>
  );
}
