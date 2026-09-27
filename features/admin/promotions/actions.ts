'use server';

import { revalidatePath } from 'next/cache';

import { createOrResubmitApprovalRequest } from '@/features/admin/approvals/approvalRequestRepository';
import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import { prisma } from '@/lib/prisma';

const ALLOWED_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED'
] as const;

function text(data: FormData, key: string) {
  return String(data.get(key) ?? '').trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dateOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('A promotion date is invalid.');
  return date;
}

function resolveStatus(requested: string, canReview: boolean) {
  const valid = ALLOWED_STATUSES.includes(
    requested as (typeof ALLOWED_STATUSES)[number]
  )
    ? (requested as (typeof ALLOWED_STATUSES)[number])
    : 'DRAFT';

  return valid === 'PUBLISHED' && !canReview ? 'PENDING_REVIEW' : valid;
}

export async function savePromotion(formData: FormData) {
  const access = await requireAdminPermission('promotion:manage');
  const workspaceId = access.membership.workspaceId;
  const id = text(formData, 'id') || null;
  const title = text(formData, 'title');
  const slug = slugify(text(formData, 'slug') || title);
  const status = resolveStatus(
    text(formData, 'status'),
    access.permissions.has('approval:review')
  );
  const type = ([
    'PERCENTAGE',
    'FIXED_AMOUNT',
    'FIXED_PRICE',
    'FEATURED'
  ].includes(text(formData, 'type'))
    ? text(formData, 'type')
    : 'PERCENTAGE') as
    | 'PERCENTAGE'
    | 'FIXED_AMOUNT'
    | 'FIXED_PRICE'
    | 'FEATURED';
  const productIds = Array.from(
    new Set(formData.getAll('productIds').map(String).filter(Boolean))
  );
  const bannerMediaAssetId = text(formData, 'bannerMediaAssetId') || null;
  const vendorProfileId = text(formData, 'vendorProfileId') || null;
  const startsAt = dateOrNull(text(formData, 'startsAt'));
  const endsAt = dateOrNull(text(formData, 'endsAt'));
  const discountText = text(formData, 'discountValue');
  const discountValue = discountText ? Number(discountText) : null;
  const usageText = text(formData, 'usageLimit');
  const usageLimit = usageText
    ? Math.max(1, Math.round(Number(usageText) || 1))
    : null;

  if (!title || !slug) {
    throw new Error('Promotion title and slug are required.');
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error('The promotion end date must be later than its start date.');
  }

  if (
    type !== 'FEATURED' &&
    (discountValue === null || !Number.isFinite(discountValue) || discountValue <= 0)
  ) {
    throw new Error('This promotion type requires a positive discount value.');
  }

  if (type === 'PERCENTAGE' && Number(discountValue) > 100) {
    throw new Error('Percentage discounts cannot exceed 100%.');
  }

  const [products, banner, vendor, conflict] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            workspaceId,
            ...(vendorProfileId ? { vendorProfileId } : {}),
            ...(status === 'PUBLISHED'
              ? { status: 'PUBLISHED' as const, active: true }
              : { status: { not: 'ARCHIVED' as const } })
          },
          select: { id: true }
        })
      : Promise.resolve([]),
    bannerMediaAssetId
      ? prisma.mediaAsset.findFirst({
          where: {
            id: bannerMediaAssetId,
            workspaceId,
            status: 'ACTIVE',
            resourceType: 'IMAGE'
          },
          select: { id: true }
        })
      : Promise.resolve(null),
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
      : Promise.resolve(null),
    prisma.promotion.findFirst({
      where: {
        workspaceId,
        slug,
        ...(id ? { id: { not: id } } : {})
      },
      select: { id: true }
    })
  ]);

  if (products.length !== productIds.length) {
    throw new Error(
      vendorProfileId
        ? 'Vendor promotions can only include products owned by that vendor.'
        : 'One or more selected products are unavailable.'
    );
  }

  if (bannerMediaAssetId && !banner) {
    throw new Error('The selected promotion banner is unavailable.');
  }

  if (
    vendorProfileId &&
    (!vendor || access.membership.workspace.commerceMode !== 'MULTI_VENDOR')
  ) {
    throw new Error('Vendor promotions are unavailable in Single Merchant mode.');
  }

  if (conflict) {
    throw new Error('A promotion with this slug already exists.');
  }

  await prisma.$transaction(async transaction => {
    const data = {
      workspaceId,
      vendorProfileId,
      bannerMediaAssetId,
      title,
      slug,
      description: text(formData, 'description') || null,
      type,
      status,
      active: status === 'PUBLISHED' && formData.get('active') === 'on',
      discountValue: type === 'FEATURED' ? null : discountValue,
      code: text(formData, 'code').toUpperCase() || null,
      usageLimit,
      priority: Math.min(
        100,
        Math.max(-100, Math.round(Number(text(formData, 'priority')) || 0))
      ),
      startsAt,
      endsAt
    };

    const promotion = id
      ? await transaction.promotion.update({
          where: { id, workspaceId },
          data,
          select: { id: true }
        })
      : await transaction.promotion.create({
          data,
          select: { id: true }
        });

    await transaction.promotionProduct.deleteMany({
      where: { promotionId: promotion.id }
    });

    if (productIds.length) {
      await transaction.promotionProduct.createMany({
        data: productIds.map((productId, position) => ({
          promotionId: promotion.id,
          productId,
          position,
          discountPercentage:
            type === 'PERCENTAGE' ? Math.round(Number(discountValue)) : null,
          promotionalPrice: type === 'FIXED_PRICE' ? discountValue : null
        }))
      });
    }

    if (status === 'PENDING_REVIEW') {
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'PROMOTION',
        targetId: promotion.id,
        reason: `Publish ${title} from Promotion Studio.`
      });
    }

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId,
        actorId: access.session.user.id,
        action: id ? 'PROMOTION_UPDATED' : 'PROMOTION_CREATED',
        targetType: 'PROMOTION',
        targetId: promotion.id,
        summary: `${title} was ${id ? 'updated' : 'created'} in Promotion Studio.`
      }
    });
  });

  revalidatePath('/admin/promotions');
  revalidatePath('/admin/approvals');
  revalidatePath('/vendor/promotions');
  revalidatePath('/store');
  revalidatePath('/vendors');
}

export async function setPromotionStatus(formData: FormData) {
  const access = await requireAdminPermission('promotion:manage');
  const id = text(formData, 'id');
  const status = resolveStatus(
    text(formData, 'status'),
    access.permissions.has('approval:review')
  );

  if (!id) throw new Error('A promotion is required.');

  const promotion = await prisma.promotion.findFirst({
    where: { id, workspaceId: access.membership.workspaceId },
    select: { id: true, vendorProfileId: true }
  });

  if (!promotion) throw new Error('The promotion was not found.');

  if (
    status === 'PUBLISHED' &&
    promotion.vendorProfileId &&
    access.membership.workspace.commerceMode !== 'MULTI_VENDOR'
  ) {
    throw new Error('Multi Vendor mode must be active before publishing this promotion.');
  }

  await prisma.promotion.update({
    where: { id },
    data: { status, active: status === 'PUBLISHED' }
  });

  revalidatePath('/admin/promotions');
  revalidatePath('/admin/approvals');
  revalidatePath('/vendor/promotions');
  revalidatePath('/store');
  revalidatePath('/vendors');
}
