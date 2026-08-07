'use client';

import Image from 'next/image';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useFeedExperience
} from '@/features/feed-experience';

import {
  ProductActionTray
} from '@/features/products/cards/ProductActionTray';

import {
  cn
} from '@/lib/utils';

import type {
  HubSlideItem
} from '../discoveryHubTypes';

type HubSliderProps = {
  items: HubSlideItem[];

  autoSlide?: boolean;

  variant?:
    | 'hero'
    | 'strip'
    | 'grid'
    | 'minimal-grid';
};

function formatPrice(
  price?: number
): string | null {
  if (
    price === undefined ||
    price === null
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    'en-NG',
    {
      style:
        'currency',

      currency:
        'NGN',

      maximumFractionDigits:
        0
    }
  ).format(
    price
  );
}

function getTargetProductId(
  target: unknown
): string | null {
  if (
    typeof target !==
      'object' ||
    target === null
  ) {
    return null;
  }

  const candidate =
    target as {
      type?: unknown;
      productId?: unknown;
    };

  if (
    candidate.type !==
      'product' ||
    typeof candidate.productId !==
      'string'
  ) {
    return null;
  }

  return candidate.productId;
}

export default function HubSlider({
  items,
  autoSlide = false,
  variant = 'strip'
}: HubSliderProps) {
  const {
    actions,
    context
  } = useFeedExperience();

  const products =
    context.catalog.products;

  const [
    activeIndex,
    setActiveIndex
  ] = useState(0);

  const safeItems =
    useMemo(
      () =>
        items.filter(
          Boolean
        ),
      [
        items
      ]
    );

  const productById =
    useMemo(
      () =>
        new Map(
          products.map(
            product => [
              String(
                product.id
              ),
              product
            ]
          )
        ),
      [
        products
      ]
    );

  const currentActiveIndex =
    safeItems.length > 0
      ? Math.min(
          activeIndex,
          safeItems.length -
            1
        )
      : 0;

  const activeItem =
    safeItems[
      currentActiveIndex
    ];

  const resolveProduct = (
    item: HubSlideItem
  ) => {
    const targetProductId =
      getTargetProductId(
        item.target
      );

    const productId =
      targetProductId ??
      String(
        item.id
      );

    return productById.get(
      String(
        productId
      )
    );
  };

  const getCommerceState = (
    item: HubSlideItem
  ) => {
    const product =
      resolveProduct(
        item
      );

    const selectedVariant =
      product?.variants.find(
        productVariant =>
          productVariant.stockLeft >
          0
      ) ??
      product?.variants[0] ??
      null;

    return {
      product,
      selectedVariant
    };
  };

  const openItem = (
    item: HubSlideItem
  ): void => {
    const product =
      resolveProduct(
        item
      );

    if (product) {
      actions.openExperience({
        type:
          'product',

        productId:
          product.id
      });

      return;
    }

    if (item.target) {
      actions.openExperience(
        item.target
      );
    }
  };

  const showPrevious =
    (): void => {
      if (
        safeItems.length <= 1
      ) {
        return;
      }

      setActiveIndex(
        currentActiveIndex ===
          0
          ? safeItems.length -
              1
          : currentActiveIndex -
              1
      );
    };

  const showNext =
    (): void => {
      if (
        safeItems.length <= 1
      ) {
        return;
      }

      setActiveIndex(
        (
          currentActiveIndex +
          1
        ) %
          safeItems.length
      );
    };

  useEffect(() => {
    if (
      !autoSlide ||
      safeItems.length <= 1
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setActiveIndex(
            currentIndex =>
              (currentIndex +
                1) %
              safeItems.length
          );
        },
        4500
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    autoSlide,
    safeItems.length
  ]);

  if (!safeItems.length) {
    return null;
  }

  if (
    variant === 'hero' &&
    activeItem
  ) {
    const {
      product: activeProduct,
      selectedVariant
    } = getCommerceState(
      activeItem
    );

    const activeTitle =
      activeProduct?.name ??
      activeItem.title;

    const activeImage =
      selectedVariant?.image ??
      activeItem.image;

    const activePrice =
      formatPrice(
        selectedVariant?.price ??
          activeItem.price
      );

    return (
      <div className="min-w-0">
        <article
          className="
            group relative
            h-[31rem] min-h-[31rem]
            w-full overflow-hidden
            rounded-[1.9rem]
            bg-background
          "
        >
          <button
            type="button"
            onClick={() =>
              openItem(
                activeItem
              )
            }
            aria-label={`Explore ${activeTitle}`}
            className="
              absolute inset-0
              block size-full
              overflow-hidden text-left
            "
          >
            <Image
              key={`${activeItem.id}:${activeImage}`}
              src={activeImage}
              alt={activeTitle}
              fill
              sizes="(max-width: 1024px) 100vw, 430px"
              className="
                object-cover object-center
                transition duration-700
                group-hover:scale-[1.025]
              "
            />

            <div
              className="
                absolute inset-0
                bg-gradient-to-t
                from-black/16
                via-transparent
                to-black/5
              "
            />
          </button>

          <div
            className="
              pointer-events-none
              absolute inset-x-0 top-0 z-10
              flex items-start
              justify-between gap-3
              p-4
            "
          >
            <span
              className="
                rounded-full
                bg-black/30
                px-3.5 py-2
                text-[9px] font-bold
                uppercase tracking-[0.16em]
                text-white
                shadow-[0_6px_16px_rgba(0,0,0,0.25)]
                backdrop-blur-xl
              "
            >
              Shelsea Spotlight
            </span>

            {activeItem.badge ? (
              <span
                className="
                  rounded-full
                  bg-black/30
                  px-3.5 py-2
                  text-[9px] font-bold
                  uppercase tracking-[0.14em]
                  text-white
                  shadow-[0_6px_16px_rgba(0,0,0,0.25)]
                  backdrop-blur-xl
                "
              >
                {activeItem.badge}
              </span>
            ) : null}
          </div>

          <section
            className="
              absolute inset-x-3 bottom-3 z-20
              rounded-[1.35rem]
              border border-white/12
              bg-[rgba(18,29,52,0.94)]
              px-4 py-4
              shadow-[0_18px_44px_rgba(0,0,0,0.38)]
              backdrop-blur-xl
            "
          >
            <div
              className="
                absolute inset-x-0 top-0
                h-px overflow-hidden
                rounded-t-[1.35rem]
                bg-gradient-to-r
                from-secondary/80
                via-accent/90
                to-primary/80
              "
            />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-[9px] font-semibold
                    uppercase tracking-[0.15em]
                    text-white/42
                  "
                >
                  Featured promotion
                </p>

                <h4
                  className="
                    mt-1 line-clamp-2
                    text-[15px] font-bold
                    leading-5 tracking-tight
                    text-white
                  "
                >
                  {activeTitle}
                </h4>

                {activeItem.subtitle ? (
                  <p
                    className="
                      mt-1.5 truncate
                      text-[10px]
                      text-white/58
                    "
                  >
                    {activeItem.subtitle}
                  </p>
                ) : null}
              </div>

              {activePrice ? (
                <div className="shrink-0 text-right">
                  <p
                    className="
                      text-[9px] font-semibold
                      uppercase tracking-[0.15em]
                      text-white/42
                    "
                  >
                    Price
                  </p>

                  <p
                    className="
                      mt-1 text-sm
                      font-bold text-accent
                    "
                  >
                    {activePrice}
                  </p>
                </div>
              ) : null}
            </div>

            <div
              className="
                mt-4 flex
                items-center
                justify-between gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  openItem(
                    activeItem
                  )
                }
                className="
                  inline-flex h-9
                  items-center gap-2
                  rounded-full
                  bg-white
                  px-4
                  text-[11px] font-semibold
                  text-slate-900
                  transition
                  hover:bg-white/90
                "
              >
                Explore
                <ArrowRight className="size-3.5" />
              </button>

              {safeItems.length > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Previous promotion"
                    className="
                      grid size-8 place-items-center
                      rounded-full
                      border border-white/12
                      bg-white/7
                      text-white/85
                      transition
                      hover:bg-white/12
                    "
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <span
                    className="
                      min-w-8 text-center
                      text-[10px] font-semibold
                      text-white/52
                    "
                  >
                    {currentActiveIndex + 1}/{safeItems.length}
                  </span>

                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next promotion"
                    className="
                      grid size-8 place-items-center
                      rounded-full
                      border border-white/12
                      bg-white/7
                      text-white/85
                      transition
                      hover:bg-white/12
                    "
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>

            {safeItems.length > 1 ? (
              <div className="mt-3 flex gap-1.5">
                {safeItems.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={item.id}
                      type="button"
                      title={`Show ${item.title}`}
                      aria-label={`Show ${item.title}`}
                      onClick={() =>
                        setActiveIndex(
                          index
                        )
                      }
                      className={cn(
                        'h-1 rounded-full transition-all duration-300',
                        index === currentActiveIndex
                          ? 'w-8 bg-accent'
                          : 'w-2 bg-white/20 hover:bg-white/35'
                      )}
                    />
                  )
                )}
              </div>
            ) : null}
          </section>
        </article>
      </div>
    );
  }









  if (
    variant === 'grid' ||
    variant ===
      'minimal-grid'
  ) {
    const visibleItems =
      safeItems.slice(
        0,
        2
      );

    return (
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
        {visibleItems.map(
          item => {
            const {
              product,
              selectedVariant
            } =
              getCommerceState(
                item
              );

            const title =
              product?.name ??
              item.title;

            const image =
              selectedVariant?.image ??
              item.image;

            const price =
              formatPrice(
                selectedVariant?.price ??
                  item.price
              );

            return (
              <article
                key={
                  item.id
                }
                className="
                  group min-w-0
                  overflow-hidden
                  rounded-2xl border
                  border-primary/10
                  bg-background/45
                  text-left
                  shadow-[0_12px_35px_rgba(0,0,0,0.22)]
                  transition duration-300
                  hover:-translate-y-0.5
                  hover:border-primary/20
                  hover:bg-background/60
                ">
                <button
                  type="button"
                  onClick={() =>
                    openItem(
                      item
                    )
                  }
                  className="block w-full text-left">
                  <div
                    className="
                      relative aspect-[3/4]
                      min-h-32 overflow-hidden
                    ">
                    <Image
                      src={
                        image
                      }
                      alt={
                        title
                      }
                      fill
                      sizes="(max-width: 640px) 44vw, 170px"
                      className="
                        object-cover
                        transition duration-500
                        group-hover:scale-105
                      "
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    {item.badge ? (
                      <span
                        className="
                          absolute left-2 top-2
                          rounded-full
                          bg-black/50
                          px-2 py-0.5
                          text-[9px] font-semibold
                          text-white backdrop-blur
                        ">
                        {
                          item.badge
                        }
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2.5">
                    <p
                      className="
                        line-clamp-2 min-h-8
                        text-[11px] font-semibold
                        leading-4 text-primary
                      ">
                      {
                        title
                      }
                    </p>

                    {variant ===
                      'grid' &&
                    item.subtitle ? (
                      <p className="mt-1 line-clamp-1 text-[10px] text-primary/50">
                        {
                          item.subtitle
                        }
                      </p>
                    ) : null}

                    {variant ===
                      'grid' &&
                    price ? (
                      <p className="mt-2 truncate text-[11px] font-bold text-primary/80">
                        {
                          price
                        }
                      </p>
                    ) : null}
                  </div>
                </button>

                {product &&
                selectedVariant ? (
                  <div className="px-2.5 pb-2.5">
                    <ProductActionTray
                      product={
                        product
                      }
                      variant={
                        selectedVariant
                      }
                      presentation="inline"
                      compact
                      className="
                        w-fit max-w-full
                        border-primary/10
                        bg-background/70
                      "
                    />
                  </div>
                ) : null}
              </article>
            );
          }
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {safeItems.map(
        item => {
          const {
            product,
            selectedVariant
          } =
            getCommerceState(
              item
            );

          const title =
            product?.name ??
            item.title;

          const image =
            selectedVariant?.image ??
            item.image;

          const price =
            formatPrice(
              selectedVariant?.price ??
                item.price
            );

          return (
            <article
              key={
                item.id
              }
              className="w-28 shrink-0">
              <button
                type="button"
                onClick={() =>
                  openItem(
                    item
                  )
                }
                className="block w-full text-left">
                <div
                  className="
                    relative aspect-square
                    w-28 overflow-hidden
                    rounded-2xl border
                    border-primary/10
                    bg-background
                    shadow-[0_10px_30px_rgba(0,0,0,0.2)]
                  ">
                  <Image
                    src={
                      image
                    }
                    alt={
                      title
                    }
                    fill
                    sizes="112px"
                    className="
                      object-cover
                      transition duration-500
                      hover:scale-105
                    "
                  />
                </div>

                <p
                  className="
                    mt-2 line-clamp-2
                    text-[11px] font-medium
                    leading-4 text-primary/75
                  ">
                  {
                    title
                  }
                </p>

                {price ? (
                  <p className="mt-1 text-[11px] font-semibold text-primary/45">
                    {
                      price
                    }
                  </p>
                ) : null}
              </button>

              {product &&
              selectedVariant ? (
                <div className="mt-2">
                  <ProductActionTray
                    product={
                      product
                    }
                    variant={
                      selectedVariant
                    }
                    presentation="inline"
                    compact
                    className="
                      w-fit max-w-full
                      border-primary/10
                      bg-background/70
                    "
                  />
                </div>
              ) : null}
            </article>
          );
        }
      )}
    </div>
  );
}
