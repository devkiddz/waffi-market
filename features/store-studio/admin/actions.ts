'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import { prisma } from '@/lib/prisma';

type ProductReelDraft = {
  productId: string;
  title: string;
  caption: string;
  videoMediaAssetId: string;
  posterMediaAssetId: string;
  externalVideoUrl: string;
  externalPosterUrl: string;
  autoplay: boolean;
};

export type CreateProductReelsResult = {
  ok: boolean;
  count: number;
  status: 'active';
  message: string;
};

const MAX_REELS_PER_BATCH = 6;

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

function parseDrafts(formData: FormData): ProductReelDraft[] {
  const rawDrafts = String(formData.get('entries') ?? '');

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawDrafts);
  } catch {
    throw new Error('The Reel draft data is invalid.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('At least one Reel draft is required.');
  }

  const drafts = parsed
    .map(entry => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;

      return {
        productId: String(record.productId ?? '').trim(),
        title: String(record.title ?? '').trim(),
        caption: String(record.caption ?? '').trim(),
        videoMediaAssetId: String(record.videoMediaAssetId ?? '').trim(),
        posterMediaAssetId: String(record.posterMediaAssetId ?? '').trim(),
        externalVideoUrl: String(record.externalVideoUrl ?? '').trim(),
        externalPosterUrl: String(record.externalPosterUrl ?? '').trim(),
        autoplay: record.autoplay !== false
      } satisfies ProductReelDraft;
    })
    .filter((entry): entry is ProductReelDraft => Boolean(entry));

  if (!drafts.length) {
    throw new Error('Select at least one product for the Reel campaign.');
  }

  if (drafts.length > MAX_REELS_PER_BATCH) {
    throw new Error(
      `A Reel campaign can contain up to ${MAX_REELS_PER_BATCH} products at once.`
    );
  }

  const productIds = new Set<string>();

  for (const draft of drafts) {
    if (
      !draft.productId ||
      !draft.title ||
      (!draft.videoMediaAssetId && !draft.externalVideoUrl)
    ) {
      throw new Error(
        'Every Reel requires a product, title, and Media Studio video.'
      );
    }

    if (
      draft.externalVideoUrl &&
      !isMediaReference(draft.externalVideoUrl)
    ) {
      throw new Error(
        `The external video URL for “${draft.title}” is invalid.`
      );
    }

    if (
      draft.externalPosterUrl &&
      !isMediaReference(draft.externalPosterUrl)
    ) {
      throw new Error(
        `The external poster URL for “${draft.title}” is invalid.`
      );
    }

    if (productIds.has(draft.productId)) {
      throw new Error(
        'Each product may appear only once in the same Reel batch.'
      );
    }

    productIds.add(draft.productId);
  }

  return drafts;
}

