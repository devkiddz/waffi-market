'use client';

/* AJ_PRODUCT_PAGE_EXPERIENCE_V2A_FLUID_UI */
/* AJ_PRODUCT_PAGE_V2A2_RCENTZ_CINEMATIC_HERO */
/* AJ_PRODUCT_PAGE_SYNCHRONIZES_HUB_V1 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ChevronRight,
  Home
} from 'lucide-react';

import {
  recordProductView
} from '@/features/product-activity';

import {
  selectProductVariant,
  useProductVariantSelection
} from '@/features/product-experience-state';

import {
  previewProductInHub
} from '@/features/product-experience-state/hubProductPreviewBridge';

import type {
  ProductPageData
} from '../contracts';

import {
  ProductPageDetails
} from './ProductPageDetails';

import {
  ProductPageGallery
} from './ProductPageGallery';

import {
  ProductPageMobileBar
} from './ProductPageMobileBar';

import {
  ProductPurchasePanel
} from './ProductPurchasePanel';

import {
  ProductRelationshipSection
} from './ProductRelationshipSection';

import styles from './ProductPageExperience.module.css';

export function ProductPageExperience({
  data
}: {
  data: ProductPageData;
}) {
  const {
    product
  } = data;

  const sharedSelection =
    useProductVariantSelection(
      product.id
    );

  const defaultVariant =
    useMemo(
      () =>
        product.variants.find(
          variant =>
            variant.stockLeft >
            0
        ) ??
        product.variants[0],
      [
        product.variants
      ]
    );

  const selectedVariant =
    product.variants.find(
      variant =>
        variant.id ===
        sharedSelection?.variantId
    ) ??
    defaultVariant;

  const [
    shareFeedback,
    setShareFeedback
  ] = useState<
    string |
    null
  >(
    null
  );

  useEffect(() => {
    if (!defaultVariant) {
      return;
    }

    const selectionIsValid =
      Boolean(
        sharedSelection &&
        product.variants.some(
          variant =>
            variant.id ===
            sharedSelection.variantId
        )
      );

    if (selectionIsValid) {
      return;
    }

    selectProductVariant({
      productId:
        product.id,
      variantId:
        defaultVariant.id,
      source:
        'product-page'
    });
  }, [
    defaultVariant,
    product.id,
    product.variants,
    sharedSelection
  ]);

  useEffect(() => {
    void recordProductView({
      productId:
        product.id
    });
  }, [
    product.id
  ]);

  /**
   * The canonical Product Page synchronizes the Hub preview without
   * forcing the mobile Hub open. The page route remains the authority
   * for the full experience while the Hub mirrors its active product
   * and variant.
   */
  useEffect(() => {
    previewProductInHub({
      productId:
        product.id,

      variantId:
        selectedVariant?.id ??
        null,

      source:
        'product-page',

      reveal:
        false
    });
  }, [
    product.id,
    selectedVariant?.id
  ]);

  const handleSelectVariant =
    (
      variantId:
        string
    ): void => {
      selectProductVariant({
        productId:
          product.id,
        variantId,
        source:
          'product-page'
      });
    };

  const handleShare =
    async (): Promise<void> => {
      const url =
        window.location.href;

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              product.name,
            text:
              product.shortDescription,
            url
          });

          setShareFeedback(
            'Product shared.'
          );

          return;
        }

        await navigator.clipboard
          .writeText(
            url
          );

        setShareFeedback(
          'Product link copied.'
        );
      } catch {
        setShareFeedback(
          'Sharing was cancelled.'
        );
      }
    };

  const heroStyle = {
    '--product-accent':
      data.category.accentColor ??
      'var(--accent)'
  } as CSSProperties;

  return (
    <main
      data-aj-product-page-root
      className={
        styles.page
      }>
      <div
        className={
          styles.inner
        }>
        <nav
          aria-label="Breadcrumb"
          className={
            styles.breadcrumb
          }>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 transition hover:text-foreground">
            <Home className="size-3.5" />
            Home
          </Link>

          <ChevronRight className="size-3 shrink-0" />

          <Link
            href="/store"
            className="shrink-0 transition hover:text-foreground">
            Store
          </Link>

          <ChevronRight className="size-3 shrink-0" />

          <Link
            href={`/store?category=${encodeURIComponent(data.category.slug)}`}
            className="shrink-0 transition hover:text-foreground">
            {
              data.category.label
            }
          </Link>

          <ChevronRight className="size-3 shrink-0" />

          <span className="truncate font-semibold text-foreground">
            {
              product.name
            }
          </span>
        </nav>

        <section
          data-aj-product-cinematic-hero
          className={
            styles.hero
          }
          style={
            heroStyle
          }>
          <div
            className={
              styles.heroBase
            }
          />

          {data.category.coverImage ? (
            <Image
              src={
                data.category.coverImage
              }
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 78vw"
              className={
                styles.heroCover
              }
            />
          ) : null}

          <div
            className={
              styles.heroShade
            }
          />

          <div
            className={
              styles.heroGlow
            }
          />

          <div
            className={
              styles.heroContent
            }>
            <ProductPageGallery
              product={
                product
              }
              selectedVariantId={
                selectedVariant?.id
              }
            />

            <div
              className={
                styles.purchaseColumn
              }>
              <ProductPurchasePanel
                data={
                  data
                }
                selectedVariantId={
                  selectedVariant?.id
                }
                onSelectVariant={
                  handleSelectVariant
                }
                onShare={() => {
                  void handleShare();
                }}
                shareFeedback={
                  shareFeedback
                }
              />
            </div>
          </div>
        </section>

        <div
          className={
            styles.contentSection
          }>
          <ProductPageDetails
            data={
              data
            }
          />
        </div>

        <div
          className={
            styles.relationships
          }>
          <ProductRelationshipSection
            title="Perfect Pairings"
            subtitle={`Selections explicitly matched with ${product.name}.`}
            products={
              data.relationships.pairings
            }
          />

          <ProductRelationshipSection
            title="Similar Products"
            subtitle="More selections from the same category with related style, character and customer signals."
            products={
              data.relationships.similar
            }
          />

          <ProductRelationshipSection
            title="Continue Discovering"
            subtitle="Keep exploring strong selections across the active Shelsea catalog."
            products={
              data.relationships.continueDiscovery
            }
          />
        </div>

        <ProductPageMobileBar
          product={
            product
          }
          variant={
            selectedVariant
          }
          locale={
            data.locale
          }
          currency={
            data.currency
          }
        />
      </div>
    </main>
  );
}
