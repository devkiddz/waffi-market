import 'dotenv/config';

import { prisma } from '../prisma/seeds/seed-utils';

type PaletteColor = {
  name: string;
  hex: string;
};

const BLACK: PaletteColor = { name: 'Black', hex: '#111111' };
const WHITE: PaletteColor = { name: 'White', hex: '#FFFFFF' };
const ROSE: PaletteColor = { name: 'Rose', hex: '#F43F5E' };
const BURGUNDY: PaletteColor = { name: 'Burgundy', hex: '#800020' };
const NAVY: PaletteColor = { name: 'Navy', hex: '#1E3A5F' };
const SKY: PaletteColor = { name: 'Sky Blue', hex: '#87CEEB' };
const BEIGE: PaletteColor = { name: 'Beige', hex: '#D9C5A5' };
const NUDE: PaletteColor = { name: 'Nude', hex: '#D8B4A0' };
const TAN: PaletteColor = { name: 'Tan', hex: '#D2B48C' };
const GOLD: PaletteColor = { name: 'Gold', hex: '#D4AF37' };
const SILVER: PaletteColor = { name: 'Silver', hex: '#C0C0C0' };
const ROSE_GOLD: PaletteColor = { name: 'Rose Gold', hex: '#B76E79' };
const NATURAL_BLACK: PaletteColor = { name: 'Natural Black', hex: '#1C1917' };
const DARK_BROWN: PaletteColor = { name: 'Dark Brown', hex: '#3F2A20' };

function paletteFor(
  categorySlug: string,
  subcategorySlug: string | null
): PaletteColor[] {
  const category = categorySlug.toLowerCase();
  const subcategory = (subcategorySlug ?? '').toLowerCase();

  if (category === 'perfumes') {
    return [];
  }

  if (category === 'clothing') {
    if (subcategory.includes('men') && !subcategory.includes('women')) {
      return [BLACK, NAVY, WHITE];
    }

    if (subcategory.includes('kid')) {
      return [NAVY, ROSE, SKY];
    }

    if (subcategory.includes('unisex')) {
      return [BLACK, WHITE, BEIGE];
    }

    if (subcategory.includes('underwear') || subcategory.includes('basic')) {
      return [BLACK, WHITE, BEIGE];
    }

    if (subcategory.includes('sock') || subcategory.includes('hosiery')) {
      return [BLACK, WHITE, ROSE];
    }

    return [BLACK, ROSE, BURGUNDY];
  }

  if (category === 'apparel-accessories') {
    if (subcategory.includes('jewel')) {
      return [GOLD, SILVER, ROSE_GOLD];
    }

    if (subcategory.includes('watch')) {
      return [BLACK, SILVER, GOLD];
    }

    if (subcategory.includes('shoe')) {
      return [BLACK, NUDE, WHITE];
    }

    if (subcategory.includes('bag')) {
      return [BLACK, TAN, ROSE];
    }

    return [BLACK, TAN, ROSE];
  }

  if (category === 'hair') {
    if (
      subcategory.includes('wig') ||
      subcategory.includes('extension') ||
      subcategory.includes('braid')
    ) {
      return [NATURAL_BLACK, DARK_BROWN, BURGUNDY];
    }

    if (subcategory.includes('accessor')) {
      return [BLACK, ROSE, BEIGE];
    }

    return [];
  }

  return [];
}

