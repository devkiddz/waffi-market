'use client';

import Image from 'next/image';

import {
  ArrowRight,
  Clock3,
  PackageSearch
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

export default function RecentlyViewedWidget() {
  const {
    actions,
    context
  } = useFeedExperience();

  const recentProducts =
    useMemo(() => {
      const orderedIds =
        Array.from(
          new Set([
            ...context.user
              .recentProductIds,
            ...context.activity
              .viewedProductIds
          ])
        );

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

      return orderedIds
        .map(
          productId =>
            productById.get(
              String(
                productId
              )
            )
        )
        .filter(
          (
            product
          ): product is NonNullable<
            typeof product
          > =>
            Boolean(
              product
            )
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
        .recentProductIds
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
          <p
            className="
              text-[11px] font-semibold
              uppercase tracking-[0.2em]
              text-primary/45
            ">
            Shopping activity
          </p>

          <h3
            className="
              mt-1 text-base
              font-bold tracking-tight
              text-primary
            ">
            Recently Viewed
          </h3>

          <p
            className="
              mt-1 text-xs leading-5
              text-primary/50
            ">
            Real products from your latest Shelsea browsing activity.
          </p>
        </div>

        <span
          className="
            grid size-11 shrink-0
            place-items-center
            rounded-2xl
            bg-primary/10
            text-primary
          ">
          <Clock3 className="size-5" />
        </span>
      </header>

      {recentProducts.length ===
      0 ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-primary/15
            bg-background/30
            p-5 text-center
          ">
          <PackageSearch
            className="
              mx-auto size-7
              text-primary/35
            "
          />

          <p
            className="
              mt-3 text-sm
              font-semibold text-primary
            ">
            Nothing viewed yet
          </p>

          <p
            className="
              mt-1 text-xs leading-5
              text-primary/50
            ">
            Products you open in the Store will appear here automatically.
          </p>

          <button
            type="button"
            onClick={() =>
              actions.openExperience({
                type:
                  'category',

                categorySlug:
                  'all'
              })
            }
            className="
              mt-4 inline-flex
              items-center gap-2
              rounded-full border
              border-primary/15
              bg-background/50
              px-4 py-2
              text-xs font-semibold
              text-primary transition
              hover:bg-primary
              hover:text-background
            ">
            Explore products

            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div
            className="
              mt-5 grid
              grid-cols-2 gap-2.5
            ">
            {recentProducts.map(
              product => {
                const variant =
                  product.variants.find(
                    item =>
                      item.stockLeft >
                      0
                  ) ??
                  product.variants[0];

                if (!variant) {
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
                      className="
                        block w-full
                        text-left
                      ">
                      <div
                        className="
                          relative aspect-square
                          overflow-hidden
                          bg-muted
                        ">
                        <Image
                          src={
                            variant.image
                          }
                          alt={
                            product.name
                          }
                          fill
                          sizes="150px"
                          className="
                            object-cover
                            transition
                            duration-500
                            group-hover:scale-105
                          "
                        />
                      </div>

                      <div className="p-2.5">
                        <p
                          className="
                            line-clamp-2
                            min-h-8 text-[11px]
                            font-semibold
                            leading-4 text-primary
                          ">
                          {
                            product.name
                          }
                        </p>

                        <p
                          className="
                            mt-1 truncate
                            text-[10px]
                            text-primary/45
                          ">
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
                        className="
                          w-fit max-w-full
                          border-primary/10
                          bg-background/70
                        "
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              actions.openExperience({
                type:
                  'category',

                categorySlug:
                  'all'
              })
            }
            className="
              mt-4 flex w-full
              items-center
              justify-center gap-2
              rounded-full bg-primary
              px-4 py-2.5
              text-xs font-semibold
              text-background
              transition hover:opacity-90
            ">
            Continue browsing

            <ArrowRight className="size-3.5" />
          </button>
        </>
      )}
    </section>
  );
}
