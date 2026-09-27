import type { WorkspaceCommerceMode } from '@/lib/generated/prisma/client';

import type { CollectionLayout, CollectionType } from '@/data/collections';
import { resolveCommerceCapabilities } from '@/features/commerce-mode';
import { resolveStudioCroppedMedia } from '@/features/studio-controls/cropMetadata';
import { prisma } from '@/lib/prisma';

import type { CatalogCategoryRecord } from '../catalogTypes';
import { mapDatabaseProduct } from '../mappers/map-database-product';

export type CatalogWorkspaceScope = {
  id: string;
  commerceMode: WorkspaceCommerceMode;
};

function vendorVisibilityWhere(
  commerceMode: WorkspaceCommerceMode
) {
  return resolveCommerceCapabilities(commerceMode).vendorCatalogVisible
    ? {
        OR: [
          {
            vendorProfileId: null
          },
          {
            vendorProfile: {
              is: {
                status: 'ACTIVE' as const,
                active: true
              }
            }
          }
        ]
      }
    : {
        vendorProfileId: null
      };
}

function collectionLayout(
  value: 'FEATURED' | 'CAROUSEL' | 'GRID' | 'SPOTLIGHT'
): CollectionLayout {
  return value.toLowerCase() as CollectionLayout;
}

export async function resolveCatalogWorkspace(
  requestedWorkspaceId: string | null | undefined
): Promise<CatalogWorkspaceScope | null> {
  const requested = requestedWorkspaceId?.trim();

  if (requested && requested !== 'guest-live') {
    return prisma.workspace.findFirst({
      where: {
        id: requested,
        active: true
      },
      select: {
        id: true,
        commerceMode: true
      }
    });
  }

  return prisma.workspace.findFirst({
    where: {
      active: true,
      mode: 'LIVE'
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      commerceMode: true
    }
  });
}

export async function getCatalog(
  workspace: CatalogWorkspaceScope
) {
  const products = await prisma.product.findMany({
    where: {
      workspaceId: workspace.id,
      active: true,
      status: 'PUBLISHED',
      ...vendorVisibilityWhere(workspace.commerceMode)
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
    orderBy: {
      createdAt: 'desc'
    }
  });

  return products.map(mapDatabaseProduct);
}

export async function getCatalogCollections(
  workspace: CatalogWorkspaceScope
): Promise<CollectionType[]> {
  const now = new Date();
  const capabilities = resolveCommerceCapabilities(workspace.commerceMode);

  const records = await prisma.storeCollection.findMany({
    where: {
      workspaceId: workspace.id,
      active: true,
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            {
              startsAt: null
            },
            {
              startsAt: {
                lte: now
              }
            }
          ]
        },
        {
          OR: [
            {
              endsAt: null
            },
            {
              endsAt: {
                gte: now
              }
            }
          ]
        }
      ]
    },
    include: {
      coverMediaAsset: {
        select: {
          secureUrl: true,
          metadata: true
        }
      },
      vendorProfile: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          active: true,
          logoMediaAsset: {
            select: {
              secureUrl: true
            }
          }
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
    },
    orderBy: [
      {
        priority: 'desc'
      },
      {
        updatedAt: 'desc'
      }
    ]
  });

  return records
    .filter(record => {
      if (!record.vendorProfileId) {
        return true;
      }

      return (
        capabilities.vendorCollectionsVisible &&
        record.vendorProfile?.status === 'ACTIVE' &&
        record.vendorProfile.active
      );
    })
    .map(record => {
      const productIds = record.products
        .filter(({ product }) => {
          if (!product.active || product.status !== 'PUBLISHED') {
            return false;
          }

          if (record.vendorProfileId) {
            return (
              capabilities.vendorCatalogVisible &&
              product.vendorProfileId === record.vendorProfileId &&
              product.vendorProfile?.status === 'ACTIVE' &&
              product.vendorProfile.active
            );
          }

          if (!product.vendorProfileId) {
            return true;
          }

          return (
            capabilities.vendorCatalogVisible &&
            product.vendorProfile?.status === 'ACTIVE' &&
            product.vendorProfile.active
          );
        })
        .map(({ product }) => product.id);

      const featuredProductId =
        record.featuredProductId &&
        productIds.includes(record.featuredProductId)
          ? record.featuredProductId
          : undefined;

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
        ...(record.subtitle
          ? {
              subtitle: record.subtitle
            }
          : {}),
        layout: collectionLayout(record.layout),
        ...(cover
          ? {
              banner: {
                eyebrow: record.subtitle ?? 'Curated collection',
                title: record.title,
                ...(record.description
                  ? {
                      description: record.description
                    }
                  : {}),
                image: cover.url,
                ctaLabel: 'Explore collection',
                href: `/collections/${encodeURIComponent(record.slug)}`
              }
            }
          : {}),
        ...(featuredProductId
          ? {
              featuredProductId
            }
          : {}),
        productIds,
        active: true,
        priority: record.priority,
        ...(record.vendorProfile
          ? {
              merchant: {
                id: record.vendorProfile.id,
                slug: record.vendorProfile.slug,
                name: record.vendorProfile.name,
                ...(record.vendorProfile.logoMediaAsset?.secureUrl
                  ? {
                      logoUrl:
                        record.vendorProfile.logoMediaAsset.secureUrl
                    }
                  : {})
              }
            }
          : {})
      };
    })
    .filter(collection => collection.productIds.length > 0);
}

export async function getCatalogCategories(): Promise<CatalogCategoryRecord[]> {
  const categories = await prisma.category.findMany({
    where: {
      active: true
    },
    select: {
      id: true,
      slug: true,
      label: true,
      iconName: true,
      image: true,
      coverImages: true,
      shortDescription: true,
      description: true,
      accentColor: true,
      className: true,
      subcategories: {
        where: {
          active: true
        },
        orderBy: [{ position: 'asc' }, { label: 'asc' }],
        select: { slug: true, label: true }
      }
    },
    orderBy: [{ position: 'asc' }, { label: 'asc' }]
  });

  return categories.map(category => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    iconName: category.iconName,
    image: category.image || '/placeholder.svg',
    coverImages: category.coverImages,
    shortDescription: category.shortDescription || '',
    description: category.description || '',
    ...(category.accentColor ? { accentColor: category.accentColor } : {}),
    subcategories: category.subcategories.map(subcategory => ({
      label: subcategory.label,
      slug: subcategory.slug
    })),
    ...(category.className ? { className: category.className } : {})
  }));
}
