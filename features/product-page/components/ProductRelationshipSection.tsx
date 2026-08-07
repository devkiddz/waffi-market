'use client';

/* AJ_PRODUCT_PAGE_V2C_COMPACT_DISCOVERY_RAIL */
/* AJ_PRODUCT_PAGE_V2D_DESKTOP_RAIL_CONTROLS */
/* AJ_PRODUCT_PAGE_RELATIONSHIPS_PREVIEW_HUB_V2J */

import {
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';


import {
  ProductCard
} from '@/features/products/cards';

import {
  selectProductVariant
} from '@/features/product-experience-state';

import {
  previewProductInHub
} from '@/features/product-experience-state/hubProductPreviewBridge';

import {
  ListingViewAllLink,
  buildStoreListingHref
} from '@/features/store-listings';

import type {
  ProductType
} from '@/types/types';

import styles from './ProductRelationshipSection.module.css';

type ProductRelationshipSectionProps = {
  title: string;
  subtitle?: string;
  products: ProductType[];
};

function resolveEyebrow(
  title: string
): string {
  switch (
    title
      .trim()
      .toLowerCase()
  ) {
    case 'perfect pairings':
      return 'Complete the moment';

    case 'similar products':
      return 'Compare nearby choices';

    default:
      return 'Keep discovering';
  }
}

/* SHELSEA_PRODUCT_PAGE_HUB_AWARE_CAROUSEL_V1_1 */

function useRenderedDiscoveryHubOpen(): boolean {
  const [
    hubOpen,
    setHubOpen
  ] = useState(false);

  useEffect(() => {
    const resolveHubOpen =
      (): boolean => {
        const hub =
          document.querySelector<HTMLElement>(
            '[data-discovery-hub-panel]'
          );

        if (!hub) {
          return false;
        }

        const style =
          window.getComputedStyle(
            hub
          );

        const bounds =
          hub.getBoundingClientRect();

        return (
          !hub.hidden &&
          hub.getAttribute(
            'aria-hidden'
          ) !==
            'true' &&
          style.display !==
            'none' &&
          style.visibility !==
            'hidden' &&
          Number(
            style.opacity ||
              '1'
          ) >
            0 &&
          bounds.width >
            40 &&
          bounds.height >
            40
        );
      };

    const sync =
      (): void => {
        setHubOpen(
          resolveHubOpen()
        );
      };

    const frameId =
      window.requestAnimationFrame(
        sync
      );

    const mutationObserver =
      new MutationObserver(
        sync
      );

    mutationObserver.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden',
          'aria-hidden',
          'data-state'
        ]
      }
    );

    const resizeObserver =
      new ResizeObserver(
        sync
      );

    resizeObserver.observe(
      document.body
    );

    const hub =
      document.querySelector<HTMLElement>(
        '[data-discovery-hub-panel]'
      );

    if (hub) {
      resizeObserver.observe(
        hub
      );
    }

    window.addEventListener(
      'resize',
      sync
    );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );

      mutationObserver.disconnect();
      resizeObserver.disconnect();

      window.removeEventListener(
        'resize',
        sync
      );
    };
  }, []);

  return hubOpen;
}

export function ProductRelationshipSection({
  title,
  subtitle,
  products
}: ProductRelationshipSectionProps) {

  const hubOpen =
    useRenderedDiscoveryHubOpen();

  const railRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    canScrollBackward,
    setCanScrollBackward
  ] = useState(
    false
  );

  const [
    canScrollForward,
    setCanScrollForward
  ] = useState(
    false
  );

  const updateScrollState =
    useCallback(
      (): void => {
        const rail =
          railRef.current;

        if (!rail) {
          return;
        }

        const maximum =
          Math.max(
            0,
            rail.scrollWidth -
              rail.clientWidth
          );

        setCanScrollBackward(
          rail.scrollLeft >
            8
        );

        setCanScrollForward(
          rail.scrollLeft <
            maximum -
              8
        );
      },
      []
    );

  useEffect(() => {
    const rail =
      railRef.current;

    if (!rail) {
      return;
    }

    const frameId =
      window.requestAnimationFrame(
        updateScrollState
      );

    rail.addEventListener(
      'scroll',
      updateScrollState,
      {
        passive: true
      }
    );

    const observer =
      new ResizeObserver(
        updateScrollState
      );

    observer.observe(
      rail
    );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );

      rail.removeEventListener(
        'scroll',
        updateScrollState
      );

      observer.disconnect();
    };
  }, [
    products.length,
    updateScrollState
  ]);

  if (
    products.length ===
    0
  ) {
    return null;
  }

  const viewAllHref =
    buildStoreListingHref({
      title,
      subtitle,
      source:
        'similar',
      productIds:
        products.map(
          product =>
            product.id
        )
    });

  const previewProductFromPage =
    (
      product:
        ProductType
    ): void => {
      const variant =
        product.variants.find(
          candidate =>
            candidate.stockLeft >
            0
        ) ??
        product.variants[0];

      if (variant) {
        selectProductVariant({
          productId:
            product.id,
          variantId:
            variant.id,
          source:
            'product-page'
        });
      }

      previewProductInHub({
        productId:
          product.id,
        variantId:
          variant?.id ??
          null,
        source:
          'product-page',
        reveal:
          true
      });
    };

  const scrollProducts =
    (
      direction:
        'backward' |
        'forward'
    ): void => {
      const rail =
        railRef.current;

      if (!rail) {
        return;
      }

      const distance =
        Math.max(
          rail.clientWidth *
            0.74,
          260
        );

      rail.scrollBy({
        left:
          direction ===
          'forward'
            ? distance
            : -distance,
        behavior:
          'smooth'
      });
    };

  return (
    <section
      className={
        styles.section
      }
      aria-label={
        title
      }>
      <header
        className={
          styles.header
        }>
        <div
          className={
            styles.heading
          }>
          <span
            className={
              styles.icon
            }>
            <Sparkles className="size-4" />
          </span>

          <div
            className={
              styles.headingCopy
            }>
            <p
              className={
                styles.eyebrow
              }>
              {
                resolveEyebrow(
                  title
                )
              }
            </p>

            <h2
              className={
                styles.title
              }>
              {
                title
              }
            </h2>

            {subtitle ? (
              <p
                className={
                  styles.subtitle
                }>
                {
                  subtitle
                }
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={
            styles.headerActions
          }>
          <span
            className={
              styles.hint
            }>
            Swipe to explore

            <ArrowRight className="size-3.5" />
          </span>

          <div
            className={
              styles.desktopControls
            }
            aria-label={`${title} carousel controls`}>
            <button
              type="button"
              aria-label={`Scroll ${title} backward`}
              disabled={
                !canScrollBackward
              }
              onClick={() =>
                scrollProducts(
                  'backward'
                )
              }
              className={
                styles.scrollButton
              }>
              <ArrowLeft className="size-4" />
            </button>

            <button
              type="button"
              aria-label={`Scroll ${title} forward`}
              disabled={
                !canScrollForward
              }
              onClick={() =>
                scrollProducts(
                  'forward'
                )
              }
              className={`${styles.scrollButton} ${styles.scrollButtonPrimary}`}>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={
          railRef
        }
        data-hub-open={
          hubOpen
            ? 'true'
            : 'false'
        }
        className={
          styles.rail
        }>
        {products.map(
          product => (
            <ProductCard
              key={
                product.id
              }
              product={
                product
              }
              className={
                styles.productCard
              }
              onOpenExperience={
                previewProductFromPage
              }
              onPreview={
                previewProductFromPage
              }
            />
          )
        )}
      </div>
    </section>
  );
}
