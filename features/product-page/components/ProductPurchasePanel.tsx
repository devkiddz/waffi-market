'use client';

/* AJ_PRODUCT_PAGE_V2A2_COMPACT_PURCHASE_PANEL */
/* AJ_PRODUCT_PAGE_V2A2_TRUST_FOOTER_AND_COMPACT_ACTIONS */

import Link from 'next/link';

import {
  BadgeCheck,
  PackageCheck,
  Share2,
  Sparkles,
  Star,
  Store,
  Truck
} from 'lucide-react';

import {
  Button
} from '@/components/ui/button';

import {
  openProductDeepInsight
} from '@/features/product-intelligence';

import {
  ProductActionTray
} from '@/features/products/cards';

import {
  cn
} from '@/lib/utils';

import type {
  ProductPageData
} from '../contracts';

import styles from './ProductPageExperience.module.css';

type ProductPurchasePanelProps = {
  data: ProductPageData;
  selectedVariantId?: string;
  onSelectVariant: (
    variantId: string
  ) => void;
  onShare: () => void;
  shareFeedback?: string | null;
};

export function ProductPurchasePanel({
  data,
  selectedVariantId,
  onSelectVariant,
  onShare,
  shareFeedback
}: ProductPurchasePanelProps) {
  const {
    product,
    category,
    brand,
    currency,
    locale
  } = data;

  const selectedVariant =
    product.variants.find(
      variant =>
        variant.id ===
        selectedVariantId
    ) ??
    product.variants[0];

  const priceFormatter =
    new Intl.NumberFormat(
      locale,
      {
        style:
          'currency',
        currency,
        maximumFractionDigits:
          0
      }
    );
  const originalSelectedVariantPrice =
    selectedVariant &&
    product.discountPercentage > 0 &&
    product.discountPercentage < 100
      ? selectedVariant.price /
        (
          1 -
          product.discountPercentage /
            100
        )
      : null;


  const inStock =
    Boolean(
      selectedVariant &&
      selectedVariant.stockLeft >
      0
    );

  const lowStock =
    Boolean(
      selectedVariant &&
      selectedVariant.stockLeft >
      0 &&
      selectedVariant.stockLeft <=
      5
    );

  const hasReviews =
    product.reviews >
    0;

  const merchantName =
    product.merchant?.name ??
    'Shelsea';

  const openDeepInsight =
    (): void => {
      openProductDeepInsight({
        productId:
          product.id,
        variantId:
          selectedVariant?.id ??
          null,
        source:
          'product-page'
      });
    };

  const merchantIdentity = (
    <>
      <span
        className={
          styles.merchantLogo
        }>
        {product.merchant?.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={
              product.merchant.logoUrl
            }
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <Store className="size-3.5" />
        )}
      </span>

      <span
        className={
          styles.merchantText
        }>
        Sold by
        {' '}
        <strong>
          {
            merchantName
          }
        </strong>
      </span>

      <BadgeCheck className="size-3.5 shrink-0 text-accent" />
    </>
  );

  return (
    <section
      className={
        styles.purchasePanel
      }>
      <div
        className={
          styles.purchaseGlow
        }
        style={
          category.accentColor
            ? {
                background:
                  `radial-gradient(circle at 100% 0%, ${category.accentColor}42, transparent 48%)`
              }
            : undefined
        }
      />

      <div
        className={
          styles.purchaseContent
        }>
        <div
          className={
            styles.panelMetaRow
          }>
          <p
            className={
              styles.eyebrow
            }>
            <span>
              {
                category.label
              }
            </span>

            {brand ? (
              <>
                <span aria-hidden>
                  ·
                </span>

                <span>
                  {
                    brand.name
                  }
                </span>
              </>
            ) : null}
          </p>

          {product.discountPercentage >
          0 ? (
            <span
              className={
                styles.discountPill
              }>
              Save
              {' '}
              {
                product.discountPercentage
              }
              %
            </span>
          ) : product.isNew ? (
            <span
              className={
                styles.discountPill
              }>
              New arrival
            </span>
          ) : null}
        </div>

        <h1
          className={
            styles.productTitle
          }>
          {
            product.name
          }
        </h1>

        {product.shortDescription ? (
          <p
            className={
              styles.productSummary
            }>
            {
              product.shortDescription
            }
          </p>
        ) : null}

        <div
          className={
            styles.signalRow
          }>
          <a
            href={`#product-reviews-${product.id}`}
            className={
              styles.signalPill
            }>
            <Star
              className={cn(
                'size-3.5 text-amber-300',
                hasReviews &&
                  'fill-amber-300'
              )}
            />

            <span>
              {hasReviews
                ? product.rating.toFixed(
                    1
                  )
                : 'New'}
            </span>

            <span
              className={
                styles.signalMuted
              }>
              {hasReviews
                ? product.reviews ===
                  1
                  ? '1 review'
                  : `${product.reviews} reviews`
                : 'No reviews yet'}
            </span>
          </a>

          <span
            className={cn(
              styles.availabilityPill,
              inStock
                ? lowStock
                  ? styles.availabilityLow
                  : styles.availabilityReady
                : styles.availabilityUnavailable
            )}>
            {inStock
              ? lowStock
                ? `Only ${selectedVariant?.stockLeft} left`
                : 'In stock'
              : 'Unavailable'}
          </span>
        </div>

        <div
          className={
            styles.purchaseCore
          }>
          <div
            className={
              styles.priceRow
            }>
            <div className="min-w-0">
              <p
                className={
                  styles.sectionLabel
                }>
                Price
              </p>

              <div
                className={
                  styles.priceDisplay
                }>
                <p
                  className={
                    styles.price
                  }>
                  {selectedVariant
                    ? priceFormatter.format(
                        selectedVariant.price
                      )
                    : 'Unavailable'}
                </p>

                {originalSelectedVariantPrice ? (
                  <div
                    className={
                      styles.priceComparison
                    }>
                    <span
                      className={
                        styles.originalPrice
                      }>
                      {priceFormatter.format(
                        originalSelectedVariantPrice
                      )}
                    </span>

                    <span
                      className={
                        styles.savingCopy
                      }>
                      Save{' '}
                      {
                        product.discountPercentage
                      }
                      %
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className={
                styles.selectedOption
              }>
              <span>
                Selected option
              </span>

              <strong>
                {selectedVariant?.label ??
                  'Unavailable'}
              </strong>
            </div>
          </div>

          <div
            className={
              styles.sectionBlock
            }>
            <p
              className={
                styles.sectionLabel
              }>
              Choose your option
            </p>

            <div
              className={
                styles.variantGrid
              }>
              {product.variants.map(
                variant => {
                  const active =
                    variant.id ===
                    selectedVariant?.id;

                  const unavailable =
                    variant.stockLeft <=
                    0;

                  return (
                    <button
                      key={
                        variant.id
                      }
                      type="button"
                      disabled={
                        unavailable
                      }
                      aria-pressed={
                        active
                      }
                      onClick={() =>
                        onSelectVariant(
                          variant.id
                        )
                      }
                      className={cn(
                        styles.variantButton,
                        active &&
                          styles.variantActive
                      )}>
                      <span className="block truncate font-bold">
                        {
                          variant.label
                        }
                      </span>

                      <span
                        className={
                          styles.variantPrice
                        }>
                        {unavailable
                          ? 'Unavailable'
                          : priceFormatter.format(
                              variant.price
                            )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <ProductActionTray
            product={
              product
            }
            variant={
              selectedVariant
            }
            presentation="inline"
            compact
            cartLabelOnly
            className={
              styles.actionTray
            }
          />

          <div
            className={
              styles.secondaryActions
            }>
            <Button
              type="button"
              variant="outline"
              onClick={
                openDeepInsight
              }
              className={
                styles.secondaryButton
              }>
              <Sparkles className="size-3.5" />

              <span className="truncate">
                Ask Shelsea about this product
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={
                onShare
              }
              className={
                styles.secondaryButton
              }>
              <Share2 className="size-3.5" />

              Share
            </Button>
          </div>

          {shareFeedback ? (
            <p
              role="status"
              className={
                styles.shareFeedback
              }>
              {
                shareFeedback
              }
            </p>
          ) : null}
        </div>

        <div
          className={
            styles.assuranceRow
          }>
          {product.merchant ? (
            <Link
              href={`/shops/${encodeURIComponent(product.merchant.slug)}`}
              className={cn(
                styles.assuranceItem,
                styles.assuranceMerchant
              )}>
              {
                merchantIdentity
              }
            </Link>
          ) : (
            <div
              className={cn(
                styles.assuranceItem,
                styles.assuranceMerchant
              )}>
              {
                merchantIdentity
              }
            </div>
          )}

          <div
            className={
              styles.assuranceItem
            }>
            <PackageCheck className="size-3.5 shrink-0 text-accent" />

            <span>
              Live catalog availability
            </span>
          </div>

          <div
            className={
              styles.assuranceItem
            }>
            <Truck className="size-3.5 shrink-0 text-accent" />

            <span>
              Live delivery tracking
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
