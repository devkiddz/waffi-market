import { resolveReviewsModuleData } from '@/features/reviews/reviewResolver';

import {
  resolveProductRelationships
} from '@/features/products/resolution';

import type { ProductType } from '@/types/types';

import type {
  FeedContext,
  FeedExperience,
  FeedIntent,
  FeedModule,
  ProductExperienceCategoryPresentation
} from '../contracts';

import { selectActivePromotions } from '../selectors';

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatLabel(value: string): string {
  return normalizeToken(value)
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function uniqueProducts(products: ProductType[]): ProductType[] {
  return Array.from(
    new Map(
      products.map(product => [
        product.id,
        product
      ])
    ).values()
  );
}

function resolveContextDate(value: string): Date {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date()
    : date;
}

export function buildProductExperience(
  intent: FeedIntent,
  context: FeedContext
): FeedExperience {
  if (intent.type !== 'product' || !intent.targetId) {
    throw new Error(
      'A valid product intent is required.'
    );
  }

  const { catalog } = context;

  const selectedProduct = catalog.products.find(
    product => product.id === intent.targetId
  );

  if (!selectedProduct) {
    throw new Error(
      `Product "${intent.targetId}" could not be resolved.`
    );
  }

  const selectedCategory = catalog.categories.find(
    category =>
      category.slug === selectedProduct.category
  );

  const categoryCoverImage =
    selectedCategory?.coverImages?.[0] ??
    selectedCategory?.image ??
    selectedProduct.variants[0]?.image;

  const categoryPresentation:
    ProductExperienceCategoryPresentation = {
      slug: selectedProduct.category,

      label:
        selectedCategory?.label ??
        formatLabel(selectedProduct.category),

      ...(categoryCoverImage
        ? {
            coverImage: categoryCoverImage
          }
        : {}),

      ...(selectedCategory?.accentColor
        ? {
            accentColor: selectedCategory.accentColor
          }
        : {})
    };

  const categoryDescription =
    selectedCategory?.description?.trim() ||
    selectedCategory?.shortDescription?.trim() ||
    undefined;

  const {
    similarProducts,
    pairingProducts,
    continueDiscoveryProducts
  } = resolveProductRelationships(
    selectedProduct,
    catalog.products
  );

  const contextDate = resolveContextDate(
    context.environment.now
  );

  const activePromotions = selectActivePromotions(
    catalog.promotions,
    contextDate
  );

  const shortDescription =
    selectedProduct.shortDescription?.trim() ||
    undefined;

  const initialVariantId =
    selectedProduct.variants[0]?.id;

  const reviews = resolveReviewsModuleData({
    targetType: 'product',
    targetId: String(selectedProduct.id),
    targetName: selectedProduct.name,
    averageRating: selectedProduct.rating,
    reviewCount: selectedProduct.reviews,
    locale: context.environment.locale,
    now: context.environment.now,
    canWriteReview: context.user.authenticated
  });

  const modules: FeedModule[] = [
    {
      id: `product-experience-banner:${selectedProduct.id}`,
      type: 'product-experience-banner',
      priority: 1000,

      data: {
        product: selectedProduct,
        category: categoryPresentation,
        title: selectedProduct.name,
        locale: context.environment.locale,
        currency: context.environment.currency,
        showCommerceActions: true,
        showViewDetailsAction: true,

        ...(initialVariantId
          ? {
              initialVariantId
            }
          : {}),

        ...(shortDescription
          ? {
              description: shortDescription
            }
          : {}),

        ...(categoryPresentation.label
          ? {
              eyebrow: categoryPresentation.label
            }
          : {})
      }
    },

    {
      id: `product-details:${selectedProduct.id}`,
      type: 'product-details',
      priority: 900,

      data: {
        product: selectedProduct,
        category: categoryPresentation,
        reviews,
        locale: context.environment.locale,
        currency: context.environment.currency,

        ...(categoryDescription
          ? {
              categoryDescription
            }
          : {})
      }
    }
  ];

  if (pairingProducts.length > 0) {
    modules.push({
      id: `product-pairings:${selectedProduct.id}`,
      type: 'product-rail',
      priority: 800,

      data: {
        title: 'Perfect Pairings',
        subtitle:
          `Selections explicitly matched with ${selectedProduct.name}.`,
        products: pairingProducts,
        source: 'pairing'
      }
    });
  }

  if (similarProducts.length > 0) {
    modules.push({
      id: `similar-products:${selectedProduct.id}`,
      type: 'product-rail',
      priority: 700,

      data: {
        title: 'Similar Products',
        subtitle:
          'More selections from the same category with a related style or character.',
        products: similarProducts,
        source: 'similar'
      }
    });
  }

  if (activePromotions.length > 0) {
    modules.push({
      id: `product-promotions:${selectedProduct.id}`,
      type: 'promotion',
      priority: 500,

      data: {
        promotions: activePromotions,

        products: uniqueProducts([
          selectedProduct,
          ...similarProducts,
          ...pairingProducts
        ])
      }
    });
  }

  if (continueDiscoveryProducts.length > 0) {
    modules.push({
      id: `continue-discovery:${selectedProduct.id}`,
      type: 'product-rail',
      priority: 400,

      data: {
        title: 'Continue Discovering',
        subtitle:
          'Keep exploring selections across Shelsea.',
        products: continueDiscoveryProducts,
        source: 'continue-discovery'
      }
    });
  }

  return {
    id: `product-experience-${intent.id}`,
    key: 'product-experience',
    intent,
    context,

    modules: modules.sort(
      (firstModule, secondModule) =>
        secondModule.priority -
        firstModule.priority
    ),

    status: 'resolved',

    resolution: {
      registryKey: 'product-experience',
      reason:
        `Resolved Product Experience for "${selectedProduct.name}".`,
      usedFallback: false
    },

    version: 1,
    createdAt: contextDate.toISOString()
  };
}