'use server';

/* SHELSEA_ADMIN_PRODUCT_COLOR_AUTHORITY_V1 */

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  cancelApprovalRequestsForTarget,
  createOrResubmitApprovalRequest
} from '@/features/admin/approvals/approvalRequestRepository';
import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

import type { ProductStudioVariant } from './ProductStudioFields';

const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED'
] as const;

type ProductStudioStatus = (typeof PRODUCT_STATUSES)[number];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function normalizedSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function boundedInteger(
  value: string,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(Math.round(Number(value) || 0), minimum),
    maximum
  );
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
    throw new Error('At least one product variant is required.');
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
      reserved: Math.max(Math.round(Number(variant.reserved) || 0), 0),
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

async function resolveProductInput(
  formData: FormData,
  permission: 'product:create' | 'product:update',
  productId?: string
) {
  const access = await requireAdminPermission(permission);
  const workspaceId = access.membership.workspaceId;
  const name = text(formData, 'name');
  const slug = normalizedSlug(text(formData, 'slug') || name);
  const categoryId = text(formData, 'categoryId');
  const subcategoryId = text(formData, 'subcategoryId') || null;
  const brandId = text(formData, 'brandId') || null;
  const vendorProfileId = text(formData, 'vendorProfileId') || null;
  const requestedStatus = text(formData, 'status');
  const normalizedStatus = PRODUCT_STATUSES.includes(
    requestedStatus as ProductStudioStatus
  )
    ? (requestedStatus as ProductStudioStatus)
    : 'DRAFT';
  const canReview = access.permissions.has('approval:review');
  const effectiveStatus: ProductStudioStatus = canReview
    ? normalizedStatus
    : normalizedStatus === 'DRAFT'
      ? 'DRAFT'
      : 'PENDING_REVIEW';

  if (!name || !slug || !categoryId) {
    throw new Error('Name, slug and category are required.');
  }

  const [category, subcategory, brand, vendor] = await Promise.all([
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
      : null,
    vendorProfileId
      ? prisma.vendorProfile.findFirst({
          where: {
            id: vendorProfileId,
            workspaceId,
            status: 'ACTIVE',
            active: true
          },
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

  if (
    vendorProfileId &&
    (!vendor || access.membership.workspace.commerceMode !== 'MULTI_VENDOR')
  ) {
    throw new Error(
      'Vendor assignment is unavailable while Multi Vendor mode is disabled.'
    );
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
          status: 'ACTIVE',
          resourceType: 'IMAGE',
          ...(vendorProfileId
            ? { OR: [{ vendorProfileId: null }, { vendorProfileId }] }
            : { vendorProfileId: null })
        },
        select: { id: true, secureUrl: true }
      })
    : [];
  const mediaById = new Map(media.map(asset => [asset.id, asset]));

  if (media.length !== mediaAssetIds.length) {
    throw new Error(
      'One or more selected product images are unavailable for this product owner.'
    );
  }

  const variants = parseVariants(formData);
  const variantMediaIds = uniqueValues(
    variants
      .map(variant => variant.mediaAssetId)
      .filter((value): value is string => Boolean(value))
  );
  const missingVariantMediaIds = variantMediaIds.filter(
    id => !mediaById.has(id)
  );

  if (missingVariantMediaIds.length) {
    const additional = await prisma.mediaAsset.findMany({
      where: {
        id: { in: missingVariantMediaIds },
        workspaceId,
        status: 'ACTIVE',
        resourceType: 'IMAGE',
        ...(vendorProfileId
          ? { OR: [{ vendorProfileId: null }, { vendorProfileId }] }
          : { vendorProfileId: null })
      },
      select: { id: true, secureUrl: true }
    });

    additional.forEach(asset => mediaById.set(asset.id, asset));
  }

  if (variantMediaIds.some(id => !mediaById.has(id))) {
    throw new Error('A selected variant image is unavailable for this product owner.');
  }

  const retainedImageCount =
    permission === 'product:update' &&
    productId &&
    !mediaSelectionTouched
      ? await prisma.productImage.count({
          where: {
            productId,
            product: { workspaceId }
          }
        })
      : 0;

  if (
    ['PUBLISHED', 'PENDING_REVIEW'].includes(effectiveStatus) &&
    mediaAssetIds.length === 0 &&
    retainedImageCount === 0
  ) {
    throw new Error('Add at least one product image before publishing or submitting.');
  }

  if (
    ['PUBLISHED', 'PENDING_REVIEW'].includes(effectiveStatus) &&
    !variants.some(variant => variant.active)
  ) {
    throw new Error('At least one product variant must be active before publishing or submitting.');
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
      name,
      slug,
      categoryId,
      subcategoryId,
      brandId,
      vendorProfileId,
      shortDescription: text(formData, 'shortDescription') || null,
      longDescription: text(formData, 'longDescription') || null,
      estimatedDelivery: text(formData, 'estimatedDelivery') || null,
      tags: uniqueValues(
        text(formData, 'tags')
          .split(',')
          .map(tag => tag.trim().toLowerCase())
      ),
      featured: formData.get('featured') === 'on',
      isNew: formData.get('isNew') === 'on',
      active:
        effectiveStatus === 'PUBLISHED' && formData.get('active') === 'on',
      status: effectiveStatus,
      discountPercentage: boundedInteger(
        text(formData, 'discountPercentage'),
        0,
        100
      ),
      submittedAt: effectiveStatus === 'PENDING_REVIEW' ? new Date() : null,
      approvedAt: effectiveStatus === 'PUBLISHED' ? new Date() : null
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

async function writeProductRelations(
  transaction: Prisma.TransactionClient,
  productId: string,
  input: Awaited<ReturnType<typeof resolveProductInput>>,
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

  const existingVariants = editing
    ? await transaction.productVariant.findMany({
        where: { productId },
        select: {
          id: true,
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
  const existingById = new Map(
    existingVariants.map(variant => [variant.id, variant])
  );
  const resolvedVariants = input.variants.map(variant => ({
    ...variant,
    resolvedId:
      variant.id && existingById.has(variant.id)
        ? variant.id
        : randomUUID()
  }));
  const retainedIds = new Set(
    resolvedVariants.map(variant => variant.resolvedId)
  );
  const removedIds = existingVariants
    .map(variant => variant.id)
    .filter(id => !retainedIds.has(id));

  if (removedIds.length) {
    await transaction.productVariant.updateMany({
      where: { id: { in: removedIds }, productId },
      data: { active: false, sku: null }
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
        image: media?.secureUrl ?? null,
        mediaAssetId: variant.mediaAssetId,
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
        image: media?.secureUrl ?? null,
        mediaAssetId: variant.mediaAssetId,
        active: variant.active,
        position
      }
    });

    const previousQuantity = current?.inventory?.quantity ?? 0;
    const nextReserved = Math.min(variant.reserved, variant.quantity);
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
        reserved: nextReserved,
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
          reason: 'Admin Product Studio inventory update',
          reference: `ADMIN:${input.access.session.user.id}`
        }
      });
    }
  }
}

async function synchronizeProductApproval(
  transaction: Prisma.TransactionClient,
  input: Awaited<ReturnType<typeof resolveProductInput>>,
  productId: string
): Promise<void> {
  if (input.data.status !== 'PENDING_REVIEW') {
    await cancelApprovalRequestsForTarget(transaction, {
      workspaceId: input.workspaceId,
      actorId: input.access.session.user.id,
      targetType: 'PRODUCT',
      targetId: productId,
      note: 'The product no longer requires publication approval.'
    });
    return;
  }

  await createOrResubmitApprovalRequest(transaction, {
    workspaceId: input.workspaceId,
    requestedById: input.access.session.user.id,
    source: input.vendorProfileId ? 'VENDOR' : 'ADMIN',
    action: 'PUBLISH_LIVE',
    targetType: 'PRODUCT',
    targetId: productId,
    reason: `Publish the latest ${input.data.name} changes from Product Studio.`,
    payload: input.vendorProfileId
      ? { vendorProfileId: input.vendorProfileId }
      : undefined
  });
}

export async function createProduct(formData: FormData): Promise<void> {
  const input = await resolveProductInput(formData, 'product:create');
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
    throw new Error(
      'A product with this slug already exists in the current workspace.'
    );
  }

  const product = await prisma.$transaction(async transaction => {
    const created = await transaction.product.create({
      data: {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        ...input.data
      },
      select: { id: true }
    });

    await writeProductRelations(transaction, created.id, input, false);
    await synchronizeProductApproval(transaction, input, created.id);
    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.access.session.user.id,
        action: 'PRODUCT_CREATED',
        targetType: 'PRODUCT',
        targetId: created.id,
        summary: `${input.data.name} was created in Product Studio.`,
        metadata: {
          status: input.data.status,
          vendorProfileId: input.vendorProfileId,
          variantCount: input.variants.length,
          imageCount: input.mediaAssetIds.length
        }
      }
    });

    return created;
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/analytics');
  revalidatePath('/store');
  revalidatePath('/shops');
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData): Promise<void> {
  const id = text(formData, 'id');

  if (!id) {
    throw new Error('Product ID is required.');
  }

  const input = await resolveProductInput(formData, 'product:update', id);

  const [existing, conflict] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id,
        workspaceId: input.workspaceId,
        status: { not: 'ARCHIVED' }
      },
      select: { id: true, status: true, vendorProfileId: true }
    }),
    prisma.product.findFirst({
      where: {
        workspaceId: input.workspaceId,
        slug: input.data.slug,
        id: { not: id }
      },
      select: { id: true }
    }),
    assertSkuAvailability(input.variants, id)
  ]);

  if (!existing) {
    throw new Error('The selected product was not found in this workspace.');
  }

  if (conflict) {
    throw new Error(
      'Another product with this slug already exists in the current workspace.'
    );
  }

  await prisma.$transaction(async transaction => {
    await transaction.product.update({
      where: { id },
      data: input.data
    });
    await writeProductRelations(transaction, id, input, true);
    await synchronizeProductApproval(transaction, input, id);
    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.access.session.user.id,
        action: 'PRODUCT_UPDATED',
        targetType: 'PRODUCT',
        targetId: id,
        summary: `${input.data.name} was updated in Product Studio.`,
        metadata: {
          previousStatus: existing.status,
          nextStatus: input.data.status,
          previousVendorProfileId: existing.vendorProfileId,
          vendorProfileId: input.vendorProfileId,
          variantCount: input.variants.length,
          imageCount: input.mediaAssetIds.length
        }
      }
    });
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/analytics');
  revalidatePath('/store');
  revalidatePath('/shops');
}
