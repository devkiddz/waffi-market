'use client';

/* AJ_PRODUCT_PAGE_V2C_PREMIUM_DETAILS */

import Image from 'next/image';
import Link from 'next/link';

import {
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  Layers3,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck
} from 'lucide-react';

import {
  ProductReviewsSection
} from '@/features/reviews/components/ProductReviewsSection';

import type {
  ProductPageData
} from '../contracts';

import styles from './ProductPageDetails.module.css';

function formatLabel(
  value: string
): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );
}

export function ProductPageDetails({
  data
}: {
  data: ProductPageData;
}) {
  const {
    product,
    category,
    brand,
    reviews
  } = data;

  const visibleTags =
    (product.tags ?? [])
      .filter(
        tag =>
          !tag.includes(':')
      )
      .slice(
        0,
        14
      );

  const totalStock =
    product.variants.reduce(
      (
        total,
        variant
      ) =>
        total +
        Math.max(
          0,
          variant.stockLeft
        ),
      0
    );

  const availableVariants =
    product.variants.filter(
      variant =>
        variant.stockLeft >
        0
    ).length;

  const numberFormatter =
    new Intl.NumberFormat(
      data.locale || 'en-NG',
      {
        notation:
          'compact',
        maximumFractionDigits:
          1
      }
    );

  const merchantName =
    product.merchant?.name ??
    data.workspace.name ??
    'Shelsea';

  const categoryDescription =
    category.description ??
    category.shortDescription ??
    `Explore more selections from ${category.label}.`;

  return (
    <div
      className={
        styles.detailsRoot
      }>
      <section
        id="product-details"
        className={
          styles.storyLayout
        }>
        <article
          className={
            styles.storyCard
          }>
          <div
            className={
              styles.sectionHeading
            }>
            <span
              className={
                styles.headingIcon
              }>
              <Sparkles className="size-4" />
            </span>

            <div>
              <p
                className={
                  styles.sectionEyebrow
                }>
                Inside the product
              </p>

              <h2
                className={
                  styles.sectionTitle
                }>
                The story behind this selection
              </h2>
            </div>
          </div>

          <p
            className={
              styles.storyCopy
            }>
            {product.longDescription?.trim() ||
              product.shortDescription?.trim() ||
              'Detailed editorial information has not yet been added for this product.'}
          </p>

          {brand ? (
            <div
              className={
                styles.brandNote
              }>
              <div
                className={
                  styles.brandIdentity
                }>
                {brand.logo ? (
                  <span
                    className={
                      styles.brandLogo
                    }>
                    <Image
                      src={
                        brand.logo
                      }
                      alt={
                        brand.name
                      }
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </span>
                ) : (
                  <span
                    className={
                      styles.brandLogoFallback
                    }>
                    <BadgeCheck className="size-4" />
                  </span>
                )}

                <div>
                  <p
                    className={
                      styles.microLabel
                    }>
                    Brand
                  </p>

                  <p
                    className={
                      styles.brandName
                    }>
                    {
                      brand.name
                    }
                  </p>
                </div>
              </div>

              {brand.description ? (
                <p
                  className={
                    styles.brandDescription
                  }>
                  {
                    brand.description
                  }
                </p>
              ) : null}
            </div>
          ) : null}
        </article>

        <aside
          className={
            styles.snapshotCard
          }>
          <p
            className={
              styles.sectionEyebrow
            }>
            At a glance
          </p>

          <h2
            className={
              styles.snapshotTitle
            }>
            The essentials, without the noise
          </h2>

          <dl
            className={
              styles.snapshotList
            }>
            <div
              className={
                styles.snapshotItem
              }>
              <dt>
                <TrendingUp className="size-4" />

                Customer demand
              </dt>

              <dd>
                {product.soldCount >
                0
                  ? `${numberFormatter.format(product.soldCount)} sold`
                  : 'New to the catalog'}
              </dd>
            </div>

            <div
              className={
                styles.snapshotItem
              }>
              <dt>
                <Layers3 className="size-4" />

                Available options
              </dt>

              <dd>
                {availableVariants} of {
                  product.variants.length
                }
              </dd>
            </div>

            <div
              className={
                styles.snapshotItem
              }>
              <dt>
                <PackageCheck className="size-4" />

                Live availability
              </dt>

              <dd>
                {totalStock >
                0
                  ? `${numberFormatter.format(totalStock)} units`
                  : 'Unavailable'}
              </dd>
            </div>

            <div
              className={
                styles.snapshotItem
              }>
              <dt>
                <CalendarClock className="size-4" />

                Delivery estimate
              </dt>

              <dd>
                {
                  product.estimatedDelivery ||
                  'Calculated at checkout'
                }
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section
        className={
          styles.informationLayout
        }>
        <article
          className={
            styles.factsCard
          }>
          <div
            className={
              styles.sectionHeading
            }>
            <span
              className={
                styles.headingIcon
              }>
              <Tag className="size-4" />
            </span>

            <div>
              <p
                className={
                  styles.sectionEyebrow
                }>
                Product information
              </p>

              <h2
                className={
                  styles.sectionTitle
                }>
                Everything important, clearly arranged
              </h2>
            </div>
          </div>

          <dl
            className={
              styles.factGrid
            }>
            <div
              className={
                styles.factItem
              }>
              <dt>
                Category
              </dt>

              <dd>
                {
                  category.label
                }
              </dd>
            </div>

            <div
              className={
                styles.factItem
              }>
              <dt>
                Subcategory
              </dt>

              <dd>
                {product.subcategory
                  ? formatLabel(
                      product.subcategory
                    )
                  : 'General selection'}
              </dd>
            </div>

            <div
              className={
                styles.factItem
              }>
              <dt>
                Brand
              </dt>

              <dd>
                {
                  brand?.name ??
                  'Independent selection'
                }
              </dd>
            </div>

            <div
              className={
                styles.factItem
              }>
              <dt>
                Sold by
              </dt>

              <dd>
                {
                  merchantName
                }
              </dd>
            </div>

            <div
              className={
                styles.factItem
              }>
              <dt>
                Delivery
              </dt>

              <dd>
                {
                  product.estimatedDelivery ||
                  'Calculated at checkout'
                }
              </dd>
            </div>

            <div
              className={
                styles.factItem
              }>
              <dt>
                Status
              </dt>

              <dd>
                {totalStock >
                0
                  ? 'Available now'
                  : 'Currently unavailable'}
              </dd>
            </div>
          </dl>

          {visibleTags.length >
          0 ? (
            <div
              className={
                styles.characteristics
              }>
              <p
                className={
                  styles.microLabel
                }>
                Characteristics
              </p>

              <div
                className={
                  styles.tagList
                }>
                {visibleTags.map(
                  tag => (
                    <span
                      key={
                        tag
                      }
                      className={
                        styles.tag
                      }>
                      {
                        formatLabel(
                          tag
                        )
                      }
                    </span>
                  )
                )}
              </div>
            </div>
          ) : null}
        </article>

        <article
          className={
            styles.categoryCard
          }>
          {category.coverImage ? (
            <Image
              src={
                category.coverImage
              }
              alt=""
              fill
              sizes="(max-width: 832px) 100vw, 34vw"
              className={
                styles.categoryCover
              }
            />
          ) : null}

          <div
            className={
              styles.categoryShade
            }
          />

          <div
            className={
              styles.categoryContent
            }>
            <span
              className={
                styles.categoryIcon
              }>
              <Store className="size-4" />
            </span>

            <p
              className={
                styles.categoryEyebrow
              }>
              Explore the collection
            </p>

            <h2
              className={
                styles.categoryTitle
              }>
              {
                category.label
              }
            </h2>

            <p
              className={
                styles.categoryDescription
              }>
              {
                categoryDescription
              }
            </p>

            <Link
              href={`/store?category=${encodeURIComponent(category.slug)}`}
              className={
                styles.categoryAction
              }>
              Browse {
                category.label
              }
            </Link>
          </div>
        </article>
      </section>

      {product.merchant ? (
        <section
          className={
            styles.merchantCard
          }>
          <div
            className={
              styles.merchantIdentity
            }>
            <span
              className={
                styles.merchantLogo
              }>
              {product.merchant.logoUrl ? (
                <Image
                  src={
                    product.merchant.logoUrl
                  }
                  alt={
                    product.merchant.name
                  }
                  fill
                  sizes="56px"
                  className="object-contain p-1.5"
                />
              ) : (
                <ShoppingBag className="size-5" />
              )}
            </span>

            <div
              className={
                styles.merchantCopy
              }>
              <p
                className={
                  styles.sectionEyebrow
                }>
                Verified Shelsea merchant
              </p>

              <h2
                className={
                  styles.merchantName
                }>
                {
                  product.merchant.name
                }
              </h2>

              <p>
                Discover more published products, collections and campaigns from this storefront.
              </p>
            </div>
          </div>

          <Link
            href={`/shops/${encodeURIComponent(product.merchant.slug)}`}
            className={
              styles.merchantAction
            }>
            Visit storefront
          </Link>
        </section>
      ) : null}

      <div
        className={
          styles.reviewsShell
        }>
        <ProductReviewsSection
          productId={
            product.id
          }
          data={
            reviews
          }
        />
      </div>

      <section
        className={
          styles.confidenceSection
        }>
        <div
          className={
            styles.confidenceHeading
          }>
          <p
            className={
              styles.sectionEyebrow
            }>
            Connected commerce
          </p>

          <h2
            className={
              styles.sectionTitle
            }>
            Confidence from selection to delivery
          </h2>
        </div>

        <div
          className={
            styles.confidenceGrid
          }>
          <article
            className={
              styles.confidenceCard
            }>
            <span>
              <CircleCheck className="size-4" />
            </span>

            <div>
              <h3>
                Live inventory sync
              </h3>

              <p>
                Price, variant and stock signals stay connected to the active workspace.
              </p>
            </div>
          </article>

          <article
            className={
              styles.confidenceCard
            }>
            <span>
              <Truck className="size-4" />
            </span>

            <div>
              <h3>
                Tracked fulfillment
              </h3>

              <p>
                Eligible orders remain visible from confirmation through live delivery tracking.
              </p>
            </div>
          </article>

          <article
            className={
              styles.confidenceCard
            }>
            <span>
              <ShieldCheck className="size-4" />
            </span>

            <div>
              <h3>
                Shared customer state
              </h3>

              <p>
                Cart, wishlist and Shopping Lists remain synchronized across Shelsea.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
