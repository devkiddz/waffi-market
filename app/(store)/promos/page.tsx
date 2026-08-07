'use client';

/* SHELSEA_PROMOS_GRID_DESTINATION_V1 */

import {
  BadgePercent,
  Sparkles
} from 'lucide-react';

import {
  useRouter
} from 'next/navigation';

import PromoCard from '@/components/promos/PromoCard';

import {
  promos
} from '@/data/promos';

import {
  useCatalog
} from '@/features/catalog';

import {
  openCustomerProductExperience
} from '@/features/customer-experience';

export default function PromotionsPage() {
  const router =
    useRouter();

  const {
    products
  } =
    useCatalog();

  const activePromos =
    promos
      .filter(
        promo =>
          promo.active
      )
      .sort(
        (
          firstPromo,
          secondPromo
        ) =>
          firstPromo.priority -
          secondPromo.priority
      );

  const openPromotion =
    (
      promo:
        (typeof activePromos)[number]
    ): void => {
      const campaignProducts =
        products.filter(
          product =>
            promo.productIds.includes(
              product.id
            )
        );

      const leadProduct =
        campaignProducts[0];

      if (leadProduct) {
        openCustomerProductExperience({
          id:
            leadProduct.id,
          name:
            leadProduct.name,
          shortDescription:
            leadProduct.shortDescription
        });
      }

      router.push(
        promo.href ??
          `/promos/${promo.slug}`
      );
    };

  return (
    <main
      className="
        mx-auto min-h-dvh
        w-full max-w-[96rem]
        px-3 py-6
        sm:px-5 sm:py-8
        lg:px-7
      ">
      <header
        className="
          relative overflow-hidden
          rounded-[2rem]
          border border-rose-500/15
          bg-card/85
          p-6 shadow-xl
          backdrop-blur-xl
          sm:p-9
        ">
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute -right-20 -top-28
            size-80 rounded-full
            bg-rose-500/12
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute bottom-0 left-1/4
            h-24 w-72
            rounded-full
            bg-rose-300/8
            blur-3xl
          "
        />

        <div className="relative max-w-3xl">
          <span
            className="
              inline-flex items-center
              gap-2 rounded-full
              border border-rose-500/20
              bg-rose-500/8
              px-3 py-1.5
              text-xs font-semibold
              uppercase tracking-[0.18em]
              text-rose-500
            ">
            <Sparkles className="size-3.5" />
            Shelsea campaigns
          </span>

          <h1
            className="
              mt-5 text-3xl
              font-black tracking-tight
              sm:text-5xl
            ">
            Offers worth discovering
          </h1>

          <p
            className="
              mt-3 max-w-2xl
              text-sm leading-6
              text-muted-foreground
              sm:text-base
            ">
            Explore live savings, curated edits and seasonal
            shopping experiences in one clean campaign grid.
          </p>
        </div>
      </header>

      <section className="mt-8">
        <div
          className="
            flex items-end
            justify-between gap-4
          ">
          <div>
            <p
              className="
                text-xs font-semibold
                uppercase tracking-[0.2em]
                text-muted-foreground
              ">
              All promotions
            </p>

            <h2
              className="
                mt-1 text-2xl
                font-bold tracking-tight
              ">
              Live campaigns
            </h2>
          </div>

          <span
            className="
              rounded-full
              border border-border/60
              bg-card px-3 py-1.5
              text-sm font-semibold
              text-muted-foreground
            ">
            {activePromos.length} live
          </span>
        </div>

        {activePromos.length ? (
          <div
            data-promo-destination-grid
            className="
              mt-5 grid
              grid-cols-1 gap-4
              sm:grid-cols-2
              xl:grid-cols-3
              2xl:grid-cols-4
            ">
            {activePromos.map(
              promo => {
                const promoProducts =
                  products.filter(
                    product =>
                      promo.productIds.includes(
                        product.id
                      )
                  );

                return (
                  <PromoCard
                    key={promo.id}
                    promo={promo}
                    products={promoProducts}
                    onSelect={() =>
                      openPromotion(
                        promo
                      )
                    }
                  />
                );
              }
            )}
          </div>
        ) : (
          <div
            className="
              mt-5 grid min-h-72
              place-items-center
              rounded-[2rem]
              border border-dashed
              border-border/70
              bg-muted/20
              p-8 text-center
            ">
            <div>
              <BadgePercent
                className="
                  mx-auto size-8
                  text-muted-foreground
                "
              />

              <h2
                className="
                  mt-4 text-xl
                  font-bold
                ">
                No live promotions
              </h2>

              <p
                className="
                  mt-2 text-sm
                  text-muted-foreground
                ">
                New campaigns will appear here after publication.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
