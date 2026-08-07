'use client';


import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  ArrowLeft,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  Eye,
  Heart,
  Layers3,
  ListPlus,
  LoaderCircle,
  Minus,
  MoreHorizontal,
  PackageCheck,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Tag
} from 'lucide-react';

/* SHELSEA_HUB_GALLERY_RUNTIME_FIX_V1 */

/* SHELSEA_HUB_GALLERY_COLOR_VARIANTS_V1_1 */

/* AJ_HUB_CLOSE_BEFORE_PRODUCT_PAGE_V2K */

/* AJ_HUB_DISCOVERY_CARDS_PREVIEW_ONLY_V2I */

import Link from 'next/link';

/* AJ_PRODUCT_ACTION_TRAY_DEEP_INSIGHT_V1 */
/* AJ_HUB_PRODUCT_PAGE_HANDOFF_V2 */
/* AJ_HUB_PRODUCT_PAGE_AUTHORITY_V2D */
/* AJ_FEED_HUB_PRODUCT_PAGE_AUTHORITY_V1 */

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart';
import { useFeedExperience } from '@/features/feed-experience';

import {
  openProductDeepInsight
} from '@/features/product-intelligence';

import {
  selectProductVariant,
  useProductVariantSelection
} from '@/features/product-experience-state';

import {
  previewProductInHub,
  useHubProductPreview
} from '@/features/product-experience-state/hubProductPreviewBridge';

import {
  DiscoveryContinuityCarousel
} from './discovery-hub-panel/components/DiscoveryContinuityCarousel';

import {
  useHubProductPageNavigation
} from './discovery-hub-panel/navigation/useHubProductPageNavigation';

import {
  useOptionalShoppingLists
} from '@/features/shopping-lists';

import { useWishlist } from '@/features/wishlist';
import { cn } from '@/lib/utils';

