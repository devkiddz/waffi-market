'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  Truck
} from 'lucide-react';

import {
  cn
} from '@/lib/utils';

import type {
  BaseProductCardProps
} from './productCardTypes';

import {
  openProductExperience
} from './productCardPresentation';

import {
  PremiumCardSurface
} from './PremiumCardSurface';

import {
  ProductActionTray
} from './ProductActionTray';

import {
  useProductVariant
} from './useProductVariant';

const priceFormatter =
  new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }
  );

function resolveOriginalPrice(
  currentPrice: number,
  discountPercentage: number
): number | null {
  if (
    discountPercentage <= 0 ||
    discountPercentage >= 100
  ) {
    return null;
  }

  return (
    currentPrice /
    (
      1 -
      discountPercentage /
        100
    )
  );
}

function formatCompactCount(
  value: number
): string {
  if (
    value >= 1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(
      value >= 10_000_000
        ? 0
        : 1
    )}M`;
  }

  if (
    value >= 1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(
      value >= 10_000
        ? 0
        : 1
    )}K`;
  }

  return String(
    value
  );
}

/* SHELSEA_PRODUCT_CARD_MATURE_V3_1 */
/* SHELSEA_PRODUCT_IMAGE_HOVER_HIGHLIGHT_V1 */

export function ProductCard({
  product,
  presentation = 'standard',
  className,
  onOpenExperience,
  onPreview,
  onAddToCart,
  onAskAI
}: BaseProductCardProps) {
  const {
    selectedVariant
  } =
    useProductVariant(
      product
    );

  if (!selectedVariant) {
    return null;
  }

  const featured =
    presentation === 'featured';

  const originalPrice =
    resolveOriginalPrice(
      selectedVariant.price,
      product.discountPercentage
    );

  const savedAmount =
    originalPrice
      ? Math.max(
          0,
          originalPrice -
            selectedVariant.price
        )
      : 0;

  const commerceLabel =
    product.soldCount >= 250
      ? 'Best seller'
      : product.isNew
        ? 'New arrival'
        : product.featured
          ? 'Shelsea pick'
          : null;

  const openExperience =
    (): void => {
      openProductExperience({
        product,
        onOpenExperience,
        onPreview
      });
    };

  return (
    <PremiumCardSurface
      glowSize={
        featured
          ? 250
          : 190
      }
      className={cn(
        `
          group relative flex
          w-full min-w-0
          flex-col overflow-hidden
          rounded-[1.2rem]
          border
          border-border/55
          bg-card
          p-1.5
          shadow-[0_10px_28px_rgba(8,18,36,0.08)]
          transition
          duration-300
          hover:-translate-y-0.5
          hover:border-[#C8A45D]/35
          hover:shadow-[0_18px_42px_rgba(22,59,115,0.13)]
        `,
        featured && [
          'border-[#C8A45D]/35',
          'shadow-[0_18px_44px_rgba(22,59,115,0.13)]'
        ],
        className
      )}>
      <button
        type="button"
        onClick={
          openExperience
        }
        aria-label={`Open ${product.name}`}
        className="
          relative block
          aspect-[4/5]
          w-full overflow-hidden
          rounded-[0.95rem]
          text-left
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#C8A45D]/60
        ">
        <Image
          src={
            selectedVariant.image
          }
          alt=""
          fill
          sizes="
            (max-width: 640px) 45vw,
            (max-width: 768px) 190px,
            (max-width: 1280px) 216px,
            232px
          "
          className="
            scale-110 object-cover
            opacity-16 blur-2xl
            saturate-110
          "
        />

        <Image
          src={
            selectedVariant.image
          }
          alt={
            product.name
          }
          fill
          sizes="
            (max-width: 640px) 45vw,
            (max-width: 768px) 190px,
            (max-width: 1280px) 216px,
            232px
          "
          className="
            relative z-10
            object-cover
            object-center
            transition-[transform,filter]
            duration-500
            ease-out
            group-hover:scale-[1.02]
            group-hover:saturate-[1.12]
            group-hover:brightness-[1.045]
            group-hover:contrast-[1.025]
          "
        />

        <div
          aria-hidden="true"
          className="
            absolute inset-x-0
            bottom-0 z-20
            h-20
            bg-gradient-to-t
            from-[#4C0519]/18
            to-transparent
          "
        />

        {commerceLabel ? (
          <span
            className="
              absolute left-2
              top-2 z-30
              rounded-full
              border border-white/20
              bg-[#4C0519]/66
              px-2.5 py-1
              text-[0.62rem]
              font-semibold
              tracking-[0.01em]
              text-white
              shadow-md
              backdrop-blur-lg
            ">
            {commerceLabel}
          </span>
        ) : null}

        {originalPrice ? (
          <span
            className="
              absolute right-2
              top-2 z-30
              rounded-full
              border border-white/20
              bg-[#F43F5E]/92
              px-2.5 py-1
              text-[0.64rem]
              font-semibold
              text-white
              shadow-md
              backdrop-blur-lg
            ">
            -{product.discountPercentage}%
          </span>
        ) : null}
      </button>

      <div
        className="
          flex min-w-0
          flex-1 flex-col
          px-1.5 pb-1.5 pt-2.5
        ">
        <button
          type="button"
          onClick={
            openExperience
          }
          className="
            block min-w-0
            max-w-full
            text-left
          ">
          <h3
            title={
              product.name
            }
            className="
              line-clamp-2
              min-h-[2.3rem]
              text-[0.84rem]
              font-semibold
              leading-[1.15rem]
              tracking-[-0.012em]
              text-foreground
            ">
            {product.name}
          </h3>
        </button>

        <div
          className="
            mt-0.5 flex min-w-0
            flex-wrap items-baseline
            gap-x-2 gap-y-1
          ">
          <span
            className="
              text-[0.96rem]
              font-semibold
              leading-none
              tracking-[-0.025em]
              text-foreground
            ">
            {priceFormatter.format(
              selectedVariant.price
            )}
          </span>

          {originalPrice ? (
            <span
              className="
                text-[0.66rem]
                font-medium
                leading-none
                text-muted-foreground/80
                line-through
                decoration-[#F43F5E]/65
              ">
              {priceFormatter.format(
                originalPrice
              )}
            </span>
          ) : null}

          {savedAmount > 0 ? (
            <span
              className="
                whitespace-nowrap
                text-[0.64rem]
                font-semibold
                leading-none
                text-[#E11D48]
                dark:text-[#FB7185]
              ">
              Save{' '}
              {priceFormatter.format(
                savedAmount
              )}
            </span>
          ) : null}
        </div>

        <div
          data-shelsea-product-card-accent-divider
          aria-hidden="true"
          className="
            my-2 h-px
            w-full
            bg-gradient-to-r
            from-[#F43F5E]/48
            via-[#C8A45D]/72
            to-[#BE123C]/48
          "
        />

        <div
          className="
            flex min-w-0
            items-center
            justify-between
            gap-2
          ">
          <div
            className="
              flex min-w-0
              items-center gap-1.5
              text-[0.66rem]
              font-medium
              text-muted-foreground
            ">
            <span
              className="
                inline-flex
                items-center gap-1
                text-foreground/82
              ">
              <span
                aria-hidden="true"
                className="text-[#C8A45D]">
                ★
              </span>

              {product.rating.toFixed(
                1
              )}
            </span>

            {product.reviews > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="
                    size-0.5
                    rounded-full
                    bg-muted-foreground/40
                  "
                />

                <span>
                  {formatCompactCount(
                    product.reviews
                  )}{' '}
                  {product.reviews === 1
                    ? 'review'
                    : 'reviews'}
                </span>
              </>
            ) : null}
          </div>

          <span
            className="
              inline-flex shrink-0
              items-center gap-1
              text-[0.62rem]
              font-medium
              text-muted-foreground/80
            ">
            <Truck
              className="
                size-3.5
                text-[#C8A45D]
              "
            />

            {product.estimatedDelivery}
          </span>
        </div>

        {product.merchant ? (
          <Link
            href={`/shops/${encodeURIComponent(product.merchant.slug)}`}
            onClick={
              event =>
                event.stopPropagation()
            }
            className="
              mt-1.5 block
              truncate
              text-[0.62rem]
              font-medium
              text-muted-foreground/80
              transition
              hover:text-[#E11D48]
            ">
            Sold by{' '}
            <span className="font-semibold text-foreground/80">
              {product.merchant.name}
            </span>
          </Link>
        ) : null}

        <ProductActionTray
          product={
            product
          }
          variant={
            selectedVariant
          }
          onAddToCart={
            onAddToCart
          }
          onAskAI={
            onAskAI
          }
          presentation="inline"
          compact
          compactCart
          cartLabelOnly
          className="
            mt-2 w-full
            justify-between
            rounded-lg
            border border-border/55
            bg-muted/18
            p-0.5
            shadow-none
            backdrop-blur-none

            [&_button:first-child]:h-7
            [&_button:first-child]:min-w-0
            [&_button:first-child]:px-2
            [&_button:first-child]:text-[0.62rem]
            [&_button:first-child]:font-medium
          "
        />
      </div>
    </PremiumCardSurface>
  );
}
