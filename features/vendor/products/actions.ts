'use server';

/* SHELSEA_VENDOR_PRODUCT_COLOR_AUTHORITY_V1 */

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type {
  ProductStudioVariant
} from '@/features/admin/products/ProductStudioFields';
import {
  cancelApprovalRequestsForTarget,
  createOrResubmitApprovalRequest
} from '@/features/admin/approvals/approvalRequestRepository';
import { requireVendorPermission } from '@/features/vendor/auth/vendorAccess';
import {
  assertVendorStudioQuotaAvailable,
  lockVendorStudioQuota
} from '@/features/vendor/entitlements';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseVariants(formData: FormData): ProductStudioVariant[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text(formData, 'variantsJson') || '[]');
  } catch {
    throw new Error('The product variant configuration is invalid.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('At least one variant is required.');
  }

  const variants = parsed.map((value, index) => {
    const variant = value as Partial<ProductStudioVariant>;
    const label = String(variant.label ?? '').trim();
    const color = String(variant.color ?? '').trim();
    const rawColorHex = String(variant.colorHex ?? '').trim();
    const colorHex = rawColorHex ? rawColorHex.toUpperCase() : '';

    if (colorHex && !/^#[0-9A-F]{6}$/.test(colorHex)) {
      throw new Error(
        `Variant ${index + 1} colour code must use #RRGGBB format.`
      );
    }
    const sku = String(variant.sku ?? '').trim().toUpperCase();
    const price = Number(variant.price);
    const rawCompareAtPrice = variant.compareAtPrice as unknown;
    const compareAtPrice =
      rawCompareAtPrice === null ||
      rawCompareAtPrice === undefined ||
      rawCompareAtPrice === ''
        ? null
        : Number(rawCompareAtPrice);

    if (!label || !Number.isFinite(price) || price < 0) {
      throw new Error(
        `Variant ${index + 1} requires a label and a valid non-negative price.`
      );
    }

    if (
      compareAtPrice !== null &&
      (!Number.isFinite(compareAtPrice) || compareAtPrice < price)
    ) {
      throw new Error(
        `Variant ${index + 1} compare-at price must be equal to or greater than its selling price.`
      );
    }

    return {
      id: variant.id ? String(variant.id) : undefined,
      label,
      color,
      colorHex,
      sku,
      price,
      compareAtPrice,
      mediaAssetId: variant.mediaAssetId
        ? String(variant.mediaAssetId)
        : null,
      quantity: Math.max(Math.round(Number(variant.quantity) || 0), 0),
      reserved: 0,
      reorderLevel: Math.max(
        Math.round(Number(variant.reorderLevel) || 0),
        0
      ),
      active: Boolean(variant.active)
    } satisfies ProductStudioVariant;
  });

  const skus = variants.map(variant => variant.sku).filter(Boolean);

  if (new Set(skus).size !== skus.length) {
    throw new Error('Each product variant must use a unique SKU.');
  }

  return variants;
}

