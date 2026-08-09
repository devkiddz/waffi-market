'use server';

import { revalidatePath } from 'next/cache';

import {
  cancelApprovalRequestsForTarget,
  createOrResubmitApprovalRequest
} from '@/features/admin/approvals/approvalRequestRepository';
import { requireVendorPermission } from '@/features/vendor/auth/vendorAccess';
import {
  assertVendorStudioQuotaAvailable,
  lockVendorStudioQuota
} from '@/features/vendor/entitlements';
import { prisma } from '@/lib/prisma';

const COLLECTION_LAYOUTS = ['FEATURED', 'CAROUSEL', 'GRID', 'SPOTLIGHT'] as const;
const PROMOTION_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FEATURED'] as const;

type VendorApprovalTarget = 'PRODUCT' | 'PROMOTION' | 'COLLECTION' | 'CAMPAIGN';
type VendorRecordKind = 'collection' | 'promotion' | 'campaign';

function text(data: FormData, key: string): string {
  return String(data.get(key) ?? '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function uniqueFormValues(data: FormData, key: string): string[] {
  return Array.from(new Set(data.getAll(key).map(String).filter(Boolean)));
}

function parseOptionalDate(value: string, label: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is invalid.`);
  }

  return date;
}

function parseOptionalPositiveNumber(value: string, label: string): number | null {
  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return number;
}

function parseOptionalPositiveInteger(value: string, label: string): number | null {
  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }

  return number;
}

function parseRequestedPriority(value: string): number {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.min(10, Math.max(0, number)) : 0;
}

function validateSchedule(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error('The end date must be later than the start date.');
  }
}

async function cancelPendingApproval({
  workspaceId,
  userId,
  targetType,
  targetId,
  note
}: {
  workspaceId: string;
  userId: string;
  targetType: VendorApprovalTarget;
  targetId: string;
  note: string;
}): Promise<void> {
  await prisma.$transaction(transaction =>
    cancelApprovalRequestsForTarget(transaction, {
      workspaceId,
      actorId: userId,
      targetType,
      targetId,
      note
    })
  );
}

async function submitApproval({
  workspaceId,
  userId,
  targetType,
  targetId,
  reason,
  vendorProfileId
}: {
  workspaceId: string;
  userId: string;
  targetType: VendorApprovalTarget;
  targetId: string;
  reason: string;
  vendorProfileId: string;
}): Promise<void> {
  await prisma.$transaction(transaction =>
    createOrResubmitApprovalRequest(transaction, {
      workspaceId,
      requestedById: userId,
      source: 'VENDOR',
      action: 'PUBLISH_LIVE',
      targetType,
      targetId,
      reason,
      payload: { vendorProfileId }
    })
  );
}

export async function saveVendorCollection(formData: FormData): Promise<void> {
  const access = await requireVendorPermission('collection:manage');
  const id = text(formData, 'id') || null;
  const title = text(formData, 'title');
  const slug = slugify(text(formData, 'slug') || title);
  const submit = text(formData, 'intent') === 'submit';
  const productIds = uniqueFormValues(formData, 'productIds');
  const coverMediaAssetId = text(formData, 'coverMediaAssetId') || null;
  const featuredProductId = text(formData, 'featuredProductId') || null;
  const startsAt = parseOptionalDate(text(formData, 'startsAt'), 'Collection start date');
  const endsAt = parseOptionalDate(text(formData, 'endsAt'), 'Collection end date');
  const priority = parseRequestedPriority(text(formData, 'priority'));
  const layoutValue = text(formData, 'layout');
  const layout = COLLECTION_LAYOUTS.includes(
    layoutValue as (typeof COLLECTION_LAYOUTS)[number]
  )
    ? (layoutValue as (typeof COLLECTION_LAYOUTS)[number])
    : 'CAROUSEL';

  if (!title || !slug) {
    throw new Error('Collection title and slug are required.');
  }

  validateSchedule(startsAt, endsAt);

  if (!access.studio.capabilities.collections) {
    throw new Error(
      `Collection Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  if ((startsAt || endsAt) && !access.studio.capabilities.scheduling) {
    throw new Error(
      'Collection scheduling is not available on this Vendor Studio tier.'
    );
  }

  const collectionLimit = access.studio.limits.collections;

  if (submit && productIds.length === 0) {
    throw new Error('Select at least one published product before submitting the collection.');
  }

  if (featuredProductId && !productIds.includes(featuredProductId)) {
    throw new Error('The featured product must also be selected for this collection.');
  }

  const [ownedProducts, cover, conflict, existing] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'PUBLISHED',
            active: true
          },
          select: { id: true }
        })
      : Promise.resolve([]),
    coverMediaAssetId
      ? prisma.mediaAsset.findFirst({
          where: {
            id: coverMediaAssetId,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'ACTIVE',
            resourceType: 'IMAGE'
          },
          select: { id: true }
        })
      : null,
    prisma.storeCollection.findFirst({
      where: {
        workspaceId: access.workspace.id,
        slug,
        ...(id ? { id: { not: id } } : {})
      },
      select: { id: true }
    }),
    id
      ? prisma.storeCollection.findFirst({
          where: {
            id,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: { not: 'ARCHIVED' }
          },
          select: { id: true }
        })
      : null
  ]);

  if (id && !existing) {
    throw new Error('The selected collection is unavailable to this vendor.');
  }

  if (ownedProducts.length !== productIds.length) {
    throw new Error('Collections can only use your active published products.');
  }

  if (coverMediaAssetId && !cover) {
    throw new Error('The selected cover is unavailable.');
  }

  if (conflict) {
    throw new Error('This collection slug is already in use.');
  }

  const record = await prisma.$transaction(async transaction => {
    if (!id && collectionLimit !== null) {
      await lockVendorStudioQuota(transaction, access.vendor.id);

      const currentCollectionCount = await transaction.storeCollection.count({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: { not: 'ARCHIVED' }
        }
      });

      assertVendorStudioQuotaAvailable({
        current: currentCollectionCount,
        limit: collectionLimit,
        message: `This Vendor Studio tier allows up to ${collectionLimit} collection${collectionLimit === 1 ? '' : 's'}.`
      });
    }

    const data = {
      workspaceId: access.workspace.id,
      vendorProfileId: access.vendor.id,
      coverMediaAssetId,
      title,
      slug,
      subtitle: text(formData, 'subtitle') || null,
      description: text(formData, 'description') || null,
      layout,
      status: (submit ? 'PENDING_REVIEW' : 'DRAFT') as
        | 'PENDING_REVIEW'
        | 'DRAFT',
      featuredProductId,
      active: false,
      priority,
      startsAt,
      endsAt
    };

    const result = id
      ? await transaction.storeCollection.update({
          where: { id },
          data,
          select: { id: true }
        })
      : await transaction.storeCollection.create({
          data,
          select: { id: true }
        });

    await transaction.storeCollectionProduct.deleteMany({
      where: { collectionId: result.id }
    });

    if (productIds.length) {
      await transaction.storeCollectionProduct.createMany({
        data: productIds.map((productId, position) => ({
          collectionId: result.id,
          productId,
          position
        }))
      });
    }

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: submit ? 'VENDOR_COLLECTION_SUBMITTED' : 'VENDOR_COLLECTION_SAVED',
        targetType: 'COLLECTION',
        targetId: result.id,
        summary: `${access.vendor.name} ${submit ? 'submitted' : 'saved'} ${title}.`,
        metadata: {
          vendorProfileId: access.vendor.id,
          vendorStudioTier: access.studio.tier,
          productCount: productIds.length,
          priority,
          layout,
          schedulingUsed: Boolean(startsAt || endsAt)
        }
      }
    });

    return result;
  });

  if (submit) {
    await submitApproval({
      workspaceId: access.workspace.id,
      userId: access.session.user.id,
      targetType: 'COLLECTION',
      targetId: record.id,
      reason: `${access.vendor.name} submitted ${title}.`,
      vendorProfileId: access.vendor.id
    });
  } else {
    await cancelPendingApproval({
      userId: access.session.user.id,
      workspaceId: access.workspace.id,
      targetType: 'COLLECTION',
      targetId: record.id,
      note: 'The vendor returned this collection to draft.'
    });
  }

  revalidatePath('/vendor/collections');
  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/collections');
}