export async function createProductReels(
  formData: FormData
): Promise<CreateProductReelsResult> {
  const access = await requireAdminPermission('approval:review');
  const workspaceId = access.membership.workspaceId;
  const drafts = parseDrafts(formData);
  const requestedTitle = String(
    formData.get('campaignTitle') ?? ''
  ).trim();

  const multivendorEnabled =
    access.membership.workspace.commerceMode === 'MULTI_VENDOR';

  const products = await prisma.product.findMany({
    where: {
      workspaceId,
      active: true,
      status: 'PUBLISHED' as const,
      id: {
        in: drafts.map(draft => draft.productId)
      },
      ...(multivendorEnabled
        ? {
            OR: [
              { vendorProfileId: null },
              {
                vendorProfile: {
                  active: true,
                  status: 'ACTIVE' as const
                }
              }
            ]
          }
        : { vendorProfileId: null })
    },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      images: {
        orderBy: {
          position: 'asc'
        },
        take: 1,
        select: {
          url: true
        }
      }
    }
  });

  if (products.length !== drafts.length) {
    throw new Error(
      'One or more selected products are not publicly available in this workspace.'
    );
  }

  const selectedMediaIds = Array.from(
    new Set(
      drafts.flatMap(draft =>
        [draft.videoMediaAssetId, draft.posterMediaAssetId].filter(Boolean)
      )
    )
  );

  const mediaAssets = selectedMediaIds.length
    ? await prisma.mediaAsset.findMany({
        where: {
          id: { in: selectedMediaIds },
          workspaceId,
          vendorProfileId: null,
          status: 'ACTIVE' as const
        },
        select: {
          id: true,
          secureUrl: true,
          resourceType: true
        }
      })
    : [];

  if (mediaAssets.length !== selectedMediaIds.length) {
    throw new Error(
      'One or more selected media assets are unavailable or not owned by this workspace.'
    );
  }

  const productMap = new Map(
    products.map(product => [product.id, product])
  );
  const mediaMap = new Map(
    mediaAssets.map(asset => [asset.id, asset])
  );

  for (const draft of drafts) {
    const video = draft.videoMediaAssetId
      ? mediaMap.get(draft.videoMediaAssetId)
      : null;
    const poster = draft.posterMediaAssetId
      ? mediaMap.get(draft.posterMediaAssetId)
      : null;

    if (video && video.resourceType !== 'VIDEO') {
      throw new Error(`“${draft.title}” must use a video asset.`);
    }

    if (poster && poster.resourceType !== 'IMAGE') {
      throw new Error(`The poster for “${draft.title}” must be an image.`);
    }
  }

  const campaignId = randomUUID();
  const status = 'ACTIVE' as const;

  const campaignTitle =
    requestedTitle ||
    `Product Reels · ${new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium'
    }).format(new Date())}`;

  await prisma.storeStudioCampaign.create({
    data: {
      id: campaignId,
      workspaceId,
      type: 'REEL',
      status,
      placementTier: 'STANDARD',
      title: campaignTitle,
      description:
        'Product-linked Reels created from the Shelsea storefront.',
      startsAt: new Date(),
      requestedPriority: 0,
      adminWeight: 0,
      active: true,

      assets: {
        create: drafts.map((draft, index) => {
          const product = productMap.get(draft.productId);
          const video = draft.videoMediaAssetId
            ? mediaMap.get(draft.videoMediaAssetId)
            : null;
          const poster = draft.posterMediaAssetId
            ? mediaMap.get(draft.posterMediaAssetId)
            : null;
          const assetId = randomUUID();
          const posterUrl =
            poster?.secureUrl ||
            draft.externalPosterUrl ||
            product?.images[0]?.url ||
            null;

          return {
            id: assetId,
            mediaType: 'VIDEO' as const,
            mediaUrl: video?.secureUrl || draft.externalVideoUrl,
            mediaAssetId: video?.id ?? null,
            posterUrl,
            posterMediaAssetId: poster?.id ?? null,
            coverUrl: posterUrl,
            coverMediaAssetId: poster?.id ?? null,
            title: draft.title || product?.name || 'Store Reel',
            description:
              draft.caption ||
              product?.shortDescription ||
              null,
            actionLabel: 'Shop this Reel',
            actionHref: `/reels/${assetId}`,
            productId: draft.productId,
            autoplay: draft.autoplay,
            muted: true,
            position: index,
            active: true
          };
        })
      }
    }
  });

  await prisma.adminAuditEvent.create({
    data: {
      workspaceId,
      actorId: access.session.user.id,
      action: 'STORE_STUDIO_PRODUCT_REELS_CREATED',
      targetType: 'EXPERIENCE',
      targetId: campaignId,
      summary: `${drafts.length} product Reel${drafts.length === 1 ? '' : 's'} created by ${access.session.user.name}.`,
      metadata: {
        campaignTitle,
        status,
        productIds: drafts.map(draft => draft.productId),
        mediaAssetIds: selectedMediaIds,
        reelCount: drafts.length
      }
    }
  });

  revalidatePath('/store');
  revalidatePath('/shops');
  revalidatePath('/admin');
  revalidatePath('/admin/store-studio');

  return {
    ok: true,
    count: drafts.length,
    status: 'active',
    message: `${drafts.length} Reel${drafts.length === 1 ? '' : 's'} published to the Store.`
  };
}
