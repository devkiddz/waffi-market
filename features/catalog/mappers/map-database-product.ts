import type {
  Product as DatabaseProduct,
  ProductImage,
  ProductVariant,
  Inventory
} from '@/lib/generated/prisma/client';

import type {
  ProductType
} from '@/types/types';

type DatabaseVariant =
  ProductVariant & {
    inventory: Inventory | null;
  };

type DatabaseProductWithRelations =
  DatabaseProduct & {
    category: {
      slug: string;
    };

    subcategory: {
      slug: string;
    } | null;

    images: ProductImage[];
    variants: DatabaseVariant[];

    vendorProfile: {
      id: string;
      slug: string;
      name: string;

      logoMediaAsset: {
        secureUrl: string;
      } | null;
    } | null;
  };

function decodeAssetSegment(
  segment: string
): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Local public assets may contain characters such as `#`.
 * In a browser URL, `#` begins a fragment and is not part of the
 * requested pathname. Encode each local path segment so the complete
 * filename reaches Next.js and the static asset server.
 *
 * Remote, data and blob URLs are left untouched.
 */
function normalizeProductAssetUrl(
  value: string | null | undefined
): string {
  const trimmed =
    value?.trim() ?? '';

  if (
    !trimmed ||
    !trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  return trimmed
    .split('/')
    .map(
      (
        segment,
        index
      ) =>
        index === 0
          ? ''
          : encodeURIComponent(
              decodeAssetSegment(segment)
            )
    )
    .join('/');
}

/* SHELSEA_CATALOG_VARIANT_COLOR_V1 */
export function mapDatabaseProduct(
  product: DatabaseProductWithRelations
): ProductType {
  const orderedImages =
    [...product.images].sort(
      (
        firstImage,
        secondImage
      ) =>
        firstImage.position -
        secondImage.position
    );

  const primaryImage =
    orderedImages.find(
      image => image.primary
    ) ??
    orderedImages[0] ??
    null;

  const primaryImageUrl =
    normalizeProductAssetUrl(
      primaryImage?.url
    );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,

    ownership:
      product.vendorProfile
        ? 'vendor'
        : 'platform',

    ...(product.vendorProfile
      ? {
          merchant: {
            id:
              product.vendorProfile.id,

            slug:
              product.vendorProfile.slug,

            name:
              product.vendorProfile.name,

            ...(product.vendorProfile
              .logoMediaAsset
              ?.secureUrl
              ? {
                  logoUrl:
                    product.vendorProfile
                      .logoMediaAsset
                      .secureUrl
                }
              : {})
          }
        }
      : {}),

    shortDescription:
      product.shortDescription ?? '',

    longDescription:
      product.longDescription ?? '',

    category:
      product.category.slug,

    ...(product.subcategory?.slug
      ? {
          subcategory:
            product.subcategory.slug
        }
      : {}),

    tags:
      product.tags,

    /* AJ_PRODUCT_PAGE_GALLERY_ASSETS_V1 */
    images:
      orderedImages
        .map(
          image =>
            normalizeProductAssetUrl(
              image.url
            )
        )
        .filter(
          (
            imageUrl
          ): imageUrl is string =>
            Boolean(
              imageUrl
            )
        ),

    variants:
      [...product.variants]
        .sort(
          (
            firstVariant,
            secondVariant
          ) =>
            firstVariant.position -
            secondVariant.position
        )
        .map(
          variant => ({
            id:
              variant.id,

            label:
              variant.label,


            ...(variant.color
              ? {
                  color: variant.color
                }
              : {}),

            ...(variant.colorHex
              ? {
                  colorHex: variant.colorHex
                }
              : {}),
            image:
              normalizeProductAssetUrl(
                variant.image
              ) ||
              primaryImageUrl,

            price:
              Number(variant.price),

            stockLeft:
              variant.inventory
                ?.quantity ?? 0
          })
        ),

    rating:
      product.rating,

    reviews:
      product.reviewsCount,

    soldCount:
      product.soldCount,

    liked:
      false,

    featured:
      product.featured,

    isNew:
      product.isNew,

    estimatedDelivery:
      product.estimatedDelivery ??
      'Delivery details unavailable',

    discountPercentage:
      product.discountPercentage
  };
}