function splitInteger(total: number, parts: number): number[] {
  if (parts <= 0) {
    return [];
  }

  const safeTotal = Math.max(Math.round(total), 0);
  const base = Math.floor(safeTotal / parts);
  const remainder = safeTotal % parts;

  return Array.from(
    { length: parts },
    (_, index) => base + (index < remainder ? 1 : 0)
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function skuSuffix(value: string): string {
  return slug(value)
    .replaceAll('-', '')
    .slice(0, 8)
    .toUpperCase();
}

async function main(): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      active: true,
      mode: 'LIVE'
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!workspace) {
    throw new Error('No active LIVE workspace was found.');
  }

  const products = await prisma.product.findMany({
    where: {
      workspaceId: workspace.id,
      active: true
    },
    select: {
      id: true,
      name: true,
      category: {
        select: {
          slug: true
        }
      },
      subcategory: {
        select: {
          slug: true
        }
      },
      variants: {
        where: {
          active: true
        },
        include: {
          inventory: true
        },
        orderBy: {
          position: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  let expandedProducts = 0;
  let updatedVariants = 0;
  let createdVariants = 0;
  let skippedManagedProducts = 0;

  for (const product of products) {
    const palette = paletteFor(
      product.category.slug,
      product.subcategory?.slug ?? null
    );

    if (palette.length === 0 || product.variants.length === 0) {
      continue;
    }

    /*
     * Once a merchant/admin has authored any explicit color on a product,
     * Studio becomes authoritative and this initializer leaves it alone.
     */
    if (
      product.variants.some(
        variant => Boolean(variant.color?.trim())
      )
    ) {
      skippedManagedProducts += 1;
      continue;
    }

    await prisma.$transaction(async transaction => {
      for (const [baseIndex, variant] of product.variants.entries()) {
        const inventory = variant.inventory;
        const quantities = splitInteger(
          inventory?.quantity ?? 0,
          palette.length
        );
        const reserved = splitInteger(
          Math.min(
            inventory?.reserved ?? 0,
            inventory?.quantity ?? 0
          ),
          palette.length
        );
        const reorderLevels = splitInteger(
          inventory?.reorderLevel ?? 5,
          palette.length
        );

        for (const [colorIndex, color] of palette.entries()) {
          const isOriginal = colorIndex === 0;
          const variantId = isOriginal
            ? variant.id
            : `${variant.id}__color_${slug(color.name)}`;

          const variantSku = isOriginal
            ? variant.sku
            : variant.sku
              ? `${variant.sku}-${skuSuffix(color.name)}`
              : null;

          const position =
            baseIndex * palette.length +
            colorIndex;

          const persisted = await transaction.productVariant.upsert({
            where: {
              id: variantId
            },
            update: {
              label: variant.label,
              color: color.name,
              colorHex: color.hex,
              sku: variantSku,
              image: variant.image,
              mediaAssetId: variant.mediaAssetId,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              active: true,
              position
            },
            create: {
              id: variantId,
              productId: product.id,
              label: variant.label,
              color: color.name,
              colorHex: color.hex,
              sku: variantSku,
              image: variant.image,
              mediaAssetId: variant.mediaAssetId,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              active: true,
              position
            },
            select: {
              id: true
            }
          });

          const nextQuantity = quantities[colorIndex] ?? 0;
          const nextReserved = Math.min(
            reserved[colorIndex] ?? 0,
            nextQuantity
          );
          const nextReorderLevel =
            reorderLevels[colorIndex] ?? 0;

          await transaction.inventory.upsert({
            where: {
              variantId: persisted.id
            },
            update: {
              quantity: nextQuantity,
              reserved: nextReserved,
              reorderLevel: nextReorderLevel
            },
            create: {
              variantId: persisted.id,
              quantity: nextQuantity,
              reserved: nextReserved,
              reorderLevel: nextReorderLevel
            }
          });

          if (isOriginal) {
            updatedVariants += 1;
          } else {
            createdVariants += 1;
          }
        }
      }
    });

    expandedProducts += 1;

    console.log(
      `✓ ${product.name}: ${product.variants.length} base option(s) × ${palette.length} colours`
    );
  }

  console.log('');
  console.log('Shelsea color backfill complete.');
  console.log(`Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`Expanded products: ${expandedProducts}`);
  console.log(`Existing variants assigned a color: ${updatedVariants}`);
  console.log(`New color/SKU variants created: ${createdVariants}`);
  console.log(`Products already managed by Studio and skipped: ${skippedManagedProducts}`);
  console.log('');
  console.log(
    'Perfumes, hair-care-only products and non-color categories were intentionally left unchanged.'
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error('Shelsea color backfill failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