async function resolveInput(formData: FormData, productId?: string) {
  const access = await requireVendorPermission('product:manage');

  if (!access.studio.capabilities.products) {
    throw new Error(
      `Product Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  const workspaceId = access.workspace.id;
  const vendorProfileId = access.vendor.id;
  const name = text(formData, 'name');
  const slug = slugify(text(formData, 'slug') || name);
  const categoryId = text(formData, 'categoryId');
  const subcategoryId = text(formData, 'subcategoryId') || null;
  const brandId = text(formData, 'brandId') || null;

  if (!name || !slug || !categoryId) {
    throw new Error('Name, slug and category are required.');
  }

  const [category, subcategory, brand] = await Promise.all([
    prisma.category.findFirst({
      where: { id: categoryId, active: true },
      select: { id: true }
    }),
    subcategoryId
      ? prisma.subcategory.findFirst({
          where: { id: subcategoryId, categoryId, active: true },
          select: { id: true }
        })
      : null,
    brandId
      ? prisma.brand.findFirst({
          where: { id: brandId, active: true },
          select: { id: true }
        })
      : null
  ]);

  if (!category) {
    throw new Error('The selected category is unavailable.');
  }

  if (subcategoryId && !subcategory) {
    throw new Error('The selected subcategory is unavailable.');
  }

  if (brandId && !brand) {
    throw new Error('The selected brand is unavailable.');
  }

  const mediaSelectionTouched =
    text(formData, 'mediaSelectionTouched') === 'true';
  const mediaAssetIds = uniqueValues(
    formData.getAll('mediaAssetIds').map(value => String(value))
  );
  const media = mediaAssetIds.length
    ? await prisma.mediaAsset.findMany({
        where: {
          id: { in: mediaAssetIds },
          workspaceId,
          vendorProfileId,
          status: 'ACTIVE',
          resourceType: 'IMAGE'
        },
        select: { id: true, secureUrl: true }
      })
    : [];
  const mediaById = new Map(media.map(asset => [asset.id, asset]));

  if (media.length !== mediaAssetIds.length) {
    throw new Error('One or more selected product images are unavailable.');
  }

  const variants = parseVariants(formData);
  const variantMediaIds = uniqueValues(
    variants
      .map(variant => variant.mediaAssetId)
      .filter((value): value is string => Boolean(value))
  );
  const missingVariantMedia = variantMediaIds.filter(id => !mediaById.has(id));

  if (missingVariantMedia.length) {
    const extra = await prisma.mediaAsset.findMany({
      where: {
        id: { in: missingVariantMedia },
        workspaceId,
        vendorProfileId,
        status: 'ACTIVE',
        resourceType: 'IMAGE'
      },
      select: { id: true, secureUrl: true }
    });

    extra.forEach(asset => mediaById.set(asset.id, asset));
  }

  if (variantMediaIds.some(id => !mediaById.has(id))) {
    throw new Error('A selected variant image is unavailable.');
  }

  const requestedStatus = text(formData, 'status');
  const status =
    requestedStatus === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'DRAFT';

  const retainedImageCount =
    productId && !mediaSelectionTouched
      ? await prisma.productImage.count({
          where: {
            productId,
            product: { workspaceId, vendorProfileId }
          }
        })
      : 0;

  if (status === 'PENDING_REVIEW') {
    if (mediaAssetIds.length === 0 && retainedImageCount === 0) {
      throw new Error('Add at least one product image before submitting for approval.');
    }

    if (!variants.some(variant => variant.active)) {
      throw new Error('At least one product variant must be active before submission.');
    }
  }

  return {
    access,
    workspaceId,
    vendorProfileId,
    mediaAssetIds,
    mediaById,
    mediaSelectionTouched,
    variants,
    data: {
      workspaceId,
      vendorProfileId,
      name,
      slug,
      categoryId,
      subcategoryId,
      brandId,
      shortDescription: text(formData, 'shortDescription') || null,
      longDescription: text(formData, 'longDescription') || null,
      estimatedDelivery: text(formData, 'estimatedDelivery') || null,
      tags: uniqueValues(
        text(formData, 'tags')
          .split(',')
          .map(tag => tag.trim().toLowerCase())
      ),
      featured: false,
      isNew: formData.get('isNew') === 'on',
      active: false,
      status: status as 'DRAFT' | 'PENDING_REVIEW',
      discountPercentage: Math.min(
        Math.max(
          Math.round(Number(text(formData, 'discountPercentage')) || 0),
          0
        ),
        100
      ),
      submittedAt: status === 'PENDING_REVIEW' ? new Date() : null,
      approvedAt: null
    }
  };
}

async function assertSkuAvailability(
  variants: ProductStudioVariant[],
  productId?: string
): Promise<void> {
  const skus = variants.map(variant => variant.sku).filter(Boolean);

  if (!skus.length) {
    return;
  }

  const conflict = await prisma.productVariant.findFirst({
    where: {
      sku: { in: skus },
      ...(productId ? { productId: { not: productId } } : {})
    },
    select: { sku: true }
  });

  if (conflict?.sku) {
    throw new Error(`SKU ${conflict.sku} is already assigned to another product.`);
  }
}

async function writeRelations(
  transaction: Prisma.TransactionClient,
  productId: string,
  input: Awaited<ReturnType<typeof resolveInput>>,
  editing: boolean
): Promise<void> {
  if (!editing || input.mediaSelectionTouched) {
    await transaction.productImage.deleteMany({ where: { productId } });

    if (input.mediaAssetIds.length) {
      await transaction.productImage.createMany({
        data: input.mediaAssetIds.map((mediaAssetId, position) => ({
          productId,
          mediaAssetId,
          url: input.mediaById.get(mediaAssetId)!.secureUrl,
          position,
          primary: position === 0
        }))
      });
    }
  }

  const existing = editing
    ? await transaction.productVariant.findMany({
        where: { productId },
        select: {
          id: true,
          sku: true,
          inventory: {
            select: {
              id: true,
              quantity: true,
              reserved: true
            }
          }
        }
      })
    : [];
  const existingById = new Map(existing.map(variant => [variant.id, variant]));
  const resolvedVariants = input.variants.map(variant => ({
    ...variant,
    resolvedId:
      variant.id && existingById.has(variant.id)
        ? variant.id
        : randomUUID()
  }));
  const retained = new Set(resolvedVariants.map(variant => variant.resolvedId));
  const removed = existing.filter(variant => !retained.has(variant.id));

  if (removed.length) {
    await transaction.productVariant.updateMany({
      where: {
        id: { in: removed.map(variant => variant.id) },
        productId
      },
      data: {
        active: false,
        sku: null
      }
    });
  }

  for (const [position, variant] of resolvedVariants.entries()) {
    const current = existingById.get(variant.resolvedId);
    const media = variant.mediaAssetId
      ? input.mediaById.get(variant.mediaAssetId)
      : null;

    await transaction.productVariant.upsert({
      where: { id: variant.resolvedId },
      update: {
        label: variant.label,
        color: variant.color || null,
        colorHex: variant.colorHex || null,
        sku: variant.sku || null,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        mediaAssetId: variant.mediaAssetId,
        image: media?.secureUrl ?? null,
        active: variant.active,
        position
      },
      create: {
        id: variant.resolvedId,
        productId,
        label: variant.label,
        color: variant.color || null,
        colorHex: variant.colorHex || null,
        sku: variant.sku || null,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        mediaAssetId: variant.mediaAssetId,
        image: media?.secureUrl ?? null,
        active: variant.active,
        position
      }
    });

    const previousQuantity = current?.inventory?.quantity ?? 0;
    const nextReserved = Math.min(current?.inventory?.reserved ?? 0, variant.quantity);
    const inventory = await transaction.inventory.upsert({
      where: { variantId: variant.resolvedId },
      update: {
        quantity: variant.quantity,
        reserved: nextReserved,
        reorderLevel: variant.reorderLevel
      },
      create: {
        variantId: variant.resolvedId,
        quantity: variant.quantity,
        reserved: 0,
        reorderLevel: variant.reorderLevel
      }
    });
    const difference = variant.quantity - previousQuantity;

    if (difference !== 0) {
      await transaction.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: 'ADJUSTMENT',
          quantity: difference,
          reason: 'Vendor Product Studio inventory update',
          reference: `VENDOR:${input.vendorProfileId}:${input.access.session.user.id}`
        }
      });
    }
  }
}

async function synchronizeApproval(
  input: Awaited<ReturnType<typeof resolveInput>>,
  productId: string,
  title: string
): Promise<void> {
  await prisma.$transaction(async transaction => {
    if (input.data.status !== 'PENDING_REVIEW') {
      await cancelApprovalRequestsForTarget(transaction, {
        workspaceId: input.workspaceId,
        actorId: input.access.session.user.id,
        targetType: 'PRODUCT',
        targetId: productId,
        note: 'The vendor returned this product to draft.'
      });
      return;
    }

    await createOrResubmitApprovalRequest(transaction, {
      workspaceId: input.workspaceId,
      requestedById: input.access.session.user.id,
      source: 'VENDOR',
      action: 'PUBLISH_LIVE',
      targetType: 'PRODUCT',
      targetId: productId,
      reason: `${input.access.vendor.name} submitted ${title} for publication.`,
      payload: { vendorProfileId: input.vendorProfileId }
    });
  });
}

export async function createVendorProduct(formData: FormData): Promise<void> {
  const input = await resolveInput(formData);

  const productLimit = input.access.studio.limits.products;

  const [conflict] = await Promise.all([
    prisma.product.findFirst({
      where: {
        workspaceId: input.workspaceId,
        slug: input.data.slug
      },
      select: { id: true }
    }),
    assertSkuAvailability(input.variants)
  ]);

  if (conflict) {
    throw new Error('A product with this slug already exists.');
  }

  const product = await prisma.$transaction(async transaction => {
    if (productLimit !== null) {
      await lockVendorStudioQuota(transaction, input.vendorProfileId);

      const currentProductCount = await transaction.product.count({
        where: {
          workspaceId: input.workspaceId,
          vendorProfileId: input.vendorProfileId,
          status: { not: 'ARCHIVED' }
        }
      });

      assertVendorStudioQuotaAvailable({
        current: currentProductCount,
        limit: productLimit,
        message: `This Vendor Studio tier allows up to ${productLimit} product${productLimit === 1 ? '' : 's'}.`
      });
    }

    const created = await transaction.product.create({
      data: {
        id: randomUUID(),
        ...input.data
      },
      select: { id: true }
    });

    await writeRelations(transaction, created.id, input, false);
    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.access.session.user.id,
        action:
          input.data.status === 'PENDING_REVIEW'
            ? 'VENDOR_PRODUCT_SUBMITTED'
            : 'VENDOR_PRODUCT_CREATED',
        targetType: 'PRODUCT',
        targetId: created.id,
        summary: `${input.access.vendor.name} ${
          input.data.status === 'PENDING_REVIEW' ? 'submitted' : 'created'
        } ${input.data.name}.`,
        metadata: {
          vendorProfileId: input.vendorProfileId,
          vendorStudioTier: input.access.studio.tier,
          variantCount: input.variants.length,
          imageCount: input.mediaAssetIds.length
        }
      }
    });

    return created;
  });

  await synchronizeApproval(input, product.id, input.data.name);
  revalidatePath('/vendor/products');
  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/products');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/inventory');
  redirect(`/vendor/products/${product.id}`);
}

export async function updateVendorProduct(
  productId: string,
  formData: FormData
): Promise<void> {
  const input = await resolveInput(formData, productId);
  const [owned, conflict] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId: input.workspaceId,
        vendorProfileId: input.vendorProfileId,
        status: { not: 'ARCHIVED' }
      },
      select: { id: true, status: true }
    }),
    prisma.product.findFirst({
      where: {
        workspaceId: input.workspaceId,
        slug: input.data.slug,
        id: { not: productId }
      },
      select: { id: true }
    }),
    assertSkuAvailability(input.variants, productId)
  ]);

  if (!owned) {
    throw new Error('This vendor product was not found.');
  }

  if (conflict) {
    throw new Error('A product with this slug already exists.');
  }

  await prisma.$transaction(async transaction => {
    await transaction.product.update({
      where: { id: productId },
      data: input.data
    });
    await writeRelations(transaction, productId, input, true);
    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.access.session.user.id,
        action:
          input.data.status === 'PENDING_REVIEW'
            ? 'VENDOR_PRODUCT_SUBMITTED'
            : 'VENDOR_PRODUCT_UPDATED',
        targetType: 'PRODUCT',
        targetId: productId,
        summary: `${input.access.vendor.name} ${
          input.data.status === 'PENDING_REVIEW' ? 'submitted' : 'updated'
        } ${input.data.name}.`,
        metadata: {
          previousStatus: owned.status,
          nextStatus: input.data.status,
          vendorProfileId: input.vendorProfileId,
          vendorStudioTier: input.access.studio.tier,
          variantCount: input.variants.length,
          imageCount: input.mediaAssetIds.length
        }
      }
    });
  });

  await synchronizeApproval(input, productId, input.data.name);
  revalidatePath('/vendor/products');
  revalidatePath(`/vendor/products/${productId}`);
  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/products');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/inventory');
}
