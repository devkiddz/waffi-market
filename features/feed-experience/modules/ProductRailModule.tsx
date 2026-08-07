'use client';

import {
  useRef
} from 'react';

import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import {
  Button
} from '@/components/ui/button';

import {
  ProductCard
} from '@/features/products/cards';

import {
  EXPERIENCE_PRODUCT_ITEM_CLASS,
  EXPERIENCE_PRODUCT_RAIL_CLASS,
  getProductRailScrollStep
} from '@/features/products/productRailPresentation';

import {
  ListingViewAllLink,
  buildStoreListingHref
} from '@/features/store-listings';

import {
  cn
} from '@/lib/utils';

import type {
  FeedActions,
  ProductRailModuleDefinition
} from '../contracts';

type ProductRailModuleProps = {
  module: ProductRailModuleDefinition;
  actions: FeedActions;
};

export function ProductRailModule({
  module,
  actions
}: ProductRailModuleProps) {
  const {
    title,
    subtitle,
    products,
    source
  } =
    module.data;

  const railRef =
    useRef<HTMLDivElement>(
      null
    );

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
      moduleId:
        module.id,
      source,
      productIds:
        products.map(
          product =>
            product.id
        )
    });

  const scrollRail = (
    direction:
      | 'left'
      | 'right'
  ): void => {
    const rail =
      railRef.current;

    if (!rail) {
      return;
    }

    const distance =
      getProductRailScrollStep(
        rail
      );

    rail.scrollBy({
      left:
        direction ===
        'left'
          ? -distance
          : distance,
      behavior:
        'smooth'
    });
  };

  return (
    <section
      data-module-id={
        module.id
      }
      data-module-type={
        module.type
      }
      className="
        min-w-0
        overflow-hidden
        rounded-3xl
        border
        border-border/50
        bg-card/30
        p-3
        sm:p-4
      ">
      <header
        className="
          flex min-w-0
          items-end
          justify-between
          gap-4
        ">
        <div className="min-w-0">
          <p
            className="
              text-[0.6rem]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-primary/65
            ">
            Product discovery
          </p>

          <h2
            className="
              mt-1 truncate
              text-lg
              font-semibold
              tracking-tight
              text-foreground/90
              sm:text-xl
            ">
            {title}
          </h2>

          {subtitle ? (
            <p
              className="
                mt-1
                line-clamp-1
                text-xs
                text-muted-foreground
                sm:text-sm
              ">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="
            flex shrink-0
            items-center gap-2
          ">
          <ListingViewAllLink
            href={
              viewAllHref
            }
          />

          <div
            className="
              hidden
              shrink-0
              items-center
              gap-2
              md:flex
            ">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Scroll ${title} left`}
              onClick={() =>
                scrollRail(
                  'left'
                )
              }
              className="
                size-9
                rounded-full
                bg-background/60
              ">
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Scroll ${title} right`}
              onClick={() =>
                scrollRail(
                  'right'
                )
              }
              className="
                size-9
                rounded-full
                bg-background/60
              ">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div
        ref={
          railRef
        }
        role="region"
        aria-label={`${title} products`}
        className={cn(
          EXPERIENCE_PRODUCT_RAIL_CLASS,
          'mt-4'
        )}>
        {products.map(
          product => (
            <div
              key={
                product.id
              }
              data-product-slide
              data-experience-product-item
              className={
                EXPERIENCE_PRODUCT_ITEM_CLASS
              }>
              <ProductCard
                product={
                  product
                }
                onPreview={
                  actions.previewProduct
                }
                onToggleLike={
                  actions.toggleLike
                }
                onAddToCart={
                  actions.addToCart
                }
                className="
                  h-full
                  min-h-52
                  md:min-h-56
                "
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