export async function saveVendorPromotion(formData: FormData): Promise<void> {
  const access = await requireVendorPermission('promotion:manage');
  const id = text(formData, 'id') || null;
  const title = text(formData, 'title');
  const slug = slugify(text(formData, 'slug') || title);
  const submit = text(formData, 'intent') === 'submit';
  const productIds = uniqueFormValues(formData, 'productIds');
  const bannerMediaAssetId = text(formData, 'bannerMediaAssetId') || null;
  const typeValue = text(formData, 'type');
  const type = PROMOTION_TYPES.includes(
    typeValue as (typeof PROMOTION_TYPES)[number]
  )
    ? (typeValue as (typeof PROMOTION_TYPES)[number])
    : 'PERCENTAGE';
  const discountValue = parseOptionalPositiveNumber(
    text(formData, 'discountValue'),
    'Discount value'
  );
  const usageLimit = parseOptionalPositiveInteger(
    text(formData, 'usageLimit'),
    'Usage limit'
  );
  const startsAt = parseOptionalDate(text(formData, 'startsAt'), 'Promotion start date');
  const endsAt = parseOptionalDate(text(formData, 'endsAt'), 'Promotion end date');
  const priority = parseRequestedPriority(text(formData, 'priority'));

  if (!title || !slug) {
    throw new Error('Promotion title and slug are required.');
  }

  validateSchedule(startsAt, endsAt);

  if (!access.studio.capabilities.promotions) {
    throw new Error(
      `Promotion Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  if ((startsAt || endsAt) && !access.studio.capabilities.scheduling) {
    throw new Error(
      'Promotion scheduling is not available on this Vendor Studio tier.'
    );
  }

  const promotionLimit = access.studio.limits.promotions;

  if (submit && productIds.length === 0) {
    throw new Error('Select at least one published product before submitting the promotion.');
  }

  if (type === 'PERCENTAGE' && (!discountValue || discountValue > 100)) {
    throw new Error('Percentage discounts must be greater than zero and no more than 100.');
  }

  if (type !== 'FEATURED' && !discountValue) {
    throw new Error('A discount value is required for this promotion type.');
  }

  const [ownedProducts, banner, conflict, existing] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'PUBLISHED',
            active: true
          },
          select: { id: true }
        })
      : Promise.resolve([]),
    bannerMediaAssetId
      ? prisma.mediaAsset.findFirst({
          where: {
            id: bannerMediaAssetId,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'ACTIVE',
            resourceType: 'IMAGE'
          },
          select: { id: true }
        })
      : null,
    prisma.promotion.findFirst({
      where: {
        workspaceId: access.workspace.id,
        slug,
        ...(id ? { id: { not: id } } : {})
      },
      select: { id: true }
    }),
    id
      ? prisma.promotion.findFirst({
          where: {
            id,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: { not: 'ARCHIVED' }
          },
          select: { id: true }
        })
      : null
  ]);

  if (id && !existing) {
    throw new Error('The selected promotion is unavailable to this vendor.');
  }

  if (ownedProducts.length !== productIds.length) {
    throw new Error('Promotions can only use your active published products.');
  }

  if (bannerMediaAssetId && !banner) {
    throw new Error('The selected banner is unavailable.');
  }

  if (conflict) {
    throw new Error('This promotion slug is already in use.');
  }

  const record = await prisma.$transaction(async transaction => {
    if (!id && promotionLimit !== null) {
      await lockVendorStudioQuota(transaction, access.vendor.id);

      const currentPromotionCount = await transaction.promotion.count({
        where: {
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: { not: 'ARCHIVED' }
        }
      });

      assertVendorStudioQuotaAvailable({
        current: currentPromotionCount,
        limit: promotionLimit,
        message: `This Vendor Studio tier allows up to ${promotionLimit} promotion${promotionLimit === 1 ? '' : 's'}.`
      });
    }

    const data = {
      workspaceId: access.workspace.id,
      vendorProfileId: access.vendor.id,
      bannerMediaAssetId,
      title,
      slug,
      description: text(formData, 'description') || null,
      type,
      status: (submit ? 'PENDING_REVIEW' : 'DRAFT') as
        | 'PENDING_REVIEW'
        | 'DRAFT',
      active: false,
      discountValue: type === 'FEATURED' ? null : discountValue,
      code: text(formData, 'code').toUpperCase() || null,
      usageLimit,
      priority,
      startsAt,
      endsAt
    };

    const result = id
      ? await transaction.promotion.update({
          where: { id },
          data,
          select: { id: true }
        })
      : await transaction.promotion.create({
          data,
          select: { id: true }
        });

    await transaction.promotionProduct.deleteMany({
      where: { promotionId: result.id }
    });

    if (productIds.length) {
      await transaction.promotionProduct.createMany({
        data: productIds.map((productId, position) => ({
          promotionId: result.id,
          productId,
          position,
          discountPercentage:
            type === 'PERCENTAGE' && discountValue
              ? Math.round(discountValue)
              : null,
          promotionalPrice:
            type === 'FIXED_PRICE' ? discountValue : null
        }))
      });
    }

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: submit ? 'VENDOR_PROMOTION_SUBMITTED' : 'VENDOR_PROMOTION_SAVED',
        targetType: 'PROMOTION',
        targetId: result.id,
        summary: `${access.vendor.name} ${submit ? 'submitted' : 'saved'} ${title}.`,
        metadata: {
          vendorProfileId: access.vendor.id,
          vendorStudioTier: access.studio.tier,
          productCount: productIds.length,
          promotionType: type,
          priority,
          schedulingUsed: Boolean(startsAt || endsAt)
        }
      }
    });

    return result;
  });

  if (submit) {
    await submitApproval({
      workspaceId: access.workspace.id,
      userId: access.session.user.id,
      targetType: 'PROMOTION',
      targetId: record.id,
      reason: `${access.vendor.name} submitted ${title}.`,
      vendorProfileId: access.vendor.id
    });
  } else {
    await cancelPendingApproval({
      userId: access.session.user.id,
      workspaceId: access.workspace.id,
      targetType: 'PROMOTION',
      targetId: record.id,
      note: 'The vendor returned this promotion to draft.'
    });
  }

  revalidatePath('/vendor/promotions');
  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/promotions');
}

export async function saveVendorCampaign(
  type: 'STORY' | 'REEL',
  formData: FormData
): Promise<void> {
  const access = await requireVendorPermission('campaign:manage');
  const id = text(formData, 'id') || null;
  const title = text(formData, 'title');
  const submit = text(formData, 'intent') === 'submit';
  const mediaAssetIds = uniqueFormValues(formData, 'mediaAssetIds');
  const destination = text(formData, 'destination');
  const startsAt = parseOptionalDate(text(formData, 'startsAt'), 'Campaign start date');
  const endsAt = parseOptionalDate(text(formData, 'endsAt'), 'Campaign end date');
  const requestedPriority = parseRequestedPriority(text(formData, 'requestedPriority'));
  const campaignCapability = type === 'REEL' ? 'reels' : 'stories';
  const campaignLimit =
    type === 'REEL'
      ? access.studio.limits.reels
      : access.studio.limits.stories;
  const assetLimit =
    type === 'REEL'
      ? access.studio.limits.reelAssetsPerCampaign
      : access.studio.limits.storyAssetsPerCampaign;

  if (!access.studio.capabilities[campaignCapability]) {
    throw new Error(
      `${type === 'REEL' ? 'Reels' : 'Stories'} are not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  if (type === 'REEL' && !access.studio.capabilities.video) {
    throw new Error('Video publishing is not available for this vendor.');
  }

  if ((startsAt || endsAt) && !access.studio.capabilities.scheduling) {
    throw new Error(
      'Campaign scheduling is not available on this Vendor Studio tier.'
    );
  }

  if (assetLimit !== null && mediaAssetIds.length > assetLimit) {
    throw new Error(
      `This Vendor Studio tier allows up to ${assetLimit} asset${assetLimit === 1 ? '' : 's'} per ${type.toLowerCase()} campaign.`
    );
  }

  if (!title || !mediaAssetIds.length) {
    throw new Error(
      `${type === 'REEL' ? 'Reel' : 'Story'} title and at least one media asset are required.`
    );
  }

  validateSchedule(startsAt, endsAt);

  const [destinationType, destinationId] = destination.includes(':')
    ? destination.split(':', 2)
    : ['', ''];

  if (destination && !destinationId) {
    throw new Error('The selected campaign destination is invalid.');
  }

  const [media, product, promotion, collection, existing] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: {
        id: { in: mediaAssetIds },
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE',
        ...(type === 'REEL'
          ? { resourceType: 'VIDEO' as const }
          : { resourceType: { in: ['IMAGE', 'VIDEO'] as const } })
      },
      select: {
        id: true,
        secureUrl: true,
        resourceType: true
      }
    }),
    destinationType === 'product'
      ? prisma.product.findFirst({
          where: {
            id: destinationId,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'PUBLISHED',
            active: true
          },
          select: { id: true, slug: true }
        })
      : null,
    destinationType === 'promotion'
      ? prisma.promotion.findFirst({
          where: {
            id: destinationId,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'PUBLISHED',
            active: true
          },
          select: { id: true, slug: true }
        })
      : null,
    destinationType === 'collection'
      ? prisma.storeCollection.findFirst({
          where: {
            id: destinationId,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: 'PUBLISHED',
            active: true
          },
          select: { id: true }
        })
      : null,
    id
      ? prisma.storeStudioCampaign.findFirst({
          where: {
            id,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            type,
          },
          select: { id: true }
        })
      : null
  ]);

  if (id && !existing) {
    throw new Error('The selected campaign is unavailable to this vendor.');
  }

  if (media.length !== mediaAssetIds.length) {
    throw new Error(
      `One or more selected ${type.toLowerCase()} assets are unavailable.`
    );
  }

  if (
    !access.studio.capabilities.video &&
    media.some(asset => asset.resourceType === 'VIDEO')
  ) {
    throw new Error(
      'Video media is not available on this Vendor Studio tier.'
    );
  }

  if (
    destination &&
    !(
      (destinationType === 'product' && product) ||
      (destinationType === 'promotion' && promotion) ||
      (destinationType === 'collection' && collection)
    )
  ) {
    throw new Error('The selected destination is unavailable to this vendor.');
  }

  const byId = new Map(media.map(item => [item.id, item]));
  const productId = product?.id ?? null;
  const promotionId = promotion?.id ?? null;
  const collectionId = collection?.id ?? null;
  const actionHref = product
    ? `/store?product=${encodeURIComponent(product.id)}`
    : promotion
      ? `/promos/${promotion.slug}`
      : collection
        ? `/store?collection=${encodeURIComponent(collection.id)}`
        : null;
  const actionLabel = product
    ? 'View product'
    : promotion
      ? 'View promotion'
      : collection
        ? 'Explore collection'
        : null;

  const campaign = await prisma.$transaction(async transaction => {
    if (!id && campaignLimit !== null) {
      await lockVendorStudioQuota(transaction, access.vendor.id);

      const currentCampaignCount =
        await transaction.storeStudioCampaign.count({
          where: {
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            type,
            status: { not: 'EXPIRED' }
          }
        });

      assertVendorStudioQuotaAvailable({
        current: currentCampaignCount,
        limit: campaignLimit,
        message: `This Vendor Studio tier allows up to ${campaignLimit} active ${type === 'REEL' ? 'Reel' : 'Story'} campaign${campaignLimit === 1 ? '' : 's'}.`
      });
    }

    const data = {
      workspaceId: access.workspace.id,
      vendorProfileId: access.vendor.id,
      vendorId: access.session.user.id,
      type,
      status: (submit ? 'PENDING_REVIEW' : 'DRAFT') as
        | 'PENDING_REVIEW'
        | 'DRAFT',
      placementTier: 'STANDARD' as const,
      title,
      description: text(formData, 'description') || null,
      startsAt,
      endsAt,
      requestedPriority,
      adminWeight: 0,
      active: false
    };

    const result = id
      ? await transaction.storeStudioCampaign.update({
          where: { id },
          data,
          select: { id: true }
        })
      : await transaction.storeStudioCampaign.create({
          data,
          select: { id: true }
        });

    await transaction.storeStudioAsset.deleteMany({
      where: { campaignId: result.id }
    });

    await transaction.storeStudioAsset.createMany({
      data: mediaAssetIds.map((mediaAssetId, position) => {
        const asset = byId.get(mediaAssetId)!;

        return {
          campaignId: result.id,
          mediaType: asset.resourceType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          mediaAssetId,
          mediaUrl: asset.secureUrl,
          title,
          description: text(formData, 'description') || null,
          actionLabel,
          actionHref,
          productId,
          promotionId,
          collectionId,
          position,
          active: true,
          autoplay: type === 'REEL',
          muted: true,
          durationSeconds: type === 'STORY' ? 5 : null
        };
      })
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: submit ? 'VENDOR_CAMPAIGN_SUBMITTED' : 'VENDOR_CAMPAIGN_SAVED',
        targetType: 'CAMPAIGN',
        targetId: result.id,
        summary: `${access.vendor.name} ${submit ? 'submitted' : 'saved'} ${title} (${type.toLowerCase()}).`,
        metadata: {
          vendorProfileId: access.vendor.id,
          campaignType: type,
          vendorStudioTier: access.studio.tier,
          assetCount: mediaAssetIds.length,
          requestedPriority,
          schedulingUsed: Boolean(startsAt || endsAt)
        }
      }
    });

    return result;
  });

  if (submit) {
    await submitApproval({
      workspaceId: access.workspace.id,
      userId: access.session.user.id,
      targetType: 'CAMPAIGN',
      targetId: campaign.id,
      reason: `${access.vendor.name} submitted ${title} (${type.toLowerCase()}).`,
      vendorProfileId: access.vendor.id
    });
  } else {
    await cancelPendingApproval({
      userId: access.session.user.id,
      workspaceId: access.workspace.id,
      targetType: 'CAMPAIGN',
      targetId: campaign.id,
      note: 'The vendor returned this campaign to draft.'
    });
  }

  revalidatePath(type === 'STORY' ? '/vendor/stories' : '/vendor/reels');
  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/store-studio');
}

