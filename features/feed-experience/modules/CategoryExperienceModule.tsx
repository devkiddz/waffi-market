'use client';

import Image from 'next/image';

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
  CategoryExperienceModuleDefinition,
  FeedActions
} from '../contracts';

type CategoryExperienceModuleProps = {
  module: CategoryExperienceModuleDefinition;
  actions: FeedActions;
};

export function CategoryExperienceModule({
  module,
  actions
}: CategoryExperienceModuleProps) {
  const {
    category,
    title,
    subtitle,
    products
  } =
    module.data;

  const railRef =
    useRef<HTMLDivElement>(
      null
    );

  const CategoryIcon =
    category.icon;

  const categoryImage =
    category.coverImages?.[0] ??
    category.image;

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
      key:
        'category',
      categorySlug:
        category.slug,
      source:
        'continue-discovery',
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
        border-border/60
        bg-card/40
        shadow-sm
      ">
      <header
        className="
          relative
          min-h-32
          overflow-hidden
          border-b
          border-border/50
          sm:min-h-36
        ">
        {categoryImage ? (
          <Image
            src={
              categoryImage
            }
            alt=""
            fill
            sizes="
              (max-width: 1024px) 100vw,
              70vw
            "
            className="
              object-cover
              object-center
            "
          />
        ) : null}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-r
            from-background
            via-background/85
            to-background/25
          "
        />

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0 bottom-0
            h-20
            bg-gradient-to-t
            from-background/80
            to-transparent
          "
        />

        <div
          className="
            relative z-10
            flex min-h-32
            items-end
            justify-between
            gap-4
            px-4 py-4
            sm:min-h-36
            sm:px-5
          ">
          <div className="min-w-0">
            <div
              className="
                inline-flex
                items-center gap-2
                rounded-full
                border
                border-white/10
                bg-background/55
                px-2.5 py-1
                text-[0.6rem]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-foreground/65
                backdrop-blur-md
              ">
              {CategoryIcon ? (
                <CategoryIcon className="size-3" />
              ) : null}

              <span>
                Category experience
              </span>
            </div>

            <h2
              className="
                mt-3
                line-clamp-1
                text-xl
                font-semibold
                tracking-tight
                text-foreground/90
                sm:text-2xl
              ">
              {title}
            </h2>

            {subtitle ? (
              <p
                className="
                  mt-1 max-w-xl
                  line-clamp-2
                  text-xs
                  leading-5
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
            <span
              className="
                hidden
                rounded-full
                border
                border-border/60
                bg-background/60
                px-3 py-1.5
                text-xs
                font-medium
                text-muted-foreground
                backdrop-blur-md
                sm:inline-flex
              ">
              {products.length}{' '}
              {products.length ===
              1
                ? 'product'
                : 'products'}
            </span>

            <ListingViewAllLink
              href={
                viewAllHref
              }
            />
          </div>
        </div>
      </header>

      <div className="min-w-0 p-3 sm:p-4">
        <div
          className="
            mb-3 flex
            items-center
            justify-between
            gap-4
          ">
          <p
            className="
              text-[0.65rem]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-muted-foreground
            ">
            Discover the category
          </p>

          <div
            className="
              hidden shrink-0
              items-center gap-2
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
                size-8 rounded-full
                bg-background/60
              ">
              <ChevronLeft className="size-3.5" />
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
                size-8 rounded-full
                bg-background/60
              ">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <div
          ref={
            railRef
          }
          role="region"
          aria-label={`${title} products`}
          className={cn(
            EXPERIENCE_PRODUCT_RAIL_CLASS,
            'pb-2'
          )}>
          {products.map(
            product => (
              <div
                key={
                  product.id
                }
                data-category-product-slide
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
                    h-full min-h-52
                    md:min-h-56
                  "
                />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
