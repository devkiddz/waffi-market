'use client';

/* AJ_STORE_PRODUCT_QUERY_UPDATES_HUB_ONLY_V1 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { LoaderCircle } from 'lucide-react';
import { useActionFeedback } from '@/features/action-feedback';
import PromoModal from '@/components/promos/PromoModal';

import { promos, type Promo } from '@/data/promos';

import { useCart } from '@/features/cart';
import { useCatalog } from '@/features/catalog';

import {
  selectProductVariant
} from '@/features/product-experience-state';

import {
  previewProductInHub
} from '@/features/product-experience-state/hubProductPreviewBridge';

import {
  recordProductView
} from '@/features/product-activity';
import { useWishlist } from '@/features/wishlist';
import { useWorkspace } from '@/features/workspace';
import { useStoreStudioProjection } from '@/features/store-studio/client';
import { StorefrontReelComposer } from '@/features/store-studio/admin/StorefrontReelComposer';
import { PublicShoppingListRail } from '@/features/shopping-lists/components/PublicShoppingListRail';

import { useIdentity } from '@/providers/IdentityProvider';

import type { ProductType, ProductVariantType } from '@/types/types';
import type { VendorStorefront } from '@/features/vendor-storefront/contracts';

import type { FeedActions, FeedContext, FeedIntent } from '../contracts';

import { mockExperienceProfiles, type MockExperienceProfileId } from '../mocks';

import { FeedExperienceProvider } from '../providers';
import { FeedRenderer } from '../renderers';
import { StoreGridDestination } from './StoreGridDestination';

type FeedExperienceWorkspaceProps = {
  canManageStoreStudio?: boolean;
  storeStudioWorkspaceId?: string | null;
  vendorStorefront?: VendorStorefront;
};

function FeedExperienceWorkspaceContent({
  canManageStoreStudio = false,
  storeStudioWorkspaceId = null,
  vendorStorefront
}: FeedExperienceWorkspaceProps) {
  const {
    activeWorkspace,
    loading: workspaceLoading,
    error: workspaceError
  } = useWorkspace();

  const { projection: storeStudio } = useStoreStudioProjection(activeWorkspace?.id);
  const { error } = useActionFeedback();

  const { user, isAuthenticated } = useIdentity();

  const { items: cartItems, addToCart: addCartItem } = useCart();

  const { productIds: wishlistProductIds, toggleWishlist } = useWishlist();

  const {
    products: catalogProducts,
    categories: catalogCategories,
    collections: catalogCollections,
    loading: catalogLoading,
    error: catalogError
  } = useCatalog();

  // ============================================================
  // CART
  // ============================================================

  const handleAddToCart = useCallback(
    async (product: ProductType, variant: ProductVariantType): Promise<void> => {
      const addedItem = await addCartItem({
        product,
        variant,
        quantity: 1
      });

      if (!addedItem) {
        error({
          title: 'Unable to add product',
          description: 'Shelsea could not add this product to your cart. Please try again.'
        });

        return;
      }
    },
    [addCartItem, error]
  );
  const cartProductIds = useMemo(() => [...new Set(cartItems.map(item => item.productId))], [cartItems]);

  // ============================================================
  // ROUTING
  // ============================================================

  const router = useRouter();
  const searchParams = useSearchParams();
  const routeBase = vendorStorefront ? `/vendors/${encodeURIComponent(vendorStorefront.slug)}` : '/discover';
  const scopedProducts = vendorStorefront?.products ?? catalogProducts;
  const scopedCategories = useMemo(() => vendorStorefront
    ? catalogCategories.filter(category => category.slug === 'all' || scopedProducts.some(product => product.category === category.slug))
    : catalogCategories, [catalogCategories, scopedProducts, vendorStorefront]);
  const scopedPromos: Promo[] = useMemo(() => vendorStorefront
    ? vendorStorefront.promotions.map(promotion => ({
        id: promotion.id,
        slug: promotion.slug,
        title: promotion.title,
        description: promotion.description ?? undefined,
        type: 'sale',
        layout: 'card',
        badge: promotion.badge,
        productIds: promotion.productIds,
        image: promotion.imageUrl ?? undefined,
        href: promotion.href,
        active: true,
        priority: 1
      }))
    : promos, [vendorStorefront]);
  const vendorShowcase = useMemo(() => vendorStorefront ? {
    stories: vendorStorefront.stories,
    banners: vendorStorefront.banners.map((banner, position) => ({
      id: banner.id,
      campaignId: banner.id,
      mediaType: 'image' as const,
      mediaUrl: banner.mediaUrl,
      mobileMediaUrl: banner.mobileMediaUrl,
      posterUrl: null,
      eyebrow: vendorStorefront.name,
      title: banner.title,
      description: banner.description,
      primaryAction: { label: 'Explore products', href: `${routeBase}#products` },
      secondaryAction: null,
      autoplay: true,
      durationMs: Math.max(3500, banner.durationSeconds * 1000),
      position
    }))
  } : undefined, [vendorStorefront, routeBase]);

  const selectedCategory = searchParams.get('category') ?? 'all';
  const selectedCollectionId = searchParams.get('collection');
  const selectedProductId = searchParams.get('product');
  const selectedPromotionId = searchParams.get('promotion');
  const selectedView = searchParams.get('view');

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      if ('category' in updates) {
        params.delete('collection');
        params.delete('product');
        params.delete('promotion');
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all') {
          params.delete(key);
          return;
        }

        params.set(key, value);
      });

      const query = params.toString();

      router.push(query ? `${routeBase}?${query}` : routeBase, {
        scroll: false
      });
    },
    [router, searchParams, routeBase]
  );

  // ============================================================
  // IDENTITY-BASED EXPERIENCE PROFILE
  // ============================================================

  const normalizedTier = user?.tier?.toLowerCase() ?? 'guest';

  const activeProfileId: MockExperienceProfileId = !isAuthenticated
    ? 'guest'
    : normalizedTier === 'premium'
      ? 'premium'
      : 'shopper';

  const activeProfile =
    mockExperienceProfiles.find(profile => profile.id === activeProfileId) ?? mockExperienceProfiles[0];

  // ============================================================
  // PRODUCT PREVIEW
  // ============================================================

  const toggleLike = useCallback(
    (productId: string) => {
      const product = scopedProducts.find(item => item.id === productId);

      void toggleWishlist({
        id: productId,
        name: product?.name
      });
    },
    [scopedProducts, toggleWishlist]
  );

  // ============================================================
  // PROMOTION PREVIEW
  // ============================================================

  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  const [promoOpen, setPromoOpen] = useState(false);

  const previewPromotion = useCallback((promoId: string) => {
    const promotion = scopedPromos.find(item => item.id === promoId);

    if (!promotion) {
      return;
    }

    setSelectedPromo(promotion);

    setPromoOpen(true);
  }, [scopedPromos]);

  const closePromoPreview = useCallback(() => {
    setSelectedPromo(null);
    setPromoOpen(false);
  }, []);

  /**
   * Legacy `/discover?product=` links now resolve into the Hub only.
   *
   * The query remains backward compatible, but it cannot assemble
   * or replace the central Feed with the retired product block.
   */
  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    const product =
      scopedProducts.find(
        candidate =>
          String(candidate.id) ===
            String(selectedProductId) ||
          candidate.slug.toLowerCase() ===
            selectedProductId.toLowerCase()
      );

    if (!product) {
      return;
    }

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
          'feed'
      });
    }

    previewProductInHub({
      productId:
        product.id,

      variantId:
        variant?.id ??
        null,

      source:
        'legacy-route',

      reveal:
        true
    });

    void recordProductView({
      productId:
        product.id
    });
  }, [
    scopedProducts,
    selectedProductId
  ]);

  // ============================================================
  // INITIAL FEED INTENT
  // ============================================================

  const initialIntent = useMemo<FeedIntent>(() => {
    const createdAt = new Date().toISOString();

    if (selectedCollectionId) {
      return {
        id: `collection:${selectedCollectionId}:route`,
        type: 'collection',
        source: 'route',
        targetId: selectedCollectionId,
        route: `${routeBase}?collection=${encodeURIComponent(selectedCollectionId)}`,
        surface: 'collection',
        title: 'Collection experience',
        createdAt
      };
    }

    if (selectedPromotionId) {
      return {
        id: `promotion:${selectedPromotionId}:route`,
        type: 'promotion',
        source: 'route',
        targetId: selectedPromotionId,
        route: `${routeBase}?promotion=${encodeURIComponent(selectedPromotionId)}`,
        surface: 'promotion',
        title: 'Promotion experience',
        createdAt
      };
    }

    return {
      id: `store-discovery:${routeBase}:${selectedCategory}`,
      type: 'store-discovery',
      source: 'route',
      categorySlug: selectedCategory,
      route:
        selectedCategory === 'all'
          ? routeBase
          : `${routeBase}?category=${encodeURIComponent(selectedCategory)}`,
      surface: 'store',
      title: selectedCategory === 'all' ? 'Store discovery' : `Browse ${selectedCategory}`,
      createdAt
    };
  }, [
    selectedCategory,
    selectedCollectionId,
    selectedPromotionId,
    routeBase
  ]);

  // ============================================================
  // FEED CONTEXT
  // ============================================================

  const context = useMemo<FeedContext>(
    () => ({
      vendorShowcase,
      catalog: {
        products: scopedProducts,
        categories: scopedCategories,
        collections: vendorStorefront?.collections ?? catalogCollections,
        promotions: scopedPromos
      },

      user: {
        ...activeProfile.user,

        authenticated: isAuthenticated,

        tier: !isAuthenticated ? 'guest' : normalizedTier === 'premium' ? 'premium' : 'member',

        cartProductIds,

        wishlistProductIds
      },

      activity: activeProfile.activity,

      storeStudio: vendorStorefront ? undefined : storeStudio ?? undefined,

      experience: {
        orders: activeProfile.orders,

        rewards: activeProfile.rewards,

        coupons: activeProfile.coupons,

        intelligence: activeProfile.intelligence,

        promotions: activeProfile.promotions
      },

      environment: {
        locale: 'en-NG',
        currency: 'NGN',
        device: 'desktop',
        now: new Date().toISOString()
      }
    }),
    [activeProfile, scopedCategories, catalogCollections, scopedProducts, scopedPromos, cartProductIds, isAuthenticated, normalizedTier, storeStudio, vendorStorefront, vendorShowcase, wishlistProductIds]
  );

  // ============================================================
  // BASE ACTIONS
  // ============================================================

  const baseActions = useMemo<
    Omit<FeedActions, 'previewProduct' | 'openExperience' | 'restoreExperience' | 'resetExperience'>
  >(
    () => ({
      changeCategory: updateQuery,
      toggleLike,
      addToCart: handleAddToCart,
      previewPromotion
    }),
    [updateQuery, toggleLike, handleAddToCart, previewPromotion]
  );

  // ============================================================
  // DERIVED PRODUCTS
  // ============================================================

  const selectedPromoProducts = useMemo(() => {
    if (!selectedPromo) {
      return [];
    }

    return selectedPromo.productIds
      .map(productId => scopedProducts.find(product => product.id === productId))
      .filter((product): product is ProductType => Boolean(product));
  }, [selectedPromo, scopedProducts]);


  const gridProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return scopedProducts;
    }

    if (selectedCategory === 'deals') {
      return scopedProducts.filter(product => product.discountPercentage > 0);
    }

    return scopedProducts.filter(product => product.category === selectedCategory);
  }, [scopedProducts, selectedCategory]);

  // ============================================================
  // LOADING AND ERROR STATES
  // ============================================================

  if (workspaceLoading || catalogLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="size-6 animate-spin text-primary" />

          <p className="text-sm font-medium text-muted-foreground">Loading Shelsea</p>
        </div>
      </div>
    );
  }

  if (workspaceError || catalogError) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-6 text-center">
        <div>
          <p className="font-semibold">Shelsea is temporarily unavailable</p>

          <p className="mt-2 text-sm text-muted-foreground">{workspaceError ?? catalogError}</p>
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-6 text-center">
        <p className="text-sm text-muted-foreground">Shelsea could not prepare your shopping experience.</p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <FeedExperienceProvider
      initialIntent={initialIntent}
      context={context}
      baseActions={baseActions}
      routeBasePath={routeBase}
      broadcastIntent>
      {selectedView === 'grid' ? (
        <StoreGridDestination
          selectedCategory={selectedCategory}
          products={gridProducts}
          onAddToCart={handleAddToCart}
        />
      ) : (
        <div className={vendorStorefront ? 'min-w-0' : 'min-h-dvh px-3 py-3 md:px-4 md:py-4 lg:h-[calc(100dvh-6.5rem)] lg:min-h-0 lg:overflow-hidden'}>
          <section id={vendorStorefront ? 'products' : undefined} className={vendorStorefront ? 'min-w-0' : 'min-w-0 pb-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-3xl lg:bg-card/50 lg:p-4 lg:scroll-smooth lg:scrollbar-none'}>
            {!vendorStorefront ? <PublicShoppingListRail workspaceId={activeWorkspace.id} /> : null}
            <FeedRenderer vendorStorefront={vendorStorefront} vendorCategories={scopedCategories} selectedVendorCategory={selectedCategory} />
          </section>

          <PromoModal
            promo={selectedPromo}
            products={selectedPromoProducts}
            open={promoOpen}
            onClose={closePromoPreview}
          />

          {canManageStoreStudio &&
          activeWorkspace.id === storeStudioWorkspaceId ? (
            <StorefrontReelComposer products={scopedProducts} />
          ) : null}
        </div>
      )}
    </FeedExperienceProvider>
  );
}

export default function FeedExperienceWorkspace({
  canManageStoreStudio = false,
  storeStudioWorkspaceId = null,
  vendorStorefront
}: FeedExperienceWorkspaceProps) {
  return (
    <FeedExperienceWorkspaceContent
      canManageStoreStudio={canManageStoreStudio}
      storeStudioWorkspaceId={storeStudioWorkspaceId}
      vendorStorefront={vendorStorefront}
    />
  );
}
