'use client';

import {
  useEffect,
  useState,
  type CSSProperties
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

import type {
  ProductType
} from '@/types/types';

type ListingProductGridProps = {
  products: ProductType[];
};

type DesktopColumns =
  | 4
  | 5;

function hubIsVisiblyOpen(
  hub:
    | HTMLElement
    | null
): boolean {
  if (!hub) {
    return false;
  }

  const rect =
    hub.getBoundingClientRect();

  const style =
    window.getComputedStyle(
      hub
    );

  return (
    rect.width >= 180 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number.parseFloat(
      style.opacity || '1'
    ) > 0.01
  );
}

/* SHELSEA_LISTING_HUB_COLUMNS_V1 */

export function ListingProductGrid({
  products
}: ListingProductGridProps) {
  const [
    desktopColumns,
    setDesktopColumns
  ] =
    useState<DesktopColumns>(
      5
    );

  useEffect(
    () => {
      let resizeObserver:
        | ResizeObserver
        | null =
        null;

      let mutationObserver:
        | MutationObserver
        | null =
        null;

      let observedHub:
        | HTMLElement
        | null =
        null;

      const synchronize =
        (): void => {
          const hub =
            document.querySelector<HTMLElement>(
              '[data-discovery-hub-panel]'
            );

          setDesktopColumns(
            hubIsVisiblyOpen(
              hub
            )
              ? 4
              : 5
          );

          if (
            hub &&
            hub !==
              observedHub
          ) {
            resizeObserver?.disconnect();

            observedHub =
              hub;

            resizeObserver =
              new ResizeObserver(
                synchronize
              );

            resizeObserver.observe(
              hub
            );

            let parent =
              hub.parentElement;

            let depth = 0;

            while (
              parent &&
              depth < 4
            ) {
              resizeObserver.observe(
                parent
              );

              parent =
                parent.parentElement;

              depth += 1;
            }
          }
        };

      synchronize();

      mutationObserver =
        new MutationObserver(
          synchronize
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

      window.addEventListener(
        'resize',
        synchronize
      );

      return () => {
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();

        window.removeEventListener(
          'resize',
          synchronize
        );
      };
    },
    []
  );

  const openProductInHub =
    (
      product: ProductType
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
            'route'
        });
      }

      previewProductInHub({
        productId:
          product.id,
        variantId:
          variant?.id ?? null,
        source:
          'route',
        reveal:
          true
      });
    };

  if (
    products.length ===
    0
  ) {
    return (
      <div
        className="
          rounded-3xl
          border border-border/70
          bg-card/55
          px-5 py-14
          text-center
          shadow-sm
        ">
        <p className="text-sm font-semibold text-foreground">
          No products are available in this listing yet.
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Shelsea will surface products here as the catalogue changes.
        </p>
      </div>
    );
  }

  const gridStyle = {
    '--shelsea-listing-columns':
      desktopColumns
  } as CSSProperties;

  return (
    <div
      data-listing-columns={
        desktopColumns
      }
      data-hub-layout={
        desktopColumns ===
        4
          ? 'hub-open'
          : 'hub-closed'
      }
      style={
        gridStyle
      }
      className="
        grid min-w-0
        grid-cols-2
        gap-3
        sm:grid-cols-3
        sm:gap-4
        lg:[grid-template-columns:repeat(var(--shelsea-listing-columns),minmax(0,1fr))]
      ">
      {products.map(
        product => (
          <ProductCard
            key={
              product.id
            }
            product={
              product
            }
            onOpenExperience={() =>
              openProductInHub(
                product
              )
            }
            onPreview={() =>
              openProductInHub(
                product
              )
            }
            className="h-full"
          />
        )
      )}
    </div>
  );
}