import type {
  ProductType,
  ProductVariantType
} from '@/types/types';

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function formatLabel(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

type ResolvedVariantColor = {
  label: string;
  hex: string;
};

const VARIANT_COLOR_SWATCHES: Array<{
  label: string;
  hex: string;
  tokens: string[];
}> = [
  { label: 'Rose gold', hex: '#B76E79', tokens: ['rose gold', 'rose-gold'] },
  { label: 'Burgundy', hex: '#800020', tokens: ['burgundy', 'wine'] },
  { label: 'Navy', hex: '#1E3A5F', tokens: ['navy', 'navy blue'] },
  { label: 'Royal blue', hex: '#4169E1', tokens: ['royal blue', 'royal-blue'] },
  { label: 'Sky blue', hex: '#87CEEB', tokens: ['sky blue', 'sky-blue'] },
  { label: 'Black', hex: '#111111', tokens: ['black'] },
  { label: 'White', hex: '#FFFFFF', tokens: ['white'] },
  { label: 'Cream', hex: '#FFFDD0', tokens: ['cream', 'ivory'] },
  { label: 'Beige', hex: '#D9C5A5', tokens: ['beige', 'nude'] },
  { label: 'Brown', hex: '#7A4B2A', tokens: ['brown', 'chocolate'] },
  { label: 'Tan', hex: '#D2B48C', tokens: ['tan', 'camel'] },
  { label: 'Red', hex: '#DC2626', tokens: ['red'] },
  { label: 'Rose', hex: '#F43F5E', tokens: ['rose'] },
  { label: 'Pink', hex: '#EC4899', tokens: ['pink', 'blush'] },
  { label: 'Purple', hex: '#9333EA', tokens: ['purple', 'violet', 'lilac'] },
  { label: 'Blue', hex: '#2563EB', tokens: ['blue'] },
  { label: 'Green', hex: '#16A34A', tokens: ['green', 'olive'] },
  { label: 'Yellow', hex: '#EAB308', tokens: ['yellow', 'mustard'] },
  { label: 'Orange', hex: '#F97316', tokens: ['orange'] },
  { label: 'Gold', hex: '#D4AF37', tokens: ['gold'] },
  { label: 'Silver', hex: '#C0C0C0', tokens: ['silver'] },
  { label: 'Grey', hex: '#6B7280', tokens: ['grey', 'gray', 'charcoal'] }
];

function resolveVariantColor(
  variant: ProductVariantType
): ResolvedVariantColor | undefined {
  const explicitColor =
    normalizeText(
      variant.color
    );

  const explicitHex =
    normalizeText(
      variant.colorHex
    );

  if (explicitHex) {
    return {
      label:
        explicitColor ??
        variant.label,
      hex:
        explicitHex
    };
  }

  const searchable =
    `${explicitColor ?? ''} ${variant.label}`
      .trim()
      .toLowerCase();

  const resolved =
    VARIANT_COLOR_SWATCHES.find(
      swatch =>
        swatch.tokens.some(
          token =>
            searchable.includes(
              token
            )
        )
    );

  if (!resolved) {
    return undefined;
  }

  return {
    label:
      explicitColor ??
      resolved.label,
    hex:
      resolved.hex
  };
}

type ActiveProductWidgetProps = {
  onBackToDiscovery: () => void;
  onBeforeOpenProductPage?: () => void;
};

export default function ActiveProductWidget({
  onBackToDiscovery,
  onBeforeOpenProductPage
}: ActiveProductWidgetProps) {
  const {
    intent,
    context
  } = useFeedExperience();

  const hubProductPreview =
    useHubProductPreview();

  const openProductPageFromHub =
    useHubProductPageNavigation();

  const previewProductFromHub =
    (
      candidate:
        ProductType,
      preferredVariantId?:
        string |
        null
    ): void => {
      const preferredVariant =
        preferredVariantId
          ? candidate.variants.find(
              variant =>
                variant.id ===
                  preferredVariantId &&
                variant.stockLeft >
                  0
            )
          : undefined;

      const variant =
        preferredVariant ??
        candidate.variants.find(
          item =>
            item.stockLeft >
            0
        ) ??
        candidate.variants[0];

      if (variant) {
        selectProductVariant({
          productId:
            candidate.id,
          variantId:
            variant.id,
          source:
            'hub'
        });
      }

      previewProductInHub({
        productId:
          candidate.id,
        variantId:
          variant?.id ??
          null,
        source:
          'hub',
        reveal:
          true
      });
    };

  const { items: cartItems, addToCart, updateQuantity, removeFromCart, mutating } = useCart();

  const { toggleWishlist, isWishlisted, isMutating: isWishlistMutating } = useWishlist();

  const shoppingLists =
    useOptionalShoppingLists();

  const routeProductId =
    intent.type === 'product'
      ? intent.targetId ??
        null
      : null;

  const activeProductId =
    hubProductPreview?.productId ??
    routeProductId;

  const product = useMemo(() => {
    if (!activeProductId) {
      return undefined;
    }

    return context.catalog.products.find(
      candidate =>
        String(candidate.id) ===
        String(activeProductId)
    );
  }, [
    activeProductId,
    context.catalog.products
  ]);

  /**
   * AJ_HUB_PRODUCT_SCROLL_TOP_V2
   *
   * The Hub preview has its own request identity. A repeated Feed
   * preview for the same product still resets the Hub product panel
   * without touching the central Feed or browser scroll position.
   */
  const productScrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const activeProductScrollKey =
    product
      ? hubProductPreview
        ? `${hubProductPreview.requestId}:${product.id}`
        : `route:${intent.id}:${product.id}`
      : null;

  useEffect(() => {
    if (!activeProductScrollKey) {
      return;
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          productScrollRef.current?.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto'
          });
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [activeProductScrollKey]);

  const category = useMemo(() => {
    if (!product) {
      return undefined;
    }

    return context.catalog.categories.find(
      candidate =>
        candidate.slug ===
        product.category
    );
  }, [
    context.catalog.categories,
    product
  ]);

  /* AJ_SHARED_PRODUCT_VARIANT_SELECTION_V1 */
  const sharedVariantSelection =
    useProductVariantSelection(
      product?.id ??
        null
    );

  const selectedVariantId =
    product &&
    sharedVariantSelection?.productId === product.id
      ? sharedVariantSelection.variantId
      : product &&
          hubProductPreview?.productId === product.id &&
          hubProductPreview.variantId
        ? hubProductPreview.variantId
        : product?.variants[0]?.id;

  const [
    shoppingListPickerOpen,
    setShoppingListPickerOpen
  ] = useState(false);

  const [
    actionTrayOpen,
    setActionTrayOpen
  ] = useState(false);
  const [
    galleryIndex,
    setGalleryIndex
  ] = useState(0);


  const selectedVariant = useMemo(
    () => product?.variants.find(variant => variant.id === selectedVariantId) ?? product?.variants[0],
    [product, selectedVariantId]
  );

  const productGallery = useMemo(
    () => {
      if (!product) {
        return [];
      }

      const orderedImages = [
        selectedVariant?.image,
        ...(selectedVariant?.images ?? []),
        ...(product.images ?? []),
        ...product.variants.flatMap(
          variant => [
            variant.image,
            ...(variant.images ?? [])
          ]
        )
      ]
        .map(
          image =>
            normalizeText(
              image
            )
        )
        .filter(
          (
            image
          ): image is string =>
            Boolean(
              image
            )
        );

      return Array.from(
        new Set(
          orderedImages
        )
      );
    },
    [
      product,
      selectedVariant
    ]
  );

  const hasColorVariants =
    useMemo(
      () =>
        Boolean(
          product?.variants.some(
            variant =>
              resolveVariantColor(
                variant
              )
          )
        ),
      [
        product
      ]
    );

  useEffect(
    () => {
      setGalleryIndex(
        0
      );
    },
    [
      product?.id,
      selectedVariant?.id
    ]
  );

  useEffect(
    () => {
      if (
        galleryIndex <
        productGallery.length
      ) {
        return;
      }

      setGalleryIndex(
        0
      );
    },
    [
      galleryIndex,
      productGallery.length
    ]
  );

  const priceFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(context.environment.locale || 'en-NG', {
        style: 'currency',
        currency: context.environment.currency || 'NGN',
        maximumFractionDigits: 0
      });
    } catch {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
      });
    }
  }, [context.environment.currency, context.environment.locale]);

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(context.environment.locale || 'en-NG', {
        notation: 'compact',
        maximumFractionDigits: 1
      });
    } catch {
      return new Intl.NumberFormat('en-NG', {
        notation: 'compact',
        maximumFractionDigits: 1
      });
    }
  }, [context.environment.locale]);

  if (!product) {
    return null;
  }

  const productArtwork =
    productGallery[
      galleryIndex
    ] ??
    selectedVariant?.image ??
    product.variants[0]?.image ??
    category?.image;

  const hasMultipleProductImages =
    productGallery.length > 1;

  const handlePreviousProductImage =
    (): void => {
      if (
        productGallery.length <= 1
      ) {
        return;
      }

      setGalleryIndex(
        current =>
          (
            current -
            1 +
            productGallery.length
          ) %
          productGallery.length
      );
    };

  const handleNextProductImage =
    (): void => {
      if (
        productGallery.length <= 1
      ) {
        return;
      }

      setGalleryIndex(
        current =>
          (
            current +
            1
          ) %
          productGallery.length
      );
    };

  const categoryCover = category?.coverImages?.[0] ?? category?.image;

  const selectedVariantCartItem = cartItems.find(
    item =>
      String(item.productId) === String(product.id) && String(item.variantId) === String(selectedVariant?.id)
  );

  const selectedVariantCartQuantity = selectedVariantCartItem?.quantity ?? 0;

  const hasSelectedVariantInCart = selectedVariantCartQuantity > 0;

  const totalProductCartQuantity = cartItems
    .filter(item => String(item.productId) === String(product.id))
    .reduce((total, item) => total + item.quantity, 0);

  const isOutOfStock = !selectedVariant || selectedVariant.stockLeft <= 0;

  const isLowStock = Boolean(
    selectedVariant && selectedVariant.stockLeft > 0 && selectedVariant.stockLeft <= 5
  );

  const shortDescription = normalizeText(product.shortDescription);

  const longDescription = normalizeText(product.longDescription);

  const descriptionsAreDifferent = Boolean(
    shortDescription && longDescription && shortDescription.toLowerCase() !== longDescription.toLowerCase()
  );

  const categoryDescription =
    normalizeText(category?.description) ?? normalizeText(category?.shortDescription);

  const visibleTags = Array.from(
    new Map(
      (product.tags ?? [])
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !tag.includes(':'))
        .map(tag => [tag.toLowerCase(), tag] as const)
    ).values()
  ).slice(0, 12);

  const selectedVariantReachedStockLimit = Boolean(
    selectedVariant && selectedVariantCartQuantity >= selectedVariant.stockLeft
  );

  const saved = isWishlisted(product.id);

  const wishlistMutating = isWishlistMutating(product.id);

  /* AJ_HUB_PRODUCT_INTELLIGENCE_V1 */
  const selectedProductPrice =
    Number(
      selectedVariant?.price ??
        0
    );

  const normalizedProductTags =
    new Set(
      (
        product.tags ??
        []
      ).map(
        tag =>
          tag
            .trim()
            .toLowerCase()
      )
    );

  const intelligenceCandidates =
    context.catalog.products
      .filter(
        candidate =>
          String(
            candidate.id
          ) !==
          String(
            product.id
          )
      )
      .map(
        candidate => {
          const candidateVariant =
            candidate.variants.find(
              variant =>
                variant.stockLeft >
                0
            ) ??
            candidate.variants[0];

          const candidatePrice =
            Number(
              candidateVariant?.price ??
                0
            );

          const sharedTags =
            (
              candidate.tags ??
              []
            ).filter(
              tag =>
                normalizedProductTags.has(
                  tag
                    .trim()
                    .toLowerCase()
                )
            );

          const sameCategory =
            candidate.category ===
            product.category;

          const sameSubcategory =
            Boolean(
              product.subcategory &&
                candidate.subcategory ===
                  product.subcategory
            );

          const priceDistance =
            selectedProductPrice >
              0 &&
            candidatePrice >
              0
              ? Math.abs(
                  candidatePrice -
                    selectedProductPrice
                ) /
                selectedProductPrice
              : 1;

          const score =
            (
              sameCategory
                ? 40
                : 0
            ) +
            (
              sameSubcategory
                ? 24
                : 0
            ) +
            sharedTags.length *
              7 +
            Math.min(
              Number(
                candidate.rating
              ) ||
                0,
              5
            ) *
              2 +
            (
              candidate.featured
                ? 4
                : 0
            ) +
            (
              candidate.isNew
                ? 2
                : 0
            ) -
            Math.min(
              priceDistance *
                12,
              12
            );

          const matchLabel =
            [
              sameSubcategory &&
              candidate.subcategory
                ? `Same ${formatLabel(
                    candidate.subcategory
                  )}`
                : null,

              sharedTags[0]
                ? `Shared ${formatLabel(
                    sharedTags[0]
                  )}`
                : null,

              priceDistance <=
              0.2
                ? 'Close price range'
                : null
            ]
              .filter(
                (
                  value
                ): value is string =>
                  Boolean(
                    value
                  )
              )
              .slice(
                0,
                2
              )
              .join(
                ' · '
              );

          return {
            product:
              candidate,

            variant:
              candidateVariant,

            price:
              candidatePrice,

            sameCategory,

            score,

            matchLabel:
              matchLabel ||
              'Related catalog option'
          };
        }
      )
      .filter(
        candidate =>
          Boolean(
            candidate.variant
          )
      )
      .sort(
        (
          left,
          right
        ) =>
          right.score -
            left.score ||
          Number(
            right.product
              .rating
          ) -
            Number(
              left.product
                .rating
            )
      );

  const comparisonProducts =
    intelligenceCandidates
      .filter(
        candidate =>
          candidate.sameCategory
      )
      .slice(
        0,
        2
      );

  const comparisonProductIds =
    new Set(
      comparisonProducts.map(
        candidate =>
          String(
            candidate.product
              .id
          )
      )
    );

  const recommendationProducts =
    intelligenceCandidates
      .filter(
        candidate =>
          !comparisonProductIds.has(
            String(
              candidate.product
                .id
            )
          )
      )
      .slice(
        0,
        4
      );

  const productInsightSignals =
    [
      Number(
        product.rating
      ) >=
      4
        ? `${product.rating}/5 customer rating across ${numberFormatter.format(
            product.reviews
          )} reviews.`
        : `Customer response currently sits at ${product.rating}/5.`,

      product.soldCount >
      0
        ? `${numberFormatter.format(
            product.soldCount
          )} sold gives AJ a useful popularity signal.`
        : `${product.variants.length} ${
            product.variants.length ===
            1
              ? 'option is'
              : 'options are'
          } currently available to compare.`,

      product.discountPercentage >
      0
        ? `${product.discountPercentage}% off strengthens its current value position.`
        : isLowStock
          ? 'Limited availability may matter if this is your preferred option.'
          : 'Current availability supports a normal purchase decision.'
    ];


  const handleIncreaseCartQuantity = async (): Promise<void> => {
    if (!selectedVariant || isOutOfStock || mutating || selectedVariantReachedStockLimit) {
      return;
    }

    if (selectedVariantCartItem) {
      await updateQuantity({
        itemId: selectedVariantCartItem.id,
        quantity: selectedVariantCartItem.quantity + 1
      });

      return;
    }

    await addToCart({
      product,
      variant: selectedVariant,
      quantity: 1
    });
  };

  const handleDecreaseCartQuantity = async (): Promise<void> => {
    if (!selectedVariantCartItem || mutating) {
      return;
    }

    if (selectedVariantCartItem.quantity <= 1) {
      await removeFromCart(selectedVariantCartItem.id);

      return;
    }

    await updateQuantity({
      itemId: selectedVariantCartItem.id,
      quantity: selectedVariantCartItem.quantity - 1
    });
  };

  const handleWishlist = (): void => {
    if (wishlistMutating) {
      return;
    }

    void toggleWishlist({
      id: product.id,
      name: product.name
    });
  };

  const handleAddToShoppingList =
    async (
      listId: string
    ): Promise<void> => {
      if (
        !shoppingLists ||
        !selectedVariant ||
        shoppingLists.mutating
      ) {
        return;
      }

      await shoppingLists.addItem(
        listId,
        {
          productId:
            product.id,

          variantId:
            selectedVariant.id,

          quantity:
            1
        }
      );

      setShoppingListPickerOpen(
        false
      );

      setActionTrayOpen(
        false
      );
    };

  const handleDeepInsight =
    (): void => {
      setActionTrayOpen(
        false
      );

      setShoppingListPickerOpen(
        false
      );

      openProductDeepInsight({
        productId:
          product.id,

        variantId:
          selectedVariant?.id ??
          null,

        source:
          'active-product'
      });
    };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* ====================================================
          FIXED PRODUCT NAVIGATION
      ==================================================== */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Now exploring
          </p>

          <p className="mt-0.5 truncate text-xs font-medium text-foreground/80">
            {category?.label ?? formatLabel(product.category)}
          </p>
        </div>

        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onBackToDiscovery}
            className="h-9 shrink-0 rounded-full bg-background px-3 text-xs font-semibold shadow-sm">
            <ArrowLeft className="size-3.5" />
            Continue Discovery
          </Button>
      </header>

      {/* ====================================================
          SCROLLABLE PRODUCT INFORMATION
      ==================================================== */}
      <div
        ref={productScrollRef}
        data-aj-hub-product-scroll-root
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="space-y-5 px-3 pb-8 pt-3">
          {/* ==================================================
              FULL-BLEED PRODUCT ARTWORK
          ================================================== */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted shadow-xl">
            {categoryCover ? (
              <Image
                src={categoryCover}
                alt=""
                fill
                priority
                sizes="360px"
                className="scale-110 object-cover opacity-20 blur-xl"
              />
            ) : null}

            {productArtwork ? (
              <Image
                key={`${selectedVariant?.id ?? 'default'}:${galleryIndex}`}
                src={productArtwork}
                alt={selectedVariant?.label ? `${product.name} — ${selectedVariant.label}` : product.name}
                fill
                priority
                quality={95}
                sizes="360px"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Product image unavailable
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/15" />

            {hasMultipleProductImages ? (
              <>
                <button
                  type="button"
                  aria-label="Previous product photo"
                  onClick={
                    handlePreviousProductImage
                  }
                  className="
                    absolute left-2.5
                    top-1/2 z-20
                    inline-flex size-9
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border border-white/20
                    bg-black/38
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-rose-500
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-rose-300/80
                  ">
                  <span
                    aria-hidden="true"
                    className="
                      text-[1.45rem]
                      font-light
                      leading-none
                    ">
                    ‹
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Next product photo"
                  onClick={
                    handleNextProductImage
                  }
                  className="
                    absolute right-2.5
                    top-1/2 z-20
                    inline-flex size-9
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border border-white/20
                    bg-black/38
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-rose-500
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-rose-300/80
                  ">
                  <span
                    aria-hidden="true"
                    className="
                      text-[1.45rem]
                      font-light
                      leading-none
                    ">
                    ›
                  </span>
                </button>

                <div
                  className="
                    absolute right-3 top-3 z-20
                    rounded-full
                    border border-white/16
                    bg-black/42
                    px-2.5 py-1
                    text-[10px]
                    font-semibold
                    tracking-wide
                    text-white/90
                    shadow-sm
                    backdrop-blur-md
                  ">
                  {galleryIndex + 1}
                  <span className="text-white/45">
                    {' / '}
                  </span>
                  {productGallery.length}
                </div>
              </>
            ) : null}

            {/* Product states */}
            <div className="absolute left-3 top-3 flex max-w-[55%] flex-wrap gap-2">
              {product.isNew ? (
                <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xl">
                  New
                </span>
              ) : null}

              {product.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xl">
                  <Sparkles className="size-3" />
                  Featured
                </span>
              ) : null}

              {product.discountPercentage > 0 ? (
                <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xl">
                  Save {product.discountPercentage}%
                </span>
              ) : null}
            </div>

            {/* Cart state */}
            <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 py-1.5 pl-1.5 pr-3 text-white shadow-lg backdrop-blur-xl">
              <span className="grid size-7 place-items-center rounded-full bg-white/15">
                <ShoppingCart className="size-3.5" />
              </span>

              <span className="text-xs font-semibold">
                {totalProductCartQuantity > 0 ? `${totalProductCartQuantity} in cart` : 'Cart empty'}
              </span>
            </div>

            {/* Artwork caption */}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {category?.label ?? formatLabel(product.category)}
              </p>

              <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">{product.name}</h2>

              {selectedVariant?.label ? (
                <p className="mt-1 text-xs text-white/65">{selectedVariant.label}</p>
              ) : null}
            </div>
          </div>

          {/* ==================================================
              QUICK OVERVIEW
          ================================================== */}
          <section>
            {shortDescription ? (
              <p className="text-sm leading-6 text-muted-foreground">{shortDescription}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <strong className="font-semibold text-foreground">{product.rating}</strong>
                <span>({numberFormatter.format(product.reviews)} reviews)</span>
              </span>

              <span className="size-1 rounded-full bg-border" />

              <span>{numberFormatter.format(product.soldCount)} sold</span>
            </div>
          </section>

          {/* ==================================================
              VARIANT SELECTION
          ================================================== */}
          {product.variants.length > 1 ? (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Layers3 className="size-3.5 text-muted-foreground" />
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {hasColorVariants
                    ? 'Choose colour / option'
                    : 'Choose an option'}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => {
                  const active = variant.id === selectedVariant?.id;
                  const unavailable = variant.stockLeft <= 0;

                  const variantColor =
                    resolveVariantColor(
                      variant
                    );

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={unavailable}
                      aria-pressed={active}
                      onClick={() =>
                        selectProductVariant({
                          productId: product.id,
                          variantId: variant.id,
                          source: 'hub'
                        })
                      }
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        unavailable && 'cursor-not-allowed opacity-35'
                      )}>
                      {variantColor ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'inline-flex size-4 shrink-0 rounded-full border p-[2px]',
                            active
                              ? 'border-background/55'
                              : 'border-border bg-background'
                          )}>
                          <span
                            className="
                              size-full rounded-full
                              shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]
                            "
                            style={{
                              backgroundColor:
                                variantColor.hex
                            }}
                          />
                        </span>
                      ) : null}

                      <span>
                        {variant.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* ==================================================
              PRICE AND AVAILABILITY
          ================================================== */}
          <section className="rounded-2xl border border-border bg-muted/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Current price
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {selectedVariant ? priceFormatter.format(Number(selectedVariant.price)) : 'Unavailable'}
                </p>
              </div>

              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                  isOutOfStock
                    ? 'bg-destructive/10 text-destructive'
                    : isLowStock
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                )}>
                <PackageCheck className="size-3.5" />

                {isOutOfStock
                  ? 'Out of stock'
                  : isLowStock
                    ? `Only ${selectedVariant?.stockLeft} left`
                    : `${selectedVariant?.stockLeft} available`}
              </span>
            </div>

            {selectedVariantCartQuantity > 0 ? (
              <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
                <p className="text-xs font-medium text-primary">
                  {selectedVariantCartQuantity} of this option currently in your cart
                </p>
              </div>
            ) : null}
          </section>
          {/* ==================================================
    COMMERCE CONTROLS
================================================== */}

          <section className="rounded-2xl border border-border/70 bg-card/70 p-2 shadow-sm backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
              {hasSelectedVariantInCart ? (
                <div className="flex h-11 min-w-0 items-center justify-between rounded-xl border border-border bg-background px-1 shadow-sm">
                  <button
                    type="button"
                    aria-label={`Remove one ${selectedVariant?.label ?? 'item'} from cart`}
                    disabled={mutating}
                    onClick={() => {
                      void handleDecreaseCartQuantity();
                    }}
                    className="
            grid size-9 shrink-0
            place-items-center rounded-lg
            text-muted-foreground
            transition-colors
            hover:bg-muted
            hover:text-foreground
            disabled:cursor-not-allowed
            disabled:opacity-40
          ">
                    <Minus className="size-4" />
                  </button>

                  <div className="flex min-w-0 items-center justify-center gap-2 px-2">
                    {mutating ? (
                      <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <span
                          aria-live="polite"
                          className="min-w-5 text-center text-sm font-bold text-foreground">
                          {selectedVariantCartQuantity}
                        </span>

                        <span className="hidden truncate text-[10px] font-medium text-muted-foreground sm:inline">
                          in cart
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Add one more ${selectedVariant?.label ?? 'item'} to cart`}
                    disabled={mutating || selectedVariantReachedStockLimit}
                    onClick={() => {
                      void handleIncreaseCartQuantity();
                    }}
                    className="
            grid size-9 shrink-0
            place-items-center rounded-lg
            text-muted-foreground
            transition-colors
            hover:bg-muted
            hover:text-foreground
            disabled:cursor-not-allowed
            disabled:opacity-40
          ">
                    <Plus className="size-4" />
                  </button>
                </div>
              ) : (
                /*
                 * Keep this as a native button.
                 * The diagnostic confirmed that the shared Button component
                 * was interfering with this zero-cart state.
                 */
                <button
                  type="button"
                  aria-label={`Add ${selectedVariant?.label ?? product.name} to cart`}
                  disabled={isOutOfStock || mutating}
                  onClick={() => {
                    void handleIncreaseCartQuantity();
                  }}
                  className="
          inline-flex h-11 w-full min-w-0
          items-center justify-center gap-2
          rounded-xl
          bg-foreground px-4
          text-sm font-semibold text-background
          shadow-sm
          transition-all duration-200
          hover:-translate-y-px
          hover:bg-foreground/90
          hover:shadow-md
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
          focus-visible:ring-offset-background
          disabled:cursor-not-allowed
          disabled:opacity-45
          disabled:hover:translate-y-0
          disabled:hover:shadow-sm
        ">
                  {mutating ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-4" />
                  )}

                  <span className="truncate">
                    {mutating ? 'Adding...' : isOutOfStock ? 'Out of stock' : 'Add to cart'}
                  </span>
                </button>
              )}
              <button
                type="button"
                aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={saved}
                disabled={wishlistMutating}
                onClick={handleWishlist}
                className={cn(
                  `
          grid size-11 shrink-0 place-items-center
          rounded-xl border
          shadow-sm
          transition-all duration-200
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
          focus-visible:ring-offset-background
          disabled:cursor-not-allowed
          disabled:opacity-45
        `,

                  saved
                    ? `
              border-rose-500/30
              bg-rose-500/10
              text-rose-500
              hover:border-rose-500/45
              hover:bg-rose-500/15
            `
                    : `
              border-border
              bg-background
              text-muted-foreground
              hover:border-foreground/20
              hover:bg-muted
              hover:text-foreground
            `
                )}>
                {wishlistMutating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Heart
                    className={cn(
                      'size-4 transition-all duration-200',

                      saved ? 'scale-105 fill-current' : 'fill-transparent'
                    )}
                  />
                )}
              </button>

              <button
                type="button"
                aria-label="More product actions"
                aria-haspopup="menu"
                aria-expanded={
                  actionTrayOpen
                }
                onClick={() => {
                  setActionTrayOpen(
                    current => {
                      const next =
                        !current;

                      if (next) {
                        setShoppingListPickerOpen(
                          false
                        );
                      }

                      return next;
                    }
                  );
                }}
                className={cn(
                  `
                    grid size-11 shrink-0
                    place-items-center
                    rounded-xl border
                    shadow-sm
                    transition-all duration-200
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                  `,
                  actionTrayOpen
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted hover:text-foreground'
                )}>
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            {actionTrayOpen ? (
              <div
                role="menu"
                aria-label="More product actions"
                className="mt-2 overflow-hidden rounded-xl border border-border bg-background p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={
                    !shoppingLists ||
                    shoppingLists.loading ||
                    shoppingLists.mutating
                  }
                  onClick={() => {
                    setActionTrayOpen(
                      false
                    );

                    setShoppingListPickerOpen(
                      true
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    {
                      shoppingLists?.mutating
                        ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        )
                        : (
                          <ListPlus className="size-4" />
                        )
                    }
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground">
                      Add to Shopping List
                    </span>

                    <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                      Choose an existing list for this option.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={
                    handleDeepInsight
                  }
                  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">
                    <BrainCircuit className="size-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground">
                      Deep Insight
                    </span>

                    <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                      Express this product inside the Hub AI section.
                    </span>
                  </span>
                </button>
              </div>
            ) : null}

            {shoppingListPickerOpen ? (
              <div className="mt-2 rounded-xl border border-border bg-background p-2 shadow-sm">
                <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Add to Shopping List
                    </p>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Choose the destination list.
                    </p>
                  </div>

                  <ListPlus className="size-4 shrink-0 text-primary" />
                </div>

                {shoppingLists?.lists.some(
                  list =>
                    list.status ===
                    'ACTIVE'
                ) ? (
                  <div className="mt-1 max-h-44 space-y-1 overflow-y-auto">
                    {shoppingLists.lists
                      .filter(
                        list =>
                          list.status ===
                          'ACTIVE'
                      )
                      .map(
                        list => {
                          const alreadyAdded =
                            list.items.some(
                              item =>
                                String(
                                  item.productId
                                ) ===
                                  String(
                                    product.id
                                  ) &&
                                String(
                                  item.variantId
                                ) ===
                                  String(
                                    selectedVariant?.id
                                  )
                            );

                          return (
                            <button
                              key={
                                list.id
                              }
                              type="button"
                              disabled={
                                shoppingLists.mutating
                              }
                              onClick={() => {
                                void handleAddToShoppingList(
                                  list.id
                                );
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted disabled:opacity-50">
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-foreground">
                                  {
                                    list.name
                                  }
                                </span>

                                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                  {
                                    alreadyAdded
                                      ? 'Already included · add one more'
                                      : `${list.itemCount} ${list.itemCount === 1 ? 'item' : 'items'}`
                                  }
                                </span>
                              </span>

                              <ListPlus className="size-3.5 shrink-0 text-primary" />
                            </button>
                          );
                        }
                      )}
                  </div>
                ) : (
                  <Link
                    href="/account/lists"
                    className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-3 py-3 text-xs font-semibold text-primary transition hover:bg-primary/10">
                    Create your first Shopping List

                    <ListPlus className="size-4" />
                  </Link>
                )}
              </div>
            ) : null}


            <div className="mt-2 flex min-w-0 items-center justify-between gap-3 px-1">
              <p className="truncate text-[10px] font-medium text-muted-foreground">
                {selectedVariant?.label ?? 'Selected option'}
              </p>

              <p
                className={cn(
                  'shrink-0 text-[10px] font-medium',

                  isOutOfStock
                    ? 'text-destructive'
                    : selectedVariantReachedStockLimit
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                )}>
                {isOutOfStock
                  ? 'Unavailable'
                  : selectedVariantReachedStockLimit
                    ? 'Stock limit reached'
                    : hasSelectedVariantInCart
                      ? `${selectedVariantCartQuantity} selected`
                      : 'Ready to add'}
              </p>
            </div>
          </section>

          {/* ==================================================
              FULL DESCRIPTION
          ================================================== */}
          {longDescription ? (
            <section className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">About this product</h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {longDescription}
              </p>
            </section>
          ) : null}

          {descriptionsAreDifferent && shortDescription ? (
            <section className="rounded-2xl border border-border bg-muted/25 p-4">
              <h3 className="text-xs font-semibold text-foreground">Quick overview</h3>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">{shortDescription}</p>
            </section>
          ) : null}

          {/* ==================================================
              PRODUCT INFORMATION
          ================================================== */}
          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Product information</h3>

            <dl className="mt-3 divide-y divide-border rounded-2xl border border-border">
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  Category
                </dt>

                <dd className="text-right text-xs font-medium text-foreground">
                  {category?.label ?? formatLabel(product.category)}
                </dd>
              </div>

              {product.subcategory ? (
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers3 className="size-3.5" />
                    Subcategory
                  </dt>

                  <dd className="text-right text-xs font-medium text-foreground">
                    {formatLabel(product.subcategory)}
                  </dd>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                  Status
                </dt>

                <dd className="text-right text-xs font-medium text-foreground">
                  {product.isNew
                    ? 'New arrival'
                    : product.featured
                      ? 'Featured selection'
                      : 'Available selection'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers3 className="size-3.5" />
                  Options
                </dt>

                <dd className="text-right text-xs font-medium text-foreground">
                  {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
                </dd>
              </div>

              {product.estimatedDelivery ? (
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    Delivery
                  </dt>

                  <dd className="text-right text-xs font-medium text-foreground">
                    {product.estimatedDelivery}
                  </dd>
                </div>
              ) : null}

              {product.discountPercentage > 0 ? (
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    Discount
                  </dt>

                  <dd className="text-right text-xs font-medium text-foreground">
                    {product.discountPercentage}% off
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* ==================================================
              CHARACTERISTICS
          ================================================== */}
          {visibleTags.length > 0 ? (
            <section className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">Characteristics</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {visibleTags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    {formatLabel(tag)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* ==================================================
              CATEGORY CONTEXT
          ================================================== */}
          {categoryDescription ? (
            <section className="rounded-2xl border border-border bg-muted/25 p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                About {category?.label ?? formatLabel(product.category)}
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">{categoryDescription}</p>
            </section>
          ) : null}

          {/* ==================================================
              AJ PRODUCT INTELLIGENCE
          ================================================== */}
          <section
            data-aj-product-intelligence-panel
            className="overflow-hidden rounded-3xl border border-accent/20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_58%)] shadow-sm"
          >
            <header className="border-b border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                    <BrainCircuit className="size-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      AJ discovery intelligence
                    </p>

                    <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">
                      Understand the choice
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Compare close alternatives, review authentic signals and open a richer product view inside the Hub AI section.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                  Catalog-grounded
                </span>
              </div>
            </header>

            <div className="space-y-5 p-4">
              <div className="grid gap-2">
                {productInsightSignals.map(
                  (
                    signal,
                    index
                  ) => (
                    <div
                      key={signal}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/65 px-3 py-3"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-[10px] font-bold text-primary">
                        {index + 1}
                      </span>

                      <p className="text-xs leading-5 text-muted-foreground">
                        {signal}
                      </p>
                    </div>
                  )
                )}
              </div>

              {comparisonProducts.length >
              0 ? (
                <section>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Compare
                      </p>

                      <h4 className="mt-1 text-sm font-semibold text-foreground">
                        Similar Products
                      </h4>
                    </div>

                    <span className="text-[9px] font-medium text-muted-foreground">
                      Based on category, tags and price
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {comparisonProducts.map(
                      item => (
                        <button
                          key={
                            item.product
                              .id
                          }
                          type="button"
                          onClick={() =>
                            previewProductFromHub(
                              item.product,
                              item.variant?.id
                            )
                          }
                          className="group flex w-full items-center gap-3 rounded-2xl border border-border/65 bg-background/70 p-2.5 text-left transition hover:border-accent/30 hover:bg-muted/45"
                        >
                          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {item.variant?.image ? (
                              <Image
                                src={
                                  item.variant
                                    .image
                                }
                                alt={
                                  item.product
                                    .name
                                }
                                fill
                                sizes="64px"
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : null}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 text-xs font-semibold leading-5 text-foreground">
                              {
                                item.product
                                  .name
                              }
                            </span>

                            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                              {
                                item.matchLabel
                              }
                            </span>

                            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                              <strong className="font-semibold text-foreground">
                                {
                                  priceFormatter.format(
                                    item.price
                                  )
                                }
                              </strong>

                              <span className="text-muted-foreground">
                                {
                                  item.product
                                    .rating
                                }/5
                              </span>
                            </span>
                          </span>

                          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition group-hover:border-accent/30 group-hover:text-accent">
                            <Eye className="size-3.5" />
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </section>
              ) : null}

              {recommendationProducts.length >
              0 ? (
                <section>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Continue discovering
                    </p>

                    <h4 className="mt-1 text-sm font-semibold text-foreground">
                      Continue Discovering
                    </h4>
                  </div>

                  <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {recommendationProducts.map(
                      item => (
                        <button
                          key={
                            item.product
                              .id
                          }
                          type="button"
                          onClick={() =>
                            previewProductFromHub(
                              item.product,
                              item.variant?.id
                            )
                          }
                          className="group w-32 shrink-0 overflow-hidden rounded-2xl border border-border/65 bg-background/70 text-left transition hover:border-accent/30"
                        >
                          <span className="relative block aspect-square overflow-hidden bg-muted">
                            {item.variant?.image ? (
                              <Image
                                src={
                                  item.variant
                                    .image
                                }
                                alt={
                                  item.product
                                    .name
                                }
                                fill
                                sizes="128px"
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : null}
                          </span>

                          <span className="block p-2.5">
                            <span className="line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-foreground">
                              {
                                item.product
                                  .name
                              }
                            </span>

                            <span className="mt-1 block truncate text-[9px] text-muted-foreground">
                              {
                                item.matchLabel
                              }
                            </span>
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </section>
              ) : null}

              <div className="rounded-2xl border border-accent/20 bg-accent/8 p-3">
                <button
                  type="button"
                  onClick={
                    handleDeepInsight
                  }
                  className="group flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm">
                      <Sparkles className="size-4" />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-foreground">
                        Open Deep Insight in Hub AI
                      </span>

                      <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                        Expand this exact product without leaving the Discovery Hub.
                      </span>
                    </span>
                  </span>

                  <BrainCircuit className="size-4 shrink-0 text-accent transition group-hover:scale-110" />
                </button>

                <p className="mt-3 border-t border-accent/15 pt-3 text-[9px] leading-4 text-muted-foreground">
                  This quick view uses Shelsea catalog signals. Deep Insight stays inside the Hub AI section and is ready for verified media and external sources later.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================
              CONTINUITY — KEEP DISCOVERING
          ================================================== */}
          <DiscoveryContinuityCarousel />
        </div>
      </div>

      {/* ====================================================
          CANONICAL PRODUCT PAGE CONTROL
      ==================================================== */}
      <footer className="relative z-50 shrink-0 border-t border-border bg-background/95 p-3 shadow-[0_-18px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => {
            onBeforeOpenProductPage?.();

            openProductPageFromHub(
              product,
              selectedVariant?.id
            );
          }}
          aria-label={`View full product details for ${product.name}`}
          className="group flex min-h-16 w-full items-center justify-between rounded-2xl bg-primary px-3.5 py-3 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <span className="flex min-w-0 items-center gap-3 text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
              <Eye className="size-5 transition-transform group-hover:scale-110" />
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold">
                View more
              </span>

              <span className="mt-0.5 block truncate text-[10px] font-medium text-primary-foreground/75">
                Open the complete Product Page for details, variants, reviews and delivery
              </span>
            </span>
          </span>

          <span className="shrink-0 rounded-full bg-primary-foreground px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm">
            Open page
          </span>
        </button>
      </footer>
    </section>
  );
}
