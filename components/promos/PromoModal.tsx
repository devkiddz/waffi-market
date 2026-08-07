'use client';

/* SHELSEA_PROMO_MODAL_PRODUCT_GRID_V1 */

import Image from 'next/image';

import Link from 'next/link';

import {
  useEffect,
  useRef
} from 'react';

import {
  ArrowRight,
  Flame,
  ShieldCheck,
  Tag,
  TrendingUp,
  X
} from 'lucide-react';

import {
  Button
} from '@/components/ui/button';

import type {
  Promo
} from '@/data/promos';

import {
  useCart
} from '@/features/cart';

import {
  openCustomerProductExperience
} from '@/features/customer-experience';

import {
  ProductCard
} from '@/features/products/cards/ProductCard';

import {
  useDiscoveryHubOpen
} from '@/features/promotion/useDiscoveryHubOpen';

import type {
  ProductType
} from '@/types/types';

import {
  cn
} from '@/lib/utils';

import PromoCountdown from './PromoCountdown';

type Props = {
  promo: Promo | null;
  products: ProductType[];
  open: boolean;
  onClose: () => void;
};

export default function PromoModal({
  promo,
  products,
  open,
  onClose
}: Props) {
  const modalRef =
    useRef<HTMLDivElement>(
      null
    );

  const {
    addToCart
  } =
    useCart();

  const hubOpen =
    useDiscoveryHubOpen();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown =
      (
        event:
          KeyboardEvent
      ): void => {
        if (
          event.key ===
          'Escape'
        ) {
          onClose();
        }
      };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    open,
    onClose
  ]);

  if (
    !open ||
    !promo
  ) {
    return null;
  }

  const image =
    promo.image ??
    products[0]
      ?.variants[0]
      ?.image;

  const openProduct =
    (
      product:
        ProductType
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
    <div
      role="presentation"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      className="
        fixed inset-0
        z-[9999]
        overflow-y-auto
        bg-black/78
        px-2 py-3
        backdrop-blur-md
        sm:px-4 sm:py-6
      ">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={promo.title}
        className="
          relative mx-auto
          min-h-[88vh]
          w-full max-w-[96rem]
          overflow-hidden
          rounded-[2rem]
          border border-white/10
          bg-background
          shadow-2xl
        ">
        <button
          title="Close promotion"
          aria-label="Close promotion"
          type="button"
          onClick={onClose}
          className="
            absolute right-4
            top-4 z-50
            grid size-10
            place-items-center
            rounded-full
            border border-white/10
            bg-black/60
            text-white
            backdrop-blur-md
            transition
            hover:bg-black/80
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-white/70
            md:right-6 md:top-6
          ">
          <X className="size-5" />
        </button>

        <section
          className="
            relative min-h-[24rem]
            overflow-hidden
            md:min-h-[28rem]
          ">
          {image ? (
            <Image
              src={image}
              alt={promo.title}
              fill
              sizes="100vw"
              className="
                object-cover
                object-center
              "
              priority
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
              absolute inset-x-0
              bottom-0 h-80
              bg-gradient-to-t
              from-background
              via-background/72
              to-transparent
            "
          />

          <div
            className="
              absolute inset-y-0
              left-0 w-4/5
              bg-gradient-to-r
              from-black/82
              via-black/42
              to-transparent
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute -right-14
              -top-20
              size-72
              rounded-full
              bg-rose-500/20
              blur-3xl
            "
          />

          <div
            className="
              relative z-10
              flex min-h-[24rem]
              flex-col justify-end
              gap-6 p-5
              md:min-h-[28rem]
              md:p-8
              lg:flex-row
              lg:items-end
              lg:justify-between
            ">
            <div className="max-w-2xl">
              <div
                className="
                  mb-4 flex
                  flex-wrap
                  items-center gap-2
                ">
                <span
                  className="
                    inline-flex items-center
                    gap-2 rounded-full
                    border border-rose-300/25
                    bg-rose-500/18
                    px-3 py-1.5
                    text-xs font-bold
                    text-rose-100
                    backdrop-blur-md
                  ">
                  <Flame className="size-3.5" />
                  {promo.badge}
                </span>

                <span
                  className="
                    inline-flex items-center
                    gap-2 rounded-full
                    border border-white/12
                    bg-white/10
                    px-3 py-1.5
                    text-xs font-bold
                    capitalize
                    text-white
                    backdrop-blur-md
                  ">
                  <TrendingUp className="size-3.5" />
                  {promo.type}
                </span>
              </div>

              <h2
                className="
                  text-3xl font-black
                  tracking-tight
                  text-white
                  md:text-5xl
                ">
                {promo.title}
              </h2>

              {promo.subtitle ? (
                <p
                  className="
                    mt-3 max-w-xl
                    text-sm leading-6
                    text-white/80
                    md:text-base
                  ">
                  {promo.subtitle}
                </p>
              ) : null}
            </div>

            <div
              className="
                w-full max-w-md
                lg:max-w-sm
              ">
              <PromoCountdown
                startsAt={promo.startsAt}
                endsAt={promo.endsAt}
              />
            </div>
          </div>
        </section>

        <div
          className="
            space-y-7
            p-4
            sm:p-6
            md:p-8
          ">
          {promo.description ? (
            <div
              className="
                rounded-[1.75rem]
                border border-border/60
                bg-card/75
                p-5
                md:p-6
              ">
              <div
                className="
                  mb-3 flex
                  items-center gap-2
                ">
                <ShieldCheck
                  className="
                    size-5
                    text-rose-500
                  "
                />

                <h3
                  className="
                    text-lg font-bold
                  ">
                  Campaign details
                </h3>
              </div>

              <p
                className="
                  max-w-3xl
                  text-sm leading-7
                  text-muted-foreground
                  md:text-base
                ">
                {promo.description}
              </p>
            </div>
          ) : null}

          <div
            className="
              grid gap-3
              sm:grid-cols-3
            ">
            <div
              className="
                rounded-[1.5rem]
                border border-border/60
                bg-card/75 p-4
                sm:p-5
              ">
              <Tag
                className="
                  mb-3 size-5
                  text-rose-500
                "
              />

              <p
                className="
                  text-xl font-black
                ">
                {products.length}
              </p>

              <p
                className="
                  text-xs font-medium
                  text-muted-foreground
                ">
                Promo products
              </p>
            </div>

            <div
              className="
                rounded-[1.5rem]
                border border-border/60
                bg-card/75 p-4
                sm:p-5
              ">
              <TrendingUp
                className="
                  mb-3 size-5
                  text-rose-500
                "
              />

              <p
                className="
                  text-xl font-black
                  capitalize
                ">
                {promo.type}
              </p>

              <p
                className="
                  text-xs font-medium
                  text-muted-foreground
                ">
                Promo category
              </p>
            </div>

            <div
              className="
                rounded-[1.5rem]
                border border-border/60
                bg-card/75 p-4
                sm:p-5
              ">
              <Flame
                className="
                  mb-3 size-5
                  text-rose-500
                "
              />

              <p
                className="
                  truncate
                  text-xl font-black
                ">
                {promo.badge}
              </p>

              <p
                className="
                  text-xs font-medium
                  text-muted-foreground
                ">
                Active offer
              </p>
            </div>
          </div>

          <section>
            <div
              className="
                flex items-end
                justify-between
                gap-4
              ">
              <div>
                <p
                  className="
                    text-[10px]
                    font-semibold uppercase
                    tracking-[0.2em]
                    text-rose-500/80
                  ">
                  Included selection
                </p>

                <h3
                  className="
                    mt-1 text-2xl
                    font-black tracking-tight
                  ">
                  Products in this campaign
                </h3>

                <p
                  className="
                    mt-1 text-sm
                    text-muted-foreground
                  ">
                  Clean, aligned Shelsea commerce cards with Hub-first interaction.
                </p>
              </div>

              <span
                className="
                  shrink-0
                  text-xs
                  text-muted-foreground
                ">
                {products.length}
              </span>
            </div>

            {products.length ? (
              <div
                data-promo-modal-product-grid
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
                {products.map(
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
                  mt-5 rounded-[1.75rem]
                  border border-dashed
                  border-border/70
                  bg-muted/20
                  p-8 text-center
                  text-sm
                  text-muted-foreground
                ">
                No products are currently attached to this promotion.
              </div>
            )}
          </section>

          <section
            className="
              rounded-[1.75rem]
              border border-border/60
              bg-card/75
              p-5
              md:p-6
            ">
            <h3
              className="
                text-lg font-bold
              ">
              Promo terms
            </h3>

            {promo.terms?.length ? (
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

                      <span>
                        {term}
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p
                className="
                  mt-2 text-sm
                  leading-6
                  text-muted-foreground
                ">
                Promo availability may depend on stock,
                selected variants and the active campaign duration.
              </p>
            )}
          </section>
        </div>

        <footer
          className="
            sticky bottom-0
            z-40 flex
            flex-col gap-3
            border-t
            border-border/60
            bg-background/95
            p-4
            backdrop-blur-xl
            sm:flex-row
            sm:items-center
            sm:justify-between
            md:p-5
          ">
          <Button
            variant="outline"
            onClick={onClose}
            className="
              rounded-full
            ">
            Continue shopping
          </Button>

          <Link
            href={`/promos/${promo.slug}`}
            className="
              inline-flex
            ">
            <Button
              className="
                w-full gap-2
                rounded-full
                bg-rose-500
                text-white
                hover:bg-rose-600
                sm:w-auto
              ">
              View full campaign
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
