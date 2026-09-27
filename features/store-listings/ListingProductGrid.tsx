'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  presentation?: 'standard' | 'compact';
  layout?: 'grid' | 'rail';
};

type DesktopColumns = 4 | 5;

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
  products,
  presentation = 'standard',
  layout = 'grid'
}: ListingProductGridProps) {
  const [desktopColumns, setDesktopColumns] = useState<DesktopColumns>(5);
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateRailControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    if (layout !== 'rail') return;
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(updateRailControls);
    observer.observe(rail);
    if (rail.firstElementChild) observer.observe(rail.firstElementChild);
    updateRailControls();
    return () => observer.disconnect();
  }, [layout, products.length, desktopColumns, updateRailControls]);

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.8, 160), behavior: 'smooth' });
  };
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
              '[data-aj-fluid-discovery-hub-width]'
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

  const cards = products.map(product => (
    <ProductCard
      presentation={presentation}
      key={product.id}
      product={product}
      onOpenExperience={() => openProductInHub(product)}
      onPreview={() => openProductInHub(product)}
      className="h-full"
    />
  ));

  if (layout === 'rail') {
    return (
      <div className="group/rail relative min-w-0" style={gridStyle}>
        <div
          ref={railRef}
          role="region"
          aria-label="Products, scroll horizontally for more"
          tabIndex={0}
          onScroll={updateRailControls}
          className={`scrollbar-none grid min-w-0 snap-x snap-proximity grid-flow-col grid-rows-1 auto-cols-[calc((100%_-_1rem)/2.5)] gap-2 overflow-x-auto sm:auto-cols-[calc((100%_-_2.25rem)/3.5)] sm:gap-3 ${desktopColumns === 4 ? 'lg:auto-cols-[calc((100%_-_3rem)/4.5)]' : 'lg:auto-cols-[calc((100%_-_3.75rem)/5.5)]'}`}>
          {cards.map(card => <div key={card.key} className="min-w-0 snap-start">{card}</div>)}
        </div>
        {canScrollLeft ? (
          <button type="button" aria-label="Scroll products left" onClick={() => scrollRail(-1)} className="absolute left-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-md opacity-0 transition-opacity hover:bg-muted focus-visible:grid focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring sm:grid sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100"><ArrowLeft className="size-4" /></button>
        ) : null}
        {canScrollRight ? (
          <button type="button" aria-label="Scroll products right" onClick={() => scrollRail(1)} className="absolute right-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-md opacity-0 transition-opacity hover:bg-muted focus-visible:grid focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring sm:grid sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100"><ArrowRight className="size-4" /></button>
        ) : null}
      </div>
    );
  }

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
        gap-2
        sm:grid-cols-3
        sm:gap-3
        lg:[grid-template-columns:repeat(var(--shelsea-listing-columns),minmax(0,1fr))]
      ">
      {cards}
    </div>
  );
}