export async function archiveVendorRecord(
  kind: VendorRecordKind,
  formData: FormData
): Promise<void> {
  const access = await requireVendorPermission(
    kind === 'campaign'
      ? 'campaign:manage'
      : kind === 'collection'
        ? 'collection:manage'
        : 'promotion:manage'
  );
  const id = text(formData, 'id');

  if (!id) {
    throw new Error('A record is required.');
  }

  const targetType: VendorApprovalTarget =
    kind === 'collection'
      ? 'COLLECTION'
      : kind === 'promotion'
        ? 'PROMOTION'
        : 'CAMPAIGN';

  await prisma.$transaction(async transaction => {
    if (kind === 'collection') {
      const result = await transaction.storeCollection.updateMany({
        where: {
          id,
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: { not: 'ARCHIVED' }
        },
        data: { status: 'ARCHIVED', active: false }
      });

      if (!result.count) {
        throw new Error('The collection could not be archived.');
      }
    }

    if (kind === 'promotion') {
      const result = await transaction.promotion.updateMany({
        where: {
          id,
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: { not: 'ARCHIVED' }
        },
        data: { status: 'ARCHIVED', active: false }
      });

      if (!result.count) {
        throw new Error('The promotion could not be archived.');
      }
    }

    if (kind === 'campaign') {
      const result = await transaction.storeStudioCampaign.updateMany({
        where: {
          id,
          workspaceId: access.workspace.id,
          vendorProfileId: access.vendor.id,
          status: { not: 'EXPIRED' }
        },
        data: { status: 'EXPIRED', active: false }
      });

      if (!result.count) {
        throw new Error('The campaign could not be archived.');
      }
    }

    await cancelApprovalRequestsForTarget(transaction, {
      workspaceId: access.workspace.id,
      actorId: access.session.user.id,
      targetType,
      targetId: id,
      note: 'The vendor archived this submission.'
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: 'VENDOR_RECORD_ARCHIVED',
        targetType,
        targetId: id,
        summary: `${access.vendor.name} archived a ${kind}.`,
        metadata: {
          vendorProfileId: access.vendor.id,
          kind
        }
      }
    });
  });

  if (kind === 'campaign') {
    revalidatePath('/vendor/stories');
    revalidatePath('/vendor/reels');
    revalidatePath('/admin/store-studio');
  } else {
    revalidatePath(`/vendor/${kind}s`);
    revalidatePath(`/admin/${kind}s`);
  }

  revalidatePath('/vendor/submissions');
  revalidatePath('/admin/approvals');
}
