import 'server-only';

import type { CollectionLayout, CollectionType } from '@/data/collections';
import { mapDatabaseProduct } from '@/features/catalog/mappers/map-database-product';
import type { CommerceStory } from '@/features/commerce-stories';
import { resolvePublicCommerceWorkspace } from '@/features/commerce-mode/server/resolvePublicCommerceWorkspace';
import { resolveStudioCroppedMedia } from '@/features/studio-controls/cropMetadata';
import { prisma } from '@/lib/prisma';

import type {
  VendorDirectoryItem,
  VendorStorefront,
  VendorPromotionDetail,
  VendorStorefrontCampaignPreview,
  VendorStorefrontPromotion
} from '../contracts';

const LIVE_CAMPAIGN_STATUSES = ['SCHEDULED', 'ACTIVE'] as const;

function collectionLayout(
  value: 'FEATURED' | 'CAROUSEL' | 'GRID' | 'SPOTLIGHT'
): CollectionLayout {
  return value.toLowerCase() as CollectionLayout;
}

function liveScheduleWhere(now: Date) {
  return {
    AND: [
      {
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ]
      },
      {
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } }
        ]
      }
    ]
  };
}

function promotionBadge(
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE' | 'FEATURED',
  discountValue: unknown
): string {
  if (type === 'FEATURED') {
    return 'FEATURED';
  }

  if (type === 'PERCENTAGE' && discountValue !== null) {
    return `${Number(discountValue)}% OFF`;
  }

  if (type === 'FIXED_PRICE') {
    return 'SPECIAL PRICE';
  }

  return 'LIMITED OFFER';
}

export async function getVendorDirectory(): Promise<
  | {
      workspaceName: string;
      vendors: VendorDirectoryItem[];
    }
  | null
> {
  const workspace = await resolvePublicCommerceWorkspace();

  if (!workspace?.capabilities.vendorDirectoryVisible) {
    return null;
  }

  const now = new Date();

  const vendors = await prisma.vendorProfile.findMany({
    where: {
      workspaceId: workspace.id,
      active: true,
      status: 'ACTIVE'
    },
    include: {
      logoMediaAsset: {
        select: {
          secureUrl: true
        }
      },
      _count: {
        select: {
          products: {
            where: {
              active: true,
              status: 'PUBLISHED'
            }
          },
          collections: {
            where: {
              active: true,
              status: 'PUBLISHED',
              ...liveScheduleWhere(now)
            }
          },
          promotions: {
            where: {
              active: true,
              status: 'PUBLISHED',
              ...liveScheduleWhere(now)
            }
          }
        }
      }
    },
    orderBy: [
      { updatedAt: 'desc' },
      { name: 'asc' }
    ]
  });

  if (vendors.length === 0) {
    return {
      workspaceName: workspace.name,
      vendors: []
    };
  }

  const campaignCounts = await prisma.storeStudioCampaign.groupBy({
    by: ['vendorProfileId', 'type'],
    where: {
      workspaceId: workspace.id,
      vendorProfileId: {
        in: vendors.map(vendor => vendor.id)
      },
      active: true,
      status: {
        in: [...LIVE_CAMPAIGN_STATUSES]
      },
      type: {
        in: ['STORY', 'REEL']
      },
      ...liveScheduleWhere(now)
    },
    _count: {
      _all: true
    }
  });

  const bannerCampaigns = await prisma.storeStudioCampaign.findMany({
    where: {
      workspaceId: workspace.id,
      vendorProfileId: { in: vendors.map(vendor => vendor.id) },
      active: true,
      status: { in: [...LIVE_CAMPAIGN_STATUSES] },
      type: 'BANNER',
      ...liveScheduleWhere(now)
    },
    select: {
      id: true,
      vendorProfileId: true,
      title: true,
      description: true,
      assets: {
        where: { active: true, mediaType: 'IMAGE' },
        orderBy: { position: 'asc' },
        select: {
          id: true, mediaUrl: true, mobileMediaUrl: true, title: true,
          description: true, actionHref: true, durationSeconds: true
        }
      }
    },
    orderBy: [{ adminWeight: 'desc' }, { requestedPriority: 'desc' }]
  });

  const countFor = (
    vendorId: string,
    type: 'STORY' | 'REEL'
  ): number =>
    campaignCounts.find(
      count =>
        count.vendorProfileId === vendorId &&
        count.type === type
    )?._count._all ?? 0;

  return {
    workspaceName: workspace.name,
    vendors: vendors.map(vendor => ({
      id: vendor.id,
      slug: vendor.slug,
      name: vendor.name,
      description: vendor.description,
      logoUrl: vendor.logoMediaAsset?.secureUrl ?? null,
      productCount: vendor._count.products,
      collectionCount: vendor._count.collections,
      promotionCount: vendor._count.promotions,
      storyCount: countFor(vendor.id, 'STORY'),
      reelCount: countFor(vendor.id, 'REEL'),
      banners: bannerCampaigns
        .filter(campaign => campaign.vendorProfileId === vendor.id)
        .flatMap(campaign => campaign.assets.map(asset => ({
          id: asset.id,
          mediaUrl: asset.mediaUrl,
          mobileMediaUrl: asset.mobileMediaUrl,
          title: asset.title ?? campaign.title,
          description: asset.description ?? campaign.description,
          actionHref: asset.actionHref?.startsWith('/') && !asset.actionHref.startsWith('//')
            ? asset.actionHref : `/shops/${encodeURIComponent(vendor.slug)}`,
          durationSeconds: asset.durationSeconds ?? 6
        })))
    }))
  };
}

