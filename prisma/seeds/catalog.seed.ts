import type { PrismaClient } from '../../lib/generated/prisma/client';

import { categories } from '../../data/categories';
import { products } from '../../data/products';

function resolveImagePath(image: unknown): string | null {
  if (!image) return null;

  if (typeof image === 'string') {
    return image;
  }

  if (
    typeof image === 'object' &&
    image !== null &&
    'src' in image &&
    typeof image.src === 'string'
  ) {
    return image.src;
  }

  return null;
}

import type { LucideIcon } from 'lucide-react';

function resolveIconName(icon: LucideIcon): string | null {
  const iconComponent = icon as LucideIcon & {
    displayName?: string;
    name?: string;
  };

  return iconComponent.displayName ?? iconComponent.name ?? null;
}

export async function seedCatalog(
  prisma: PrismaClient,
  workspaceId: string
): Promise<{
  categories: number;
  subcategories: number;
  products: number;
  variants: number;
  images: number;
  inventories: number;
}> {
  console.log('Seeding Shelsea showcase catalog...');
  const workspace =
  await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      active: true
    },

    select: {
      id: true
    }
  });

if (!workspace) {
  throw new Error(
    `An active workspace with ID "${workspaceId}" was not found.`
  );
}

  let categoryCount = 0;
  let subcategoryCount = 0;
  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let inventoryCount = 0;

  for (const [categoryPosition, category] of categories.entries()) {
    
    await prisma.category.upsert({
      where: {
        slug: category.slug
        
      },

      update: {
        label: category.label,
        iconName: resolveIconName(category.icon),
        image: resolveImagePath(category.image),
        coverImages: category.coverImages
          .map(resolveImagePath)
          .filter((image): image is string => Boolean(image)),
        shortDescription: category.shortDescription,
        description: category.description,
        accentColor: category.accentColor ?? null,
        active: true,
        position: categoryPosition
        
      },

      create: {
        id: category.id,
        slug: category.slug,
        label: category.label,
        iconName: resolveIconName(category.icon),
        image: resolveImagePath(category.image),
        coverImages: category.coverImages
          .map(resolveImagePath)
          .filter((image): image is string => Boolean(image)),
        shortDescription: category.shortDescription,
        description: category.description,
        accentColor: category.accentColor ?? null,
        active: true,
        position: categoryPosition
      }
    });

    categoryCount += 1;

    for (const [subcategoryPosition, subcategory] of category.subcategories.entries()) {
      await prisma.subcategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: subcategory.slug
          }
        },

        update: {
          label: subcategory.label,
          active: true,
          position: subcategoryPosition
        },

        create: {
          categoryId: category.id,
          slug: subcategory.slug,
          label: subcategory.label,
          active: true,
          position: subcategoryPosition
        }
      });

      subcategoryCount += 1;
    }
  }

  for (const product of products) {
   const category = await prisma.category.findUnique({
        where: {
            slug: product.category
        },
            select: {
                id: true
            }
        });

            if (!category) {
            throw new Error(
             `Missing category "${product.category}" for product "${product.name}" (${product.id}).`
        );
    }

    const subcategory = product.subcategory
      ? await prisma.subcategory.findUnique({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: product.subcategory
            }
          },
          select: {
            id: true
          }
        })
      : null;

   await prisma.product.upsert({
  where: {
    id: product.id
  },

  update: {
    workspaceId: workspace.id,

    slug: product.slug,
    name: product.name,

    shortDescription:
      product.shortDescription,

    longDescription:
      product.longDescription,

    categoryId: category.id,

    subcategoryId:
      subcategory?.id ?? null,

    tags: product.tags,

    rating: product.rating,

    reviewsCount:
      product.reviews,

    soldCount:
      product.soldCount,

    featured:
      product.featured,

    isNew:
      product.isNew,

    active: true,

    estimatedDelivery:
      product.estimatedDelivery,

    discountPercentage:
      product.discountPercentage
  },

  create: {
    id: product.id,
    workspaceId: workspace.id,

    slug: product.slug,
    name: product.name,

    shortDescription:
      product.shortDescription,

    longDescription:
      product.longDescription,

    categoryId: category.id,

    subcategoryId:
      subcategory?.id ?? null,

    tags: product.tags,

    rating: product.rating,

    reviewsCount:
      product.reviews,

    soldCount:
      product.soldCount,

    featured:
      product.featured,

    isNew:
      product.isNew,

    active: true,

    estimatedDelivery:
      product.estimatedDelivery,

    discountPercentage:
      product.discountPercentage
  }
});
    productCount += 1;

    for (const [variantPosition, variant] of product.variants.entries()) {
  const databaseVariantId =
    `${product.id}_${variant.id}`.toLowerCase();

  await prisma.productVariant.upsert({
    where: {
      id: databaseVariantId
    },

    update: {
      label: variant.label,
      image: resolveImagePath(variant.image),
      price: variant.price,
      active: true,
      position: variantPosition
    },

    create: {
      id: databaseVariantId,
      productId: product.id,
      label: variant.label,
      image: resolveImagePath(variant.image),
      price: variant.price,
      active: true,
      position: variantPosition
    }
  });

  variantCount += 1;

  await prisma.inventory.upsert({
    where: {
      variantId: databaseVariantId
    },

    update: {
      quantity: variant.stockLeft
    },

    create: {
      variantId: databaseVariantId,
      quantity: variant.stockLeft
    }
  });

  inventoryCount += 1;
}
    const productImages = Array.from(
      new Set(
        product.variants
          .map(variant => resolveImagePath(variant.image))
          .filter((image): image is string => Boolean(image))
      )
    );

    await prisma.productImage.deleteMany({
      where: {
        productId: product.id
      }
    });

    if (productImages.length > 0) {
      await prisma.productImage.createMany({
        data: productImages.map((url, position) => ({
          productId: product.id,
          url,
          alt: product.name,
          position,
          primary: position === 0
        }))
      });

      imageCount += productImages.length;
    }
  }

  console.log(
    `✓ ${categoryCount} categories, ${subcategoryCount} subcategories, ${productCount} products, ${variantCount} variants, ${imageCount} images and ${inventoryCount} inventories ready.`
  );

  return {
    categories: categoryCount,
    subcategories: subcategoryCount,
    products: productCount,
    variants: variantCount,
    images: imageCount,
    inventories: inventoryCount
  };
}