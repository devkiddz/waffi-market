'use server';

import { randomUUID } from 'node:crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import {
  cancelApprovalRequestsForTarget,
  createOrResubmitApprovalRequest,
  synchronizeDirectApprovalDecision
} from '@/features/admin/approvals/approvalRequestRepository';
import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const CAMPAIGN_TYPES = ['BANNER', 'STORY', 'REEL'] as const;
const MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const;
const PLACEMENT_TIERS = [
  'STANDARD',
  'FEATURED',
  'PREMIUM',
  'SPONSORED'
] as const;
const CAMPAIGN_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'REJECTED'
] as const;

type CampaignType = (typeof CAMPAIGN_TYPES)[number];
type MediaType = (typeof MEDIA_TYPES)[number];
type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

type ParsedAsset = {
  id: string;
  mediaType: MediaType;
  mediaUrl: string;
  mediaAssetId: string | null;
  mobileMediaAssetId: string | null;
  coverMediaAssetId: string | null;
  posterMediaAssetId: string | null;
  mobileMediaUrl: string | null;
  coverUrl: string | null;
  posterUrl: string | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  productId: string | null;
  promotionId: string | null;
  collectionId: string | null;
  durationSeconds: number | null;
  autoplay: boolean;
  muted: boolean;
  active: boolean;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function nullableText(formData: FormData, key: string): string | null {
  return text(formData, key) || null;
}

function booleanValue(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === 'on' || value === 'true' || value === '1';
}

function integerValue(
  formData: FormData,
  key: string,
  fallback = 0,
  minimum = -100,
  maximum = 100
): number {
  const parsed = Number.parseInt(text(formData, key), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, parsed));
}

function nullableDate(formData: FormData, key: string): Date | null {
  const value = text(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} contains an invalid date.`);
  }

  return date;
}

function enumValue<T extends readonly string[]>(
  formData: FormData,
  key: string,
  allowed: T,
  fallback: T[number]
): T[number] {
  const value = text(formData, key)
    .toUpperCase()
    .replaceAll('-', '_');

  return allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

function isMediaReference(value: string): boolean {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseDestination(formData: FormData): {
  productId: string | null;
  promotionId: string | null;
  collectionId: string | null;
} {
  const destination = text(formData, 'destination');

  if (destination) {
    const separatorIndex = destination.indexOf(':');
    const kind = separatorIndex >= 0
      ? destination.slice(0, separatorIndex)
      : '';
    const id = separatorIndex >= 0
      ? destination.slice(separatorIndex + 1).trim()
      : '';

    if (!id) {
      throw new Error('The selected Store destination is invalid.');
    }

    if (kind === 'product') {
      return { productId: id, promotionId: null, collectionId: null };
    }

    if (kind === 'promotion') {
      return { productId: null, promotionId: id, collectionId: null };
    }

    if (kind === 'collection') {
      return { productId: null, promotionId: null, collectionId: id };
    }

    throw new Error('The selected Store destination is unsupported.');
  }

  return {
    productId: nullableText(formData, 'productId'),
    promotionId: nullableText(formData, 'promotionId'),
    collectionId: nullableText(formData, 'collectionId')
  };
}

function validateDestinationReference(value: string | null): void {
  if (value && !isMediaReference(value)) {
    throw new Error('The action URL must be a local path or a valid web URL.');
  }
}

function validateDateRange(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error('The campaign end date must be later than its start date.');
  }
}

function resolveStatus({
  requestedStatus,
  startsAt,
  canReview
}: {
  requestedStatus: CampaignStatus;
  startsAt: Date | null;
  canReview: boolean;
}): CampaignStatus {
  if (!canReview && !['DRAFT', 'PENDING_REVIEW'].includes(requestedStatus)) {
    return 'PENDING_REVIEW';
  }

  if (requestedStatus === 'APPROVED') {
    return startsAt && startsAt.getTime() > Date.now()
      ? 'SCHEDULED'
      : 'ACTIVE';
  }

  if (requestedStatus === 'SCHEDULED') {
    if (!startsAt) {
      throw new Error('Scheduled campaigns require a start date and time.');
    }

    return startsAt.getTime() > Date.now()
      ? 'SCHEDULED'
      : 'ACTIVE';
  }

  if (
    requestedStatus === 'ACTIVE' &&
    startsAt &&
    startsAt.getTime() > Date.now()
  ) {
    return 'SCHEDULED';
  }

  return requestedStatus;
}

function requiresManagerReview(
  status: CampaignStatus,
  canReview: boolean
): boolean {
  return (
    !canReview &&
    !['DRAFT', 'PENDING_REVIEW', 'REJECTED'].includes(status)
  );
}

const ALLOWED_TRANSITIONS: Record<string, readonly CampaignStatus[]> = {
  submit: ['DRAFT', 'REJECTED'],
  approve: ['PENDING_REVIEW'],
  activate: ['APPROVED', 'SCHEDULED', 'PAUSED'],
  pause: ['ACTIVE', 'SCHEDULED'],
  resume: ['PAUSED'],
  reject: ['PENDING_REVIEW'],
  expire: [
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'SCHEDULED',
    'ACTIVE',
    'PAUSED',
    'REJECTED'
  ]
};

function assertTransitionAllowed(
  transition: string,
  currentStatus: CampaignStatus
): void {
  const allowedStatuses = ALLOWED_TRANSITIONS[transition];

  if (!allowedStatuses || !allowedStatuses.includes(currentStatus)) {
    throw new Error(
      `The ${transition} operation is not available while this campaign is ${currentStatus.toLowerCase().replaceAll('_', ' ')}.`
    );
  }
}

async function assertDestinations({
  workspaceId,
  vendorProfileId,
  productId,
  promotionId,
  collectionId
}: {
  workspaceId: string;
  vendorProfileId: string | null;
  productId: string | null;
  promotionId: string | null;
  collectionId: string | null;
}): Promise<void> {
  const [workspace, product, promotion, collection] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { commerceMode: true }
    }),
    productId
      ? prisma.product.findFirst({
          where: { id: productId, workspaceId, active: true, status: 'PUBLISHED' },
          select: {
            id: true,
            vendorProfileId: true,
            vendorProfile: { select: { status: true, active: true } }
          }
        })
      : null,
    promotionId
      ? prisma.promotion.findFirst({
          where: { id: promotionId, workspaceId, active: true, status: 'PUBLISHED' },
          select: {
            id: true,
            vendorProfileId: true,
            vendorProfile: { select: { status: true, active: true } }
          }
        })
      : null,
    collectionId
      ? prisma.storeCollection.findFirst({
          where: { id: collectionId, workspaceId, active: true, status: 'PUBLISHED' },
          select: {
            id: true,
            vendorProfileId: true,
            vendorProfile: { select: { status: true, active: true } }
          }
        })
      : null
  ]);

  if (!workspace) {
    throw new Error('The Store Studio workspace is unavailable.');
  }

  const assertTarget = (
    target: {
      vendorProfileId: string | null;
      vendorProfile: { status: string; active: boolean } | null;
    } | null,
    label: string
  ): void => {
    if (!target) {
      throw new Error(`The selected ${label} is unavailable in this workspace.`);
    }

    if (vendorProfileId && target.vendorProfileId !== vendorProfileId) {
      throw new Error(`Vendor campaigns can only link to that vendor's ${label}.`);
    }

    if (
      target.vendorProfileId &&
      (workspace.commerceMode !== 'MULTI_VENDOR' ||
        target.vendorProfile?.status !== 'ACTIVE' ||
        !target.vendorProfile.active)
    ) {
      throw new Error(`The selected vendor ${label} is not currently publishable.`);
    }
  };

  if (productId) {
    assertTarget(product, 'product');
  }

  if (promotionId) {
    assertTarget(promotion, 'promotion');
  }

  if (collectionId) {
    assertTarget(collection, 'collection');
  }
}

async function assertVendorCampaignPublication({
  workspaceId,
  vendorProfileId,
  status
}: {
  workspaceId: string;
  vendorProfileId: string | null;
  status: CampaignStatus;
}): Promise<void> {
  if (
    !vendorProfileId ||
    !['APPROVED', 'SCHEDULED', 'ACTIVE'].includes(status)
  ) {
    return;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      commerceMode: true,
      vendors: {
        where: { id: vendorProfileId },
        select: { status: true, active: true },
        take: 1
      }
    }
  });

  const vendor = workspace?.vendors[0];

  if (
    !workspace ||
    workspace.commerceMode !== 'MULTI_VENDOR' ||
    !vendor ||
    vendor.status !== 'ACTIVE' ||
    !vendor.active
  ) {
    throw new Error(
      'Vendor campaigns cannot be approved or activated until Multi Vendor mode is enabled and the vendor is active.'
    );
  }
}

async function resolveActionHref({
  workspaceId,
  assetId,
  campaignType,
  explicitHref,
  productId,
  promotionId,
  collectionId
}: {
  workspaceId: string;
  assetId: string;
  campaignType: CampaignType;
  explicitHref: string | null;
  productId: string | null;
  promotionId: string | null;
  collectionId: string | null;
}): Promise<string | null> {
  if (explicitHref) {
    return explicitHref;
  }

  if (campaignType === 'REEL') {
    return `/reels/${assetId}`;
  }

  if (productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId
      },
      select: {
        id: true
      }
    });

    return product ? `/store?product=${encodeURIComponent(product.id)}` : null;
  }

  if (promotionId) {
    const promotion = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        workspaceId
      },
      select: {
        slug: true
      }
    });

    return promotion ? `/promos/${promotion.slug}` : null;
  }

  if (collectionId) {
    return `/store?collection=${encodeURIComponent(collectionId)}`;
  }

  return null;
}

async function parseAsset({
  formData,
  workspaceId,
  vendorProfileId,
  campaignType,
  fallbackAssetId
}: {
  formData: FormData;
  workspaceId: string;
  vendorProfileId: string | null;
  campaignType: CampaignType;
  fallbackAssetId?: string;
}): Promise<ParsedAsset> {
  const id = fallbackAssetId || randomUUID();
  const requestedMediaType = enumValue(
    formData,
    'mediaType',
    MEDIA_TYPES,
    campaignType === 'REEL' ? 'VIDEO' : 'IMAGE'
  );

  const mediaAssetId = nullableText(formData, 'mediaAssetId');
  const mobileMediaAssetId = nullableText(formData, 'mobileMediaAssetId');
  const coverMediaAssetId = nullableText(formData, 'coverMediaAssetId');
  const posterMediaAssetId = nullableText(formData, 'posterMediaAssetId');
  const selectedIds = [mediaAssetId, mobileMediaAssetId, coverMediaAssetId, posterMediaAssetId]
    .filter((value): value is string => Boolean(value));
  const mediaAssets = selectedIds.length
    ? await prisma.mediaAsset.findMany({
        where: {
          id: { in: selectedIds },
          workspaceId,
          vendorProfileId,
          status: 'ACTIVE'
        },
        select: { id: true, secureUrl: true, resourceType: true }
      })
    : [];
  const mediaById = new Map(mediaAssets.map(asset => [asset.id, asset]));

  if (mediaAssets.length !== new Set(selectedIds).size) {
    throw new Error('One or more selected Media Studio assets are unavailable.');
  }

  const primaryAsset = mediaAssetId ? mediaById.get(mediaAssetId) : null;
  const mobileAsset = mobileMediaAssetId ? mediaById.get(mobileMediaAssetId) : null;
  const coverAsset = coverMediaAssetId ? mediaById.get(coverMediaAssetId) : null;
  const posterAsset = posterMediaAssetId ? mediaById.get(posterMediaAssetId) : null;
  const explicitMediaUrl = nullableText(formData, 'mediaUrl');

  if (!primaryAsset && (!explicitMediaUrl || !isMediaReference(explicitMediaUrl))) {
    throw new Error('Select a primary Media Studio asset or provide an advanced external media URL.');
  }

  const mediaType: MediaType = primaryAsset
    ? primaryAsset.resourceType === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    : campaignType === 'REEL' ? 'VIDEO' : requestedMediaType;

  if (campaignType === 'REEL' && mediaType !== 'VIDEO') {
    throw new Error('Reel primary media must be a video.');
  }

  for (const asset of [coverAsset, posterAsset]) {
    if (asset && asset.resourceType !== 'IMAGE') {
      throw new Error('Cover and poster roles require image assets.');
    }
  }

  const mediaUrl = primaryAsset?.secureUrl ?? explicitMediaUrl!;
  const externalMobileMediaUrl = nullableText(formData, 'mobileMediaUrl');
  const externalCoverUrl = nullableText(formData, 'coverUrl');
  const externalPosterUrl = nullableText(formData, 'posterUrl');

  for (const [label, value] of [
    ['mobile media', externalMobileMediaUrl],
    ['cover', externalCoverUrl],
    ['poster', externalPosterUrl]
  ] as const) {
    if (value && !isMediaReference(value)) {
      throw new Error(`The ${label} URL or public path is invalid.`);
    }
  }

  const mobileMediaUrl = mobileAsset?.secureUrl ?? externalMobileMediaUrl;
  const coverUrl = coverAsset?.secureUrl ?? externalCoverUrl;
  const posterUrl = posterAsset?.secureUrl ?? externalPosterUrl;

  const {
    productId,
    promotionId,
    collectionId
  } = parseDestination(formData);

  const selectedDestinationCount = [productId, promotionId, collectionId]
    .filter(Boolean)
    .length;

  if (selectedDestinationCount > 1) {
    throw new Error('Choose only one product, promotion, or collection destination.');
  }

  await assertDestinations({
    workspaceId,
    vendorProfileId,
    productId,
    promotionId,
    collectionId
  });

  const explicitActionHref = nullableText(formData, 'actionHref');
  validateDestinationReference(explicitActionHref);

  const actionHref = await resolveActionHref({
    workspaceId,
    assetId: id,
    campaignType,
    explicitHref: explicitActionHref,
    productId,
    promotionId,
    collectionId
  });

  const requestedActionLabel = nullableText(formData, 'actionLabel');
  const actionLabel = actionHref
    ? requestedActionLabel ??
      (campaignType === 'REEL'
        ? 'Shop this Reel'
        : productId
          ? 'View product'
          : promotionId
            ? 'View promotion'
            : collectionId
              ? 'Explore collection'
              : 'Learn more')
    : null;

  const duration = integerValue(
    formData,
    'durationSeconds',
    campaignType === 'STORY' ? 5 : campaignType === 'BANNER' ? 6 : 0,
    0,
    3_600
  );

  return {
    id,
    mediaType,
    mediaUrl,
    mediaAssetId,
    mobileMediaAssetId,
    coverMediaAssetId,
    posterMediaAssetId,
    mobileMediaUrl,
    coverUrl,
    posterUrl,
    eyebrow: nullableText(formData, 'eyebrow'),
    title: nullableText(formData, 'assetTitle'),
    description: nullableText(formData, 'assetDescription'),
    actionLabel,
    actionHref,
    productId,
    promotionId,
    collectionId,
    durationSeconds:
      duration > 0
        ? duration
        : campaignType === 'STORY'
          ? 5
          : campaignType === 'BANNER'
            ? 6
            : null,
    autoplay: booleanValue(formData, 'autoplay'),
    muted: booleanValue(formData, 'muted'),
    active: formData.has('activeAssetPresent')
      ? booleanValue(formData, 'activeAsset')
      : true
  };
}

async function recordAudit({
  workspaceId,
  actorId,
  action,
  targetId,
  summary,
  metadata
}: {
  workspaceId: string;
  actorId: string;
  action: string;
  targetId: string;
  summary: string;
  metadata?: Prisma.InputJsonObject;
}): Promise<void> {
  await prisma.adminAuditEvent.create({
    data: {
      workspaceId,
      actorId,
      action,
      targetType: 'EXPERIENCE',
      targetId,
      summary,
      metadata: metadata ?? undefined
    }
  });
}

function revalidateStoreStudio(): void {
  revalidatePath('/store');
  revalidatePath('/vendors');
  revalidatePath('/admin');
  revalidatePath('/admin/store-studio');
}

export async function createStoreStudioCampaign(
  formData: FormData
): Promise<void> {
  const access = await requireAdminPermission('experience:manage');
  const canReview = access.permissions.has('approval:review');
  const workspaceId = access.membership.workspaceId;

  const campaignType = enumValue(
    formData,
    'campaignType',
    CAMPAIGN_TYPES,
    'BANNER'
  );
  const title = text(formData, 'campaignTitle');

  if (!title) {
    throw new Error('Campaign title is required.');
  }

  const startsAt = nullableDate(formData, 'startsAt');
  const endsAt = nullableDate(formData, 'endsAt');
  validateDateRange(startsAt, endsAt);

  const requestedStatus = enumValue(
    formData,
    'status',
    CAMPAIGN_STATUSES,
    canReview ? 'ACTIVE' : 'PENDING_REVIEW'
  );
  const status = resolveStatus({
    requestedStatus,
    startsAt,
    canReview
  });

  const asset = await parseAsset({
    formData,
    workspaceId,
    vendorProfileId: null,
    campaignType
  });

  const campaignId = randomUUID();

  await prisma.$transaction(async transaction => {
    await transaction.storeStudioCampaign.create({
      data: {
        id: campaignId,
        workspaceId,
        type: campaignType,
        status,
        placementTier: enumValue(
          formData,
          'placementTier',
          PLACEMENT_TIERS,
          'STANDARD'
        ),
        title,
        description: nullableText(formData, 'campaignDescription'),
        startsAt:
          status === 'ACTIVE' && !startsAt
            ? new Date()
            : startsAt,
        endsAt,
        requestedPriority: integerValue(
          formData,
          'requestedPriority',
          0,
          -100,
          100
        ),
        adminWeight: canReview
          ? integerValue(formData, 'adminWeight', 0, -100, 100)
          : 0,
        active: !['PAUSED', 'EXPIRED', 'REJECTED'].includes(status),
        assets: {
          create: {
            ...asset,
            position: 0
          }
        }
      }
    });

    if (status === 'PENDING_REVIEW') {
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: campaignId,
        reason: `Review Store Studio ${campaignType.toLowerCase()} campaign “${title}”.`,
        payload: { campaignType, assetId: asset.id },
        priority: 'NORMAL'
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_CAMPAIGN_CREATED',
    targetId: campaignId,
    summary: `${campaignType} campaign “${title}” created by ${access.session.user.name}.`,
    metadata: {
      campaignType,
      status,
      assetId: asset.id
    }
  });

  revalidateStoreStudio();
  redirect(`/admin/store-studio?created=${campaignId}`);
}

export async function updateStoreStudioCampaign(
  formData: FormData
): Promise<void> {
  const access = await requireAdminPermission('experience:manage');
  const canReview = access.permissions.has('approval:review');
  const workspaceId = access.membership.workspaceId;
  const campaignId = text(formData, 'campaignId');

  const campaign = await prisma.storeStudioCampaign.findFirst({
    where: {
      id: campaignId,
      workspaceId
    },
    select: {
      id: true,
      type: true,
      status: true,
      active: true,
      startsAt: true,
      endsAt: true,
      title: true,
      vendorProfileId: true
    }
  });

  if (!campaign) {
    throw new Error('The Store Studio campaign is unavailable.');
  }

  const title = text(formData, 'campaignTitle');

  if (!title) {
    throw new Error('Campaign title is required.');
  }

  const startsAt = nullableDate(formData, 'startsAt');
  const endsAt = nullableDate(formData, 'endsAt');
  validateDateRange(startsAt, endsAt);

  const requestedStatus = enumValue(
    formData,
    'status',
    CAMPAIGN_STATUSES,
    campaign.status
  );
  const status = resolveStatus({
    requestedStatus,
    startsAt,
    canReview
  });

  await assertVendorCampaignPublication({
    workspaceId,
    vendorProfileId: campaign.vendorProfileId,
    status
  });

  await prisma.$transaction(async transaction => {
    const snapshot = {
      status: campaign.status,
      active: campaign.active,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt
    };
    const result = await transaction.storeStudioCampaign.update({
      where: { id: campaign.id },
      data: {
        title,
        description: nullableText(formData, 'campaignDescription'),
        status,
        placementTier: enumValue(
          formData,
          'placementTier',
          PLACEMENT_TIERS,
          'STANDARD'
        ),
        startsAt:
          status === 'ACTIVE' && !startsAt
            ? new Date()
            : startsAt,
        endsAt,
        requestedPriority: integerValue(
          formData,
          'requestedPriority',
          0,
          -100,
          100
        ),
        adminWeight: canReview
          ? integerValue(formData, 'adminWeight', 0, -100, 100)
          : undefined,
        active: !['PAUSED', 'EXPIRED', 'REJECTED'].includes(status)
      },
      select: { id: true, status: true, active: true, startsAt: true, endsAt: true }
    });

    if (status === 'PENDING_REVIEW') {
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        reason: `Review updated Store Studio campaign “${title}”.`,
        priority: 'NORMAL'
      });
    } else if (status === 'DRAFT') {
      await cancelApprovalRequestsForTarget(transaction, {
        workspaceId,
        actorId: access.session.user.id,
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        note: 'The campaign returned to draft during editing.'
      });
    } else if (['ACTIVE', 'SCHEDULED', 'PAUSED', 'REJECTED', 'EXPIRED'].includes(status)) {
      const approvalStatus =
        status === 'PAUSED'
          ? 'PAUSED'
          : status === 'REJECTED'
            ? 'REJECTED'
            : status === 'EXPIRED'
              ? 'EXPIRED'
              : 'EXECUTED';

      await synchronizeDirectApprovalDecision(transaction, {
        workspaceId,
        actorId: access.session.user.id,
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        status: approvalStatus,
        note: `Campaign updated directly to ${status}.`,
        targetSnapshot: snapshot,
        resultSnapshot: result
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_CAMPAIGN_UPDATED',
    targetId: campaign.id,
    summary: `Store Studio campaign “${title}” updated by ${access.session.user.name}.`,
    metadata: {
      previousTitle: campaign.title,
      status
    }
  });

  revalidateStoreStudio();
  redirect(`/admin/store-studio?updated=${campaign.id}`);
}

export async function addStoreStudioAsset(formData: FormData): Promise<void> {
  const access = await requireAdminPermission('experience:manage');
  const canReview = access.permissions.has('approval:review');
  const workspaceId = access.membership.workspaceId;
  const campaignId = text(formData, 'campaignId');

  const campaign = await prisma.storeStudioCampaign.findFirst({
    where: {
      id: campaignId,
      workspaceId
    },
    include: {
      assets: {
        select: {
          position: true
        },
        orderBy: {
          position: 'desc'
        },
        take: 1
      }
    }
  });

  if (!campaign) {
    throw new Error('The Store Studio campaign is unavailable.');
  }

  const asset = await parseAsset({
    formData,
    workspaceId,
    vendorProfileId: campaign.vendorProfileId,
    campaignType: campaign.type
  });

  const movedToReview = requiresManagerReview(
    campaign.status,
    canReview
  );

  await prisma.$transaction(async transaction => {
    await transaction.storeStudioAsset.create({
      data: {
        ...asset,
        campaignId: campaign.id,
        position: (campaign.assets[0]?.position ?? -1) + 1
      }
    });

    if (movedToReview) {
      await transaction.storeStudioCampaign.update({
        where: { id: campaign.id },
        data: { status: 'PENDING_REVIEW' }
      });
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        reason: `Review changes to Store Studio campaign “${campaign.title}”.`,
        priority: 'NORMAL'
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_ASSET_ADDED',
    targetId: campaign.id,
    summary: `A new asset was added to “${campaign.title}” by ${access.session.user.name}.`,
    metadata: {
      assetId: asset.id,
      movedToReview
    }
  });

  revalidateStoreStudio();
  redirect(`/admin/store-studio?assetAdded=${asset.id}`);
}

export async function updateStoreStudioAsset(formData: FormData): Promise<void> {
  const access = await requireAdminPermission('experience:manage');
  const canReview = access.permissions.has('approval:review');
  const workspaceId = access.membership.workspaceId;
  const assetId = text(formData, 'assetId');

  const currentAsset = await prisma.storeStudioAsset.findFirst({
    where: {
      id: assetId,
      campaign: {
        is: {
          workspaceId
        }
      }
    },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          vendorProfileId: true
        }
      }
    }
  });

  if (!currentAsset) {
    throw new Error('The Store Studio asset is unavailable.');
  }

  const asset = await parseAsset({
    formData,
    workspaceId,
    vendorProfileId: currentAsset.campaign.vendorProfileId,
    campaignType: currentAsset.campaign.type,
    fallbackAssetId: currentAsset.id
  });

  const movedToReview = requiresManagerReview(
    currentAsset.campaign.status,
    canReview
  );

  await prisma.$transaction(async transaction => {
    await transaction.storeStudioAsset.update({
      where: {
        id: currentAsset.id
      },
      data: {
        mediaType: asset.mediaType,
        mediaUrl: asset.mediaUrl,
        mediaAssetId: asset.mediaAssetId,
        mobileMediaAssetId: asset.mobileMediaAssetId,
        coverMediaAssetId: asset.coverMediaAssetId,
        posterMediaAssetId: asset.posterMediaAssetId,
        mobileMediaUrl: asset.mobileMediaUrl,
        coverUrl: asset.coverUrl,
        posterUrl: asset.posterUrl,
        eyebrow: asset.eyebrow,
        title: asset.title,
        description: asset.description,
        actionLabel: asset.actionLabel,
        actionHref: asset.actionHref,
        productId: asset.productId,
        promotionId: asset.promotionId,
        collectionId: asset.collectionId,
        durationSeconds: asset.durationSeconds,
        autoplay: asset.autoplay,
        muted: asset.muted,
        active: asset.active
      }
    });

    if (movedToReview) {
      await transaction.storeStudioCampaign.update({
        where: { id: currentAsset.campaign.id },
        data: { status: 'PENDING_REVIEW' }
      });
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: currentAsset.campaign.id,
        reason: `Review changes to Store Studio campaign “${currentAsset.campaign.title}”.`,
        priority: 'NORMAL'
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_ASSET_UPDATED',
    targetId: currentAsset.campaign.id,
    summary: `An asset in “${currentAsset.campaign.title}” was updated by ${access.session.user.name}.`,
    metadata: {
      assetId: currentAsset.id,
      movedToReview
    }
  });

  revalidateStoreStudio();
  redirect(`/admin/store-studio?assetUpdated=${currentAsset.id}`);
}

export async function moveStoreStudioAsset(formData: FormData): Promise<void> {
  const access = await requireAdminPermission('experience:manage');
  const canReview = access.permissions.has('approval:review');
  const workspaceId = access.membership.workspaceId;
  const assetId = text(formData, 'assetId');
  const direction = text(formData, 'direction');

  if (!['up', 'down'].includes(direction)) {
    throw new Error('Invalid asset movement direction.');
  }

  const asset = await prisma.storeStudioAsset.findFirst({
    where: {
      id: assetId,
      campaign: {
        is: {
          workspaceId
        }
      }
    },
    include: {
      campaign: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!asset) {
    throw new Error('The Store Studio asset is unavailable.');
  }

  const sibling = await prisma.storeStudioAsset.findFirst({
    where: {
      campaignId: asset.campaignId,
      active: true,
      position:
        direction === 'up'
          ? { lt: asset.position }
          : { gt: asset.position }
    },
    orderBy: {
      position: direction === 'up' ? 'desc' : 'asc'
    }
  });

  if (!sibling) {
    redirect('/admin/store-studio');
  }

  const movedToReview = requiresManagerReview(
    asset.campaign.status,
    canReview
  );

  await prisma.$transaction(async transaction => {
    await transaction.storeStudioAsset.update({
      where: { id: asset.id },
      data: { position: sibling.position }
    });

    await transaction.storeStudioAsset.update({
      where: { id: sibling.id },
      data: { position: asset.position }
    });

    if (movedToReview) {
      await transaction.storeStudioCampaign.update({
        where: { id: asset.campaign.id },
        data: { status: 'PENDING_REVIEW' }
      });
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: asset.campaign.id,
        reason: 'Review the updated Store Studio asset order.',
        priority: 'NORMAL'
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_ASSET_REORDERED',
    targetId: asset.campaign.id,
    summary: `Store Studio asset order changed by ${access.session.user.name}.`,
    metadata: {
      assetId: asset.id,
      direction,
      movedToReview
    }
  });

  revalidateStoreStudio();
  redirect('/admin/store-studio');
}

export async function transitionStoreStudioCampaign(
  formData: FormData
): Promise<void> {
  const transition = text(formData, 'transition');
  const reviewTransitions = new Set([
    'approve',
    'activate',
    'resume',
    'reject',
    'expire'
  ]);

  const access = await requireAdminPermission(
    reviewTransitions.has(transition)
      ? 'approval:review'
      : 'experience:manage'
  );
  const workspaceId = access.membership.workspaceId;
  const campaignId = text(formData, 'campaignId');

  const campaign = await prisma.storeStudioCampaign.findFirst({
    where: {
      id: campaignId,
      workspaceId
    }
  });

  if (!campaign) {
    throw new Error('The Store Studio campaign is unavailable.');
  }

  assertTransitionAllowed(transition, campaign.status);

  let status: CampaignStatus;
  let startsAt = campaign.startsAt;

  switch (transition) {
    case 'submit':
      status = 'PENDING_REVIEW';
      break;
    case 'approve':
      status = campaign.startsAt && campaign.startsAt > new Date()
        ? 'SCHEDULED'
        : 'ACTIVE';
      startsAt = campaign.startsAt ?? new Date();
      break;
    case 'activate':
      status = campaign.startsAt && campaign.startsAt > new Date()
        ? 'SCHEDULED'
        : 'ACTIVE';
      startsAt = campaign.startsAt ?? new Date();
      break;
    case 'pause':
      status = 'PAUSED';
      break;
    case 'resume':
      status = campaign.startsAt && campaign.startsAt > new Date()
        ? 'SCHEDULED'
        : 'ACTIVE';
      break;
    case 'reject':
      status = 'REJECTED';
      break;
    case 'expire':
      status = 'EXPIRED';
      break;
    default:
      throw new Error('Unsupported Store Studio transition.');
  }

  await assertVendorCampaignPublication({
    workspaceId,
    vendorProfileId: campaign.vendorProfileId,
    status
  });

  await prisma.$transaction(async transaction => {
    const snapshot = {
      status: campaign.status,
      active: campaign.active,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt
    };
    const result = await transaction.storeStudioCampaign.update({
      where: { id: campaign.id },
      data: {
        status,
        active: !['PAUSED', 'EXPIRED', 'REJECTED'].includes(status),
        startsAt,
        endsAt: status === 'EXPIRED' ? new Date() : campaign.endsAt
      },
      select: { id: true, status: true, active: true, startsAt: true, endsAt: true }
    });

    if (transition === 'submit') {
      await createOrResubmitApprovalRequest(transaction, {
        workspaceId,
        requestedById: access.session.user.id,
        source: campaign.vendorProfileId ? 'VENDOR' : 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        reason: `Review Store Studio campaign “${campaign.title}”.`,
        priority: 'NORMAL'
      });
    } else {
      const requestStatus =
        transition === 'pause'
          ? 'PAUSED'
          : transition === 'reject'
            ? 'REJECTED'
            : transition === 'expire'
              ? 'EXPIRED'
              : 'EXECUTED';
      await synchronizeDirectApprovalDecision(transaction, {
        workspaceId,
        actorId: access.session.user.id,
        targetType: 'CAMPAIGN',
        targetId: campaign.id,
        status: requestStatus,
        note: `Campaign moved directly from ${campaign.status} to ${status}.`,
        targetSnapshot: snapshot,
        resultSnapshot: result
      });
    }
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: `STORE_STUDIO_CAMPAIGN_${status}`,
    targetId: campaign.id,
    summary: `“${campaign.title}” moved to ${status.replaceAll('_', ' ')} by ${access.session.user.name}.`,
    metadata: {
      previousStatus: campaign.status,
      status,
      transition
    }
  });

  revalidateStoreStudio();
  redirect(`/admin/store-studio?status=${status.toLowerCase()}`);
}

export async function archiveStoreStudioCampaign(
  formData: FormData
): Promise<void> {
  const access = await requireAdminPermission('approval:review');
  const workspaceId = access.membership.workspaceId;
  const campaignId = text(formData, 'campaignId');

  const campaign = await prisma.storeStudioCampaign.findFirst({
    where: {
      id: campaignId,
      workspaceId
    }
  });

  if (!campaign) {
    throw new Error('The Store Studio campaign is unavailable.');
  }

  await prisma.$transaction(async transaction => {
    const result = await transaction.storeStudioCampaign.update({
      where: { id: campaign.id },
      data: {
        active: false,
        status: 'EXPIRED',
        endsAt: campaign.endsAt ?? new Date()
      },
      select: { id: true, status: true, active: true, endsAt: true }
    });
    await synchronizeDirectApprovalDecision(transaction, {
      workspaceId,
      actorId: access.session.user.id,
      targetType: 'CAMPAIGN',
      targetId: campaign.id,
      status: 'EXPIRED',
      note: 'The campaign was archived in Store Studio.',
      targetSnapshot: {
        status: campaign.status,
        active: campaign.active,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt
      },
      resultSnapshot: result
    });
  });

  await recordAudit({
    workspaceId,
    actorId: access.session.user.id,
    action: 'STORE_STUDIO_CAMPAIGN_ARCHIVED',
    targetId: campaign.id,
    summary: `“${campaign.title}” was archived by ${access.session.user.name}.`
  });

  revalidateStoreStudio();
  redirect('/admin/store-studio?archived=1');
}