export async function getVendorStorefront(
  vendorSlug: string
): Promise<VendorStorefront | null> {
  const workspace = await resolvePublicCommerceWorkspace();

  if (!workspace?.capabilities.vendorStorefrontsVisible) {
    return null;
  }

  const normalizedSlug = decodeURIComponent(vendorSlug)
    .trim()
    .toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const vendor = await prisma.vendorProfile.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: normalizedSlug,
      active: true,
      status: 'ACTIVE'
    },
    include: {
      logoMediaAsset: {
        select: {
          secureUrl: true
        }
      }
    }
  });

  if (!vendor) {
    return null;
  }

  const now = new Date();

  const [products, collectionRecords, promotionRecords, campaignRecords] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          workspaceId: workspace.id,
          vendorProfileId: vendor.id,
          active: true,
          status: 'PUBLISHED'
        },
        include: {
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
          vendorProfile: {
            select: {
              id: true,
              slug: true,
              name: true,
              logoMediaAsset: {
                select: {
                  secureUrl: true
                }
              }
            }
          },
          images: {
            orderBy: {
              position: 'asc'
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
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.storeCollection.findMany({
        where: {
          workspaceId: workspace.id,
          vendorProfileId: vendor.id,
          active: true,
          status: 'PUBLISHED',
          ...liveScheduleWhere(now)
        },
        include: {
          coverMediaAsset: {
            select: {
              secureUrl: true,
              metadata: true
            }
          },
          products: {
            orderBy: {
              position: 'asc'
            },
            include: {
              product: {
                select: {
                  id: true,
                  active: true,
                  status: true,
                  vendorProfileId: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      prisma.promotion.findMany({
        where: {
          workspaceId: workspace.id,
          vendorProfileId: vendor.id,
          active: true,
          status: 'PUBLISHED',
          ...liveScheduleWhere(now)
        },
        include: {
          bannerMediaAsset: {
            select: {
              secureUrl: true,
              metadata: true
            }
          },
          products: {
            select: {
              productId: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      prisma.storeStudioCampaign.findMany({
        where: {
          workspaceId: workspace.id,
          vendorProfileId: vendor.id,
          active: true,
          status: {
            in: [...LIVE_CAMPAIGN_STATUSES]
          },
          type: {
            in: ['STORY', 'REEL']
          },
          ...liveScheduleWhere(now)
        },
        include: {
          assets: {
            where: {
              active: true
            },
            include: {
              mediaAsset: {
                select: {
                  metadata: true
                }
              },
              coverMediaAsset: {
                select: {
                  metadata: true
                }
              },
              posterMediaAsset: {
                select: {
                  metadata: true
                }
              }
            },
            orderBy: {
              position: 'asc'
            }
          }
        },
        orderBy: [
          { adminWeight: 'desc' },
          { requestedPriority: 'desc' },
          { updatedAt: 'desc' }
        ]
      })
    ]);

  const mappedProducts = products.map(mapDatabaseProduct);
  const visibleProductIds = new Set(mappedProducts.map(product => product.id));

  const collections: CollectionType[] = collectionRecords
    .map(record => {
      const productIds = record.products
        .map(item => item.product)
        .filter(
          product =>
            product.active &&
            product.status === 'PUBLISHED' &&
            product.vendorProfileId === vendor.id &&
            visibleProductIds.has(product.id)
        )
        .map(product => product.id);

      const cover = record.coverMediaAsset
        ? resolveStudioCroppedMedia(
            record.coverMediaAsset.secureUrl,
            record.coverMediaAsset.metadata,
            'collection-cover'
          )
        : null;

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        ...(record.subtitle ? { subtitle: record.subtitle } : {}),
        layout: collectionLayout(record.layout),
        ...(cover
          ? {
              banner: {
                title: record.title,
                ...(record.description
                  ? { description: record.description }
                  : {}),
                image: cover.url,
                ctaLabel: 'View collection',
                href: `/collections/${encodeURIComponent(record.slug)}`
              }
            }
          : {}),
        ...(record.featuredProductId &&
        productIds.includes(record.featuredProductId)
          ? { featuredProductId: record.featuredProductId }
          : {}),
        productIds,
        active: true,
        priority: record.priority,
        merchant: {
          id: vendor.id,
          slug: vendor.slug,
          name: vendor.name,
          ...(vendor.logoMediaAsset?.secureUrl
            ? { logoUrl: vendor.logoMediaAsset.secureUrl }
            : {})
        }
      } satisfies CollectionType;
    })
    .filter(collection => collection.productIds.length > 0);

  const promotions: VendorStorefrontPromotion[] = promotionRecords.map(
    promotion => {
      const image = promotion.bannerMediaAsset
        ? resolveStudioCroppedMedia(
            promotion.bannerMediaAsset.secureUrl,
            promotion.bannerMediaAsset.metadata,
            'promotion-banner'
          ).url
        : null;

      const productIds = promotion.products
        .map(item => item.productId)
        .filter(productId => visibleProductIds.has(productId));

      return {
        id: promotion.id,
        slug: promotion.slug,
        title: promotion.title,
        description: promotion.description,
        badge: promotionBadge(promotion.type, promotion.discountValue),
        imageUrl: image,
        href: `/shops/${encodeURIComponent(vendor.slug)}/promotions/${encodeURIComponent(promotion.slug)}`,
        productIds,
        productCount: productIds.length,
        startsAt: promotion.startsAt?.toISOString() ?? null,
        endsAt: promotion.endsAt?.toISOString() ?? null
      };
    }
  ).filter(promotion => promotion.productCount > 0);

  const stories: CommerceStory[] = [];
  const reels: VendorStorefrontCampaignPreview[] = [];

  for (const campaign of campaignRecords) {
    const campaignPriority =
      campaign.adminWeight + campaign.requestedPriority;

    for (const asset of campaign.assets) {
      const coverSource =
        asset.posterUrl ?? asset.coverUrl ?? asset.mediaUrl;
      const coverMetadata =
        asset.posterMediaAsset?.metadata ??
        asset.coverMediaAsset?.metadata ??
        asset.mediaAsset?.metadata;
      const coverPurpose =
        campaign.type === 'REEL' ? 'reel-cover' : 'story';
      const cover = resolveStudioCroppedMedia(
        coverSource,
        coverMetadata,
        coverPurpose
      );

      if (campaign.type === 'STORY') {
        const media = resolveStudioCroppedMedia(
          asset.mediaUrl,
          asset.mediaAsset?.metadata,
          'story'
        );
        const poster = asset.posterUrl
          ? resolveStudioCroppedMedia(
              asset.posterUrl,
              asset.posterMediaAsset?.metadata,
              'video-poster'
            )
          : null;
        const actionType = asset.productId
          ? 'product'
          : asset.promotionId
            ? 'promotion'
            : asset.collectionId
              ? 'collection'
              : asset.actionHref
                ? 'vendor'
                : 'none';
        const storyType = asset.productId
          ? 'product'
          : asset.promotionId
            ? 'promotion'
            : asset.collectionId
              ? 'collection'
              : 'announcement';

        stories.push({
          id: asset.id,
          workspaceId: workspace.id,
          vendorId: vendor.id,
          title: asset.title ?? campaign.title,
          label: asset.eyebrow ?? vendor.name,
          storyType,
          mediaType: asset.mediaType === 'VIDEO' ? 'video' : 'image',
          mediaUrl: media.url,
          coverUrl: cover.url,
          ...(poster ? { posterUrl: poster.url } : {}),
          mediaObjectPosition: media.objectPosition,
          coverObjectPosition: cover.objectPosition,
          ...(poster?.objectPosition
            ? { posterObjectPosition: poster.objectPosition }
            : {}),
          actionType,
          ...(asset.productId ? { productIds: [asset.productId] } : {}),
          ...(asset.promotionId
            ? { promotionId: asset.promotionId }
            : {}),
          ...(asset.collectionId
            ? { collectionId: asset.collectionId }
            : {}),
          ...(asset.actionLabel
            ? { actionLabel: asset.actionLabel }
            : {}),
          ...(asset.actionHref
            ? { actionHref: asset.actionHref }
            : actionType === 'vendor'
              ? {
                  actionHref: `/shops/${encodeURIComponent(vendor.slug)}`
                }
              : {}),
          durationMs: Math.max(
            1_000,
            (asset.durationSeconds ?? 5) * 1_000
          ),
          startsAt: campaign.startsAt?.toISOString(),
          endsAt: campaign.endsAt?.toISOString(),
          active: true,
          priority: campaignPriority,
          createdAt: asset.createdAt.toISOString(),
          updatedAt: asset.updatedAt.toISOString()
        });

        continue;
      }

      reels.push({
        id: asset.id,
        campaignId: campaign.id,
        type: 'reel',
        title: asset.title ?? campaign.title,
        description: asset.description ?? campaign.description,
        mediaType: asset.mediaType === 'VIDEO' ? 'video' : 'image',
        mediaUrl: asset.mediaUrl,
        coverUrl: cover.url,
        href: `/reels/${encodeURIComponent(asset.id)}`
      });
    }
  }

  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    description: vendor.description,
    email: vendor.email,
    phone: vendor.phone,
    logoUrl: vendor.logoMediaAsset?.secureUrl ?? null,
    products: mappedProducts,
    collections,
    promotions,
    stories: stories.sort((left, right) => right.priority - left.priority),
    reels
  };
}


export async function getVendorPromotion(
  vendorSlug: string,
  promotionSlug: string
): Promise<VendorPromotionDetail | null> {
  const workspace = await resolvePublicCommerceWorkspace();

  if (!workspace?.capabilities.vendorStorefrontsVisible) {
    return null;
  }

  const normalizedVendorSlug = decodeURIComponent(vendorSlug)
    .trim()
    .toLowerCase();
  const normalizedPromotionSlug = decodeURIComponent(promotionSlug)
    .trim()
    .toLowerCase();

  if (!normalizedVendorSlug || !normalizedPromotionSlug) {
    return null;
  }

  const now = new Date();

  const promotion = await prisma.promotion.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: normalizedPromotionSlug,
      vendorProfile: {
        is: {
          slug: normalizedVendorSlug,
          active: true,
          status: 'ACTIVE'
        }
      },
      active: true,
      status: 'PUBLISHED',
      ...liveScheduleWhere(now)
    },
    include: {
      vendorProfile: {
        include: {
          logoMediaAsset: {
            select: {
              secureUrl: true
            }
          }
        }
      },
      bannerMediaAsset: {
        select: {
          secureUrl: true,
          metadata: true
        }
      },
      products: {
        orderBy: {
          position: 'asc'
        },
        include: {
          product: {
            include: {
              category: true,
              subcategory: true,
              vendorProfile: {
                include: {
                  logoMediaAsset: true
                }
              },
              images: {
                orderBy: {
                  position: 'asc'
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
            }
          }
        }
      }
    }
  });

  if (!promotion?.vendorProfile) {
    return null;
  }

  const products = promotion.products
    .map(item => item.product)
    .filter(
      product =>
        product.active &&
        product.status === 'PUBLISHED' &&
        product.vendorProfileId === promotion.vendorProfileId
    )
    .map(mapDatabaseProduct);

  if (products.length === 0) {
    return null;
  }

  const image = promotion.bannerMediaAsset
    ? resolveStudioCroppedMedia(
        promotion.bannerMediaAsset.secureUrl,
        promotion.bannerMediaAsset.metadata,
        'promotion-banner'
      ).url
    : null;

  return {
    vendor: {
      id: promotion.vendorProfile.id,
      slug: promotion.vendorProfile.slug,
      name: promotion.vendorProfile.name,
      logoUrl: promotion.vendorProfile.logoMediaAsset?.secureUrl ?? null
    },
    promotion: {
      id: promotion.id,
      slug: promotion.slug,
      title: promotion.title,
      description: promotion.description,
      badge: promotionBadge(promotion.type, promotion.discountValue),
      imageUrl: image,
      href: `/shops/${encodeURIComponent(promotion.vendorProfile.slug)}/promotions/${encodeURIComponent(promotion.slug)}`,
      productIds: products.map(product => product.id),
      productCount: products.length,
      startsAt: promotion.startsAt?.toISOString() ?? null,
      endsAt: promotion.endsAt?.toISOString() ?? null
    },
    products
  };
}
