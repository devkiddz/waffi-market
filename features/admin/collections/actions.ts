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
  if (Number.isNaN(date.getTime())) throw new Error('A collection date is invalid.');
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

export async function saveStoreCollection(formData: FormData): Promise<void> {
  const access = await requireAdminPermission('collection:manage');
  const workspaceId = access.membership.workspaceId;
  const id = text(formData, 'id') || null;
  const title = text(formData, 'title');
  const slug = slugify(text(formData, 'slug') || title);
  const status = resolveStatus(
    text(formData, 'status'),
    access.permissions.has('approval:review')
  );
  const submittedProductIds = formData
    .getAll('productIds')
    .map(String)
    .filter(Boolean);
  const featuredProductId = text(formData, 'featuredProductId') || null;
  const productIds = Array.from(
    new Set([
      ...submittedProductIds,
      ...(featuredProductId ? [featuredProductId] : [])
    ])
  );
  const coverMediaAssetId = text(formData, 'coverMediaAssetId') || null;
  const vendorProfileId = text(formData, 'vendorProfileId') || null;
  const startsAt = dateOrNull(text(formData, 'startsAt'));
  const endsAt = dateOrNull(text(formData, 'endsAt'));

  if (!title || !slug) {
    throw new Error('Collection title and slug are required.');
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error('The collection end date must be later than its start date.');
  }

  const [products, cover, vendor, conflict] = await Promise.all([
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
    coverMediaAssetId
      ? prisma.mediaAsset.findFirst({
          where: {
            id: coverMediaAssetId,
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
    prisma.storeCollection.findFirst({
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
        ? 'Vendor collections can only include products owned by that vendor.'
        : 'One or more selected products are unavailable.'
    );
  }

  if (coverMediaAssetId && !cover) {
    throw new Error('The selected cover image is unavailable.');
  }

  if (
    vendorProfileId &&
    (!vendor || access.membership.workspace.commerceMode !== 'MULTI_VENDOR')
  ) {
    throw new Error('Vendor collections are unavailable in Single Merchant mode.');
  }

  if (conflict) {
    throw new Error('A collection with this slug already exists.');
  }

  await prisma.$transaction(async transaction => {
    const data = {
      workspaceId,
      vendorProfileId,
      coverMediaAssetId,
      title,
      slug,
      subtitle: text(formData, 'subtitle') || null,
      description: text(formData, 'description') || null,
      layout: ([
        'FEATURED',
        'CAROUSEL',
        'GRID',
        'SPOTLIGHT'
      ].includes(text(formData, 'layout'))
        ? text(formData, 'layout')
        : 'CAROUSEL') as 'FEATURED' | 'CAROUSEL' | 'GRID' | 'SPOTLIGHT',
      status,
      featuredProductId,
      active: status === 'PUBLISHED' && formData.get('active') === 'on',
      priority: Math.min(
        100,
        Math.max(-100, Math.round(Number(text(formData, 'priority')) || 0))
      ),
      startsAt,
      endsAt
    };

    const record = id
      ? await transaction.storeCollection.update({
          where: { id, workspaceId },
          data,
          select: { id: true }
        })
      : await transaction.storeCollection.create({
          data,
          select: { id: true }
        });

    await transaction.storeCollectionProduct.deleteMany({
      where: { collectionId: record.id }
    });

    if (productIds.length) {
      await transaction.storeCollectionProduct.createMany({
        data: productIds.map((productId, position) => ({
          collectionId: record.id,
          productId,
          position
        }))
      });
    }

    if (status === 'PENDING_REVIEW') {
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'COLLECTION',
        targetId: record.id,
        reason: `Publish ${title} from Collection Studio.`
      });
    }

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId,
        actorId: access.session.user.id,
        action: id ? 'COLLECTION_UPDATED' : 'COLLECTION_CREATED',
        targetType: 'COLLECTION',
        targetId: record.id,
        summary: `${title} was ${id ? 'updated' : 'created'} in Collection Studio.`
      }
    });

    return record;
  });

  revalidatePath('/admin/collections');
  revalidatePath('/admin/approvals');
  revalidatePath('/vendor/collections');
  revalidatePath('/store');
  revalidatePath('/vendors');
  revalidatePath('/api/catalog');
}

export async function setStoreCollectionStatus(formData: FormData) {
  const access = await requireAdminPermission('collection:manage');
  const id = text(formData, 'id');
  const status = resolveStatus(
    text(formData, 'status'),
    access.permissions.has('approval:review')
  );

  if (!id) throw new Error('A collection is required.');

  const collection = await prisma.storeCollection.findFirst({
    where: { id, workspaceId: access.membership.workspaceId },
    include: {
      products: {
        select: {
          product: {
            select: {
              id: true,
              active: true,
              status: true,
              vendorProfileId: true,
              vendorProfile: {
                select: {
                  status: true,
                  active: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!collection) throw new Error('The collection was not found.');

  if (
    status === 'PUBLISHED' &&
    collection.vendorProfileId &&
    access.membership.workspace.commerceMode !== 'MULTI_VENDOR'
  ) {
    throw new Error('Multi Vendor mode must be active before publishing this collection.');
  }

  if (status === 'PUBLISHED') {
    const visibleProducts = collection.products.filter(({ product }) => {
      if (!product.active || product.status !== 'PUBLISHED') {
        return false;
      }

      if (!product.vendorProfileId) {
        return true;
      }

      return (
        access.membership.workspace.commerceMode === 'MULTI_VENDOR' &&
        product.vendorProfile?.status === 'ACTIVE' &&
        product.vendorProfile.active
      );
    });

    if (visibleProducts.length === 0) {
      throw new Error(
        'Publish at least one active, published product before publishing this collection.'
      );
    }
  }

  await prisma.storeCollection.update({
    where: { id },
    data: { status, active: status === 'PUBLISHED' }
  });

  revalidatePath('/admin/collections');
  revalidatePath('/admin/approvals');
  revalidatePath('/vendor/collections');
  revalidatePath('/store');
  revalidatePath('/vendors');
  revalidatePath('/api/catalog');
}
