'use client';

/* AJ_FEATURED_PRODUCT_STAGE_V2 */
/* AJ_FEATURED_PRODUCT_COMPACT_FADE_STAGE_V1 */
/* AJ_FEATURED_PRODUCT_FINAL_BALANCE_STAGE_V1 */

import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import type {
  FeedActions,
  FeaturedProductsModule
} from '@/features/feed-experience/contracts';

import {
  EXPERIENCE_PRODUCT_RAIL_CLASS,
  getProductRailScrollStep
} from '@/features/products/productRailPresentation';

import {
  cn
} from '@/lib/utils';

import type {
  ProductType
} from '@/types/types';

import FeaturedProductExperienceCard from './FeaturedProductExperienceCard';
import ProductExperienceCard from './ProductExperienceCard';

type CategoryProductExperienceSectionProps = {
  module: FeaturedProductsModule;
  actions: FeedActions;
};

function uniqueProducts(
  products: ProductType[]
): ProductType[] {
  return Array.from(
    new Map(
      products.map(
        product => [
          product.id,
          product
        ]
      )
    ).values()
  );
}

export default function CategoryProductExperienceSection({
  module,
  actions
}: CategoryProductExperienceSectionProps) {
  const {
    title,
    subtitle,
    categorySlug,
    featuredProduct,
    featuredProducts,
    products,
    locale,
    currency
  } = module.data;

  const railRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    activeFeaturedIndex,
    setActiveFeaturedIndex
  ] = useState(0);

  const [
    featuredPaused,
    setFeaturedPaused
  ] = useState(false);

  const [
    railPaused,
    setRailPaused
  ] = useState(false);

  const [
    prefersReducedMotion,
    setPrefersReducedMotion
  ] = useState(false);

  const [
    canScrollPrevious,
    setCanScrollPrevious
  ] = useState(false);

  const [
    canScrollNext,
    setCanScrollNext
  ] = useState(false);

  const resolvedProducts =
    useMemo(
      () =>
        uniqueProducts([
          ...(products ?? []),
          ...(featuredProduct
            ? [
                featuredProduct
              ]
            : []),
          ...featuredProducts
        ]),
      [
        featuredProduct,
        featuredProducts,
        products
      ]
    );

  const featuredStageProducts =
    useMemo(
      () => {
        const explicit =
          uniqueProducts([
            ...(featuredProduct
              ? [
                  featuredProduct
                ]
              : []),
            ...featuredProducts,
            ...resolvedProducts.filter(
              product =>
                product.featured
            )
          ]);

        return explicit.length
          ? explicit
          : resolvedProducts.slice(
              0,
              1
            );
      },
      [
        featuredProduct,
        featuredProducts,
        resolvedProducts
      ]
    );

  const featuredProductIds =
    useMemo(
      () =>
        new Set(
          featuredStageProducts.map(
            product =>
              product.id
          )
        ),
      [
        featuredStageProducts
      ]
    );

  const railProducts =
    useMemo(
      () =>
        resolvedProducts.filter(
          product =>
            !featuredProductIds.has(
              product.id
            )
        ),
      [
        featuredProductIds,
        resolvedProducts
      ]
    );

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );

    const synchronizePreference =
      () =>
        setPrefersReducedMotion(
          mediaQuery.matches
        );

    synchronizePreference();

    mediaQuery.addEventListener(
      'change',
      synchronizePreference
    );

    return () =>
      mediaQuery.removeEventListener(
        'change',
        synchronizePreference
      );
  }, []);

  useEffect(() => {
    setActiveFeaturedIndex(
      0
    );

  }, [
    featuredStageProducts.length,
    module.id
  ]);

  useEffect(() => {
    if (
      featuredStageProducts.length <=
        1 ||
      featuredPaused ||
      prefersReducedMotion
    ) {
      return;
    }

    const intervalId =
      window.setInterval(
        () => {
          setActiveFeaturedIndex(
            current =>
              (
                current + 1
              ) %
              featuredStageProducts.length
          );
        },
        6200
      );

    return () =>
      window.clearInterval(
        intervalId
      );
  }, [
    featuredPaused,
    featuredStageProducts.length,
    prefersReducedMotion
  ]);

  const synchronizeControls =
    useCallback(
      () => {
        const viewport =
          railRef.current;

        if (!viewport) {
          setCanScrollPrevious(
            false
          );

          setCanScrollNext(
            false
          );

          return;
        }

        const maximumScroll =
          Math.max(
            viewport.scrollWidth -
              viewport.clientWidth,
            0
          );

        setCanScrollPrevious(
          viewport.scrollLeft >
            4
        );

        setCanScrollNext(
          viewport.scrollLeft <
            maximumScroll -
              4
        );
      },
      [
        railProducts.length
      ]
    );

  useEffect(() => {
    const viewport =
      railRef.current;

    if (!viewport) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        synchronizeControls
      );

    viewport.addEventListener(
      'scroll',
      synchronizeControls,
      {
        passive: true
      }
    );

    const observer =
      typeof ResizeObserver ===
      'undefined'
        ? null
        : new ResizeObserver(
            synchronizeControls
          );

    observer?.observe(
      viewport
    );

    return () => {
      window.cancelAnimationFrame(
        frame
      );

      viewport.removeEventListener(
        'scroll',
        synchronizeControls
      );

      observer?.disconnect();
    };
  }, [
    railProducts.length,
    synchronizeControls
  ]);

  const advanceRail =
    useCallback(
      () => {
        const viewport =
          railRef.current;

        if (!viewport) {
          return;
        }

        const maximumScroll =
          Math.max(
            viewport.scrollWidth -
              viewport.clientWidth,
            0
          );

        if (
          viewport.scrollLeft >=
          maximumScroll - 4
        ) {
          viewport.scrollTo({
            left: 0,
            behavior: 'smooth'
          });

          return;
        }

        viewport.scrollBy({
          left:
            getProductRailScrollStep(
              viewport
            ),
          behavior: 'smooth'
        });
      },
      []
    );

  useEffect(() => {
    if (
      railProducts.length <=
        1 ||
      railPaused ||
      prefersReducedMotion
    ) {
      return;
    }

    const intervalId =
      window.setInterval(
        advanceRail,
        3400
      );

    return () =>
      window.clearInterval(
        intervalId
      );
  }, [
    advanceRail,
    prefersReducedMotion,
    railPaused,
    railProducts.length
  ]);

  if (
    !featuredStageProducts.length
  ) {
    return null;
  }

  const resolvedTitle =
    title ??
    (
      categorySlug &&
      categorySlug !== 'all'
        ? `Featured in ${categorySlug}`
        : 'Featured across Shelsea'
    );

  const scrollRail = (
    direction:
      | 'previous'
      | 'next'
  ) => {
    const viewport =
      railRef.current;

    if (!viewport) {
      return;
    }

    const distance =
      getProductRailScrollStep(
        viewport
      ) *
      2;

    viewport.scrollBy({
      left:
        direction ===
        'next'
          ? distance
          : -distance,
      behavior: 'smooth'
    });
  };

  return (
    <section
      data-aj-featured-product-stage
      className="min-w-0 overflow-hidden rounded-[2rem] border border-border/60 bg-background/70 p-3 shadow-sm sm:p-4"
    >
      <header className="mb-3 flex min-w-0 items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Featured by Shelsea
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {resolvedTitle}
          </h2>

          {subtitle ? (
            <p className="mt-1 line-clamp-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>

        {railProducts.length >
        0 ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={
                !canScrollPrevious
              }
              onClick={() =>
                scrollRail(
                  'previous'
                )
              }
              aria-label="Show previous featured products"
              className="grid size-9 place-items-center rounded-full border border-border/70 bg-foreground text-background shadow-sm transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              disabled={
                !canScrollNext
              }
              onClick={() =>
                scrollRail(
                  'next'
                )
              }
              aria-label="Show next featured products"
              className="grid size-9 place-items-center rounded-full border border-border/70 bg-foreground text-background shadow-sm transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          'grid min-w-0 items-stretch gap-3',
          railProducts.length >
          0
            ? 'lg:grid-cols-[minmax(24rem,27rem)_minmax(0,1fr)]'
            : 'grid-cols-1'
        )}
      >
        <div
          onMouseEnter={() =>
            setFeaturedPaused(
              true
            )
          }
          onMouseLeave={() =>
            setFeaturedPaused(
              false
            )
          }
          onFocusCapture={() =>
            setFeaturedPaused(
              true
            )
          }
          onBlurCapture={() =>
            setFeaturedPaused(
              false
            )
          }
          className="flex h-[14rem] min-w-0 flex-col"
        >
          <div
            data-aj-featured-fade-stage
            className="relative h-[13.25rem] min-w-0 shrink-0"
          >
            {featuredStageProducts.map(
              (
                product,
                index
              ) => {
                const active =
                  activeFeaturedIndex ===
                  index;

                return (
                  <div
                    key={
                      product.id
                    }
                    aria-hidden={
                      !active
                    }
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      prefersReducedMotion
                        ? 'transition-none'
                        : 'transition-opacity duration-700 ease-in-out',
                      active
                        ? 'z-10 opacity-100 pointer-events-auto'
                        : 'z-0 opacity-0 pointer-events-none'
                    )}
                  >
                    <FeaturedProductExperienceCard
                      product={
                        product
                      }
                      actions={
                        actions
                      }
                      locale={
                        locale
                      }
                      currency={
                        currency
                      }
                    />
                  </div>
                );
              }
            )}
          </div>

          {featuredStageProducts.length >
          1 ? (
            <div className="mt-auto flex h-3 items-end justify-center gap-1.5">
              {featuredStageProducts.map(
                (
                  product,
                  index
                ) => {
                  const normalizedActiveIndex =
                    activeFeaturedIndex %
                    featuredStageProducts.length;

                  return (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      aria-label={`Show featured product ${index + 1}`}
                      aria-pressed={
                        normalizedActiveIndex ===
                        index
                      }
                      onClick={() => {
                        setActiveFeaturedIndex(
                          index
                        );
                      }}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        normalizedActiveIndex ===
                          index
                          ? 'w-6 bg-primary'
                          : 'w-1.5 bg-border hover:bg-muted-foreground/50'
                      )}
                    />
                  );
                }
              )}
            </div>
          ) : null}
        </div>

        {railProducts.length >
        0 ? (
          <div
            onMouseEnter={() =>
              setRailPaused(
                true
              )
            }
            onMouseLeave={() =>
              setRailPaused(
                false
              )
            }
            onFocusCapture={() =>
              setRailPaused(
                true
              )
            }
            onBlurCapture={() =>
              setRailPaused(
                false
              )
            }
            onTouchStart={() =>
              setRailPaused(
                true
              )
            }
            onTouchEnd={() =>
              setRailPaused(
                false
              )
            }
            className="h-[14rem] min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card/45 p-2 shadow-sm sm:p-2.5"
          >
            <div
              ref={
                railRef
              }
              role="region"
              aria-label={`${resolvedTitle} products`}
              data-product-count={
                railProducts.length
              }
              data-aj-featured-product-auto-rail
              className={cn(
                EXPERIENCE_PRODUCT_RAIL_CLASS,
                'h-full items-stretch pb-0'
              )}
            >
              {railProducts.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={`${product.id}:${index}`}
                    data-product-experience-slide
                    data-experience-product-item
                    className="w-[46%] min-w-[46%] max-w-[46%] flex-none snap-start sm:w-36 sm:min-w-36 sm:max-w-36 md:w-36 md:min-w-36 md:max-w-36 xl:w-40 xl:min-w-40 xl:max-w-40 [&>*]:h-full [&>*]:w-full [&>*]:min-w-0 [&>*]:max-w-none"
                  >
                    <ProductExperienceCard
                      product={
                        product
                      }
                      actions={
                        actions
                      }
                      locale={
                        locale
                      }
                      currency={
                        currency
                      }
                      presentation="featured-rail"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
