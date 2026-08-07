import 'server-only';

import type {
  AdminTargetType,
  Prisma
} from '@/lib/generated/prisma/client';

import type { ApprovalInspection } from './approvalTypes';

type ApprovalDatabase = Pick<
  Prisma.TransactionClient,
  | 'product'
  | 'promotion'
  | 'storeCollection'
  | 'storeStudioCampaign'
  | 'vendorProfile'
  | 'mediaAsset'
  | 'shoppingList'
  | 'order'
  | 'delivery'
  | 'user'
  | 'staffProfile'
  | 'inventory'
>;

function money(value: unknown): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
      }).format(amount)
    : '—';
}

function text(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleString('en-NG');
  return String(value).replaceAll('_', ' ');
}

function base(
  targetType: AdminTargetType,
  targetId: string
): ApprovalInspection {
  return {
    targetType,
    targetId,
    title: `${targetType.replaceAll('_', ' ')} request`,
    subtitle: null,
    status: null,
    href: null,
    images: [],
    fields: [],
    metrics: [],
    products: [],
    warnings: [],
    canExecute: false,
    unsupportedReason: null
  };
}

function availableQuantity(
  variants: Array<{
    active: boolean;
    inventory: {
      quantity: number;
      reserved: number;
    } | null;
  }>
): number {
  return variants
    .filter(variant => variant.active)
    .reduce(
      (total, variant) =>
        total +
        Math.max(
          0,
          (variant.inventory?.quantity ?? 0) -
            (variant.inventory?.reserved ?? 0)
        ),
      0
    );
}

export async function resolveApprovalInspection(
  database: ApprovalDatabase,
  input: {
    workspaceId: string;
    targetType: AdminTargetType;
    targetId: string;
  }
): Promise<ApprovalInspection> {
  const fallback = base(input.targetType, input.targetId);

  if (input.targetType === 'PRODUCT') {
    const product = await database.product.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        category: {
          select: {
            label: true
          }
        },
        subcategory: {
          select: {
            label: true
          }
        },
        brand: {
          select: {
            name: true
          }
        },
        vendorProfile: {
          select: {
            name: true,
            status: true,
            active: true
          }
        },
        images: {
          orderBy: [
            {
              primary: 'desc'
            },
            {
              position: 'asc'
            }
          ],
          take: 8
        },
        variants: {
          include: {
            inventory: true
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!product) {
      return {
        ...fallback,
        unsupportedReason: 'The product no longer exists in this workspace.'
      };
    }

    const available = availableQuantity(product.variants);

    return {
      ...fallback,
      title: product.name,
      subtitle: [
        product.category.label,
        product.subcategory?.label,
        product.brand?.name,
        product.vendorProfile?.name
      ]
        .filter(Boolean)
        .join(' · '),
      status: product.status,
      href: `/admin/products/${product.id}`,
      images: product.images.map(image => image.url),
      fields: [
        {
          label: 'Slug',
          value: product.slug
        },
        {
          label: 'Short description',
          value: product.shortDescription ?? '—'
        },
        {
          label: 'Vendor',
          value: product.vendorProfile?.name ?? 'Shelsea workspace'
        },
        {
          label: 'Active',
          value: product.active ? 'Yes' : 'No'
        }
      ],
      metrics: [
        {
          label: 'Variants',
          value: String(product.variants.length)
        },
        {
          label: 'Available stock',
          value: String(available)
        },
        {
          label: 'Sold',
          value: String(product.soldCount)
        },
        {
          label: 'Rating',
          value: product.rating.toFixed(1)
        }
      ],
      products: [
        {
          id: product.id,
          name: product.name,
          imageUrl: product.images[0]?.url ?? null,
          status: product.status,
          available
        }
      ],
      warnings: [
        ...(product.images.length === 0
          ? ['The product has no customer-facing gallery image.']
          : []),
        ...(product.variants.length === 0
          ? ['The product has no purchasable variants.']
          : []),
        ...(available <= 0
          ? ['All active variants are currently unavailable.']
          : []),
        ...(product.vendorProfile &&
        (!product.vendorProfile.active ||
          product.vendorProfile.status !== 'ACTIVE')
          ? ['The owning vendor is not currently active.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'PROMOTION') {
    const promotion = await database.promotion.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        bannerMediaAsset: true,
        vendorProfile: {
          select: {
            name: true,
            status: true,
            active: true
          }
        },
        products: {
          orderBy: {
            position: 'asc'
          },
          include: {
            product: {
              include: {
                images: {
                  orderBy: [
                    {
                      primary: 'desc'
                    },
                    {
                      position: 'asc'
                    }
                  ],
                  take: 1
                },
                variants: {
                  where: {
                    active: true
                  },
                  include: {
                    inventory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!promotion) {
      return {
        ...fallback,
        unsupportedReason: 'The promotion no longer exists in this workspace.'
      };
    }

    const products = promotion.products.map(item => ({
      id: item.product.id,
      name: item.product.name,
      imageUrl: item.product.images[0]?.url ?? null,
      status: item.product.status,
      available: availableQuantity(item.product.variants)
    }));

    return {
      ...fallback,
      title: promotion.title,
      subtitle:
        promotion.vendorProfile?.name ??
        'Shelsea workspace promotion',
      status: promotion.status,
      href: `/admin/promotions?edit=${promotion.id}`,
      images: promotion.bannerMediaAsset
        ? [promotion.bannerMediaAsset.secureUrl]
        : products
            .map(product => product.imageUrl)
            .filter((value): value is string => Boolean(value))
            .slice(0, 5),
      fields: [
        {
          label: 'Offer type',
          value: text(promotion.type)
        },
        {
          label: 'Discount value',
          value:
            promotion.discountValue === null
              ? '—'
              : money(promotion.discountValue)
        },
        {
          label: 'Code',
          value: promotion.code ?? '—'
        },
        {
          label: 'Schedule',
          value: `${text(promotion.startsAt)} → ${text(promotion.endsAt)}`
        }
      ],
      metrics: [
        {
          label: 'Products',
          value: String(products.length)
        },
        {
          label: 'Available',
          value: String(
            products.filter(product => product.available > 0).length
          )
        },
        {
          label: 'Priority',
          value: String(promotion.priority)
        }
      ],
      products,
      warnings: [
        ...(products.length === 0
          ? ['The promotion does not contain any products.']
          : []),
        ...(!promotion.bannerMediaAsset
          ? ['The promotion has no banner image.']
          : []),
        ...(promotion.vendorProfile &&
        (!promotion.vendorProfile.active ||
          promotion.vendorProfile.status !== 'ACTIVE')
          ? ['The owning vendor is not currently active.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'COLLECTION') {
    const collection = await database.storeCollection.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        coverMediaAsset: true,
        vendorProfile: {
          select: {
            name: true,
            status: true,
            active: true
          }
        },
        products: {
          orderBy: {
            position: 'asc'
          },
          include: {
            product: {
              include: {
                images: {
                  orderBy: [
                    {
                      primary: 'desc'
                    },
                    {
                      position: 'asc'
                    }
                  ],
                  take: 1
                },
                variants: {
                  where: {
                    active: true
                  },
                  include: {
                    inventory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!collection) {
      return {
        ...fallback,
        unsupportedReason: 'The collection no longer exists in this workspace.'
      };
    }

    const products = collection.products.map(item => ({
      id: item.product.id,
      name: item.product.name,
      imageUrl: item.product.images[0]?.url ?? null,
      status: item.product.status,
      available: availableQuantity(item.product.variants)
    }));

    return {
      ...fallback,
      title: collection.title,
      subtitle:
        collection.vendorProfile?.name ??
        'Shelsea workspace collection',
      status: collection.status,
      href: `/admin/collections?edit=${collection.id}`,
      images: collection.coverMediaAsset
        ? [collection.coverMediaAsset.secureUrl]
        : products
            .map(product => product.imageUrl)
            .filter((value): value is string => Boolean(value))
            .slice(0, 5),
      fields: [
        {
          label: 'Layout',
          value: text(collection.layout)
        },
        {
          label: 'Subtitle',
          value: collection.subtitle ?? '—'
        },
        {
          label: 'Schedule',
          value: `${text(collection.startsAt)} → ${text(collection.endsAt)}`
        },
        {
          label: 'Featured product',
          value: collection.featuredProductId ?? '—'
        }
      ],
      metrics: [
        {
          label: 'Products',
          value: String(products.length)
        },
        {
          label: 'Available',
          value: String(
            products.filter(product => product.available > 0).length
          )
        },
        {
          label: 'Priority',
          value: String(collection.priority)
        }
      ],
      products,
      warnings: [
        ...(products.length === 0
          ? ['The collection does not contain any products.']
          : []),
        ...(!collection.coverMediaAsset
          ? ['The collection has no cover image.']
          : []),
        ...(collection.vendorProfile &&
        (!collection.vendorProfile.active ||
          collection.vendorProfile.status !== 'ACTIVE')
          ? ['The owning vendor is not currently active.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (
    input.targetType === 'CAMPAIGN' ||
    input.targetType === 'EXPERIENCE'
  ) {
    const campaign = await database.storeStudioCampaign.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        vendorProfile: {
          select: {
            name: true,
            status: true,
            active: true
          }
        },
        assets: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!campaign) {
      return {
        ...fallback,
        unsupportedReason: 'The Store Studio campaign no longer exists.'
      };
    }

    const productIds = campaign.assets
      .map(asset => asset.productId)
      .filter((value): value is string => Boolean(value));

    const linkedProducts = productIds.length
      ? await database.product.findMany({
          where: {
            workspaceId: input.workspaceId,
            id: {
              in: productIds
            }
          },
          include: {
            images: {
              orderBy: [
                {
                  primary: 'desc'
                },
                {
                  position: 'asc'
                }
              ],
              take: 1
            },
            variants: {
              where: {
                active: true
              },
              include: {
                inventory: true
              }
            }
          }
        })
      : [];

    const products = linkedProducts.map(product => ({
      id: product.id,
      name: product.name,
      imageUrl: product.images[0]?.url ?? null,
      status: product.status,
      available: availableQuantity(product.variants)
    }));

    return {
      ...fallback,
      title: campaign.title,
      subtitle: `${text(campaign.type)} · ${
        campaign.vendorProfile?.name ?? 'Shelsea workspace'
      }`,
      status: campaign.status,
      href: `/admin/store-studio?campaign=${campaign.id}`,
      images: campaign.assets
        .map(
          asset =>
            asset.coverUrl ??
            asset.posterUrl ??
            asset.mobileMediaUrl ??
            asset.mediaUrl
        )
        .filter(Boolean)
        .slice(0, 8),
      fields: [
        {
          label: 'Placement tier',
          value: text(campaign.placementTier)
        },
        {
          label: 'Schedule',
          value: `${text(campaign.startsAt)} → ${text(campaign.endsAt)}`
        },
        {
          label: 'Active',
          value: campaign.active ? 'Yes' : 'No'
        },
        {
          label: 'Vendor',
          value: campaign.vendorProfile?.name ?? 'Shelsea workspace'
        }
      ],
      metrics: [
        {
          label: 'Assets',
          value: String(campaign.assets.length)
        },
        {
          label: 'Linked products',
          value: String(products.length)
        },
        {
          label: 'Requested priority',
          value: String(campaign.requestedPriority)
        },
        {
          label: 'Admin weight',
          value: String(campaign.adminWeight)
        }
      ],
      products,
      warnings: [
        ...(campaign.assets.length === 0
          ? ['The campaign contains no media assets.']
          : []),
        ...(campaign.type === 'REEL' &&
        !campaign.assets.some(asset => asset.mediaType === 'VIDEO')
          ? ['A Reel campaign requires at least one video asset.']
          : []),
        ...(campaign.vendorProfile &&
        (!campaign.vendorProfile.active ||
          campaign.vendorProfile.status !== 'ACTIVE')
          ? ['The owning vendor is not currently active.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'VENDOR') {
    const vendor = await database.vendorProfile.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        ownerUser: {
          select: {
            name: true,
            email: true
          }
        },
        logoMediaAsset: true,
        _count: {
          select: {
            products: true,
            promotions: true,
            collections: true,
            campaigns: true,
            members: true
          }
        }
      }
    });

    if (!vendor) {
      return {
        ...fallback,
        unsupportedReason: 'The vendor profile no longer exists.'
      };
    }

    return {
      ...fallback,
      title: vendor.name,
      subtitle: `${vendor.ownerUser.name} · ${vendor.ownerUser.email}`,
      status: vendor.status,
      href: `/admin/vendors/${vendor.id}`,
      images: vendor.logoMediaAsset
        ? [vendor.logoMediaAsset.secureUrl]
        : [],
      fields: [
        {
          label: 'Email',
          value: vendor.email ?? '—'
        },
        {
          label: 'Phone',
          value: vendor.phone ?? '—'
        },
        {
          label: 'Active',
          value: vendor.active ? 'Yes' : 'No'
        },
        {
          label: 'Description',
          value: vendor.description ?? '—'
        }
      ],
      metrics: [
        {
          label: 'Products',
          value: String(vendor._count.products)
        },
        {
          label: 'Promotions',
          value: String(vendor._count.promotions)
        },
        {
          label: 'Collections',
          value: String(vendor._count.collections)
        },
        {
          label: 'Campaigns',
          value: String(vendor._count.campaigns)
        },
        {
          label: 'Team',
          value: String(vendor._count.members)
        }
      ],
      products: [],
      warnings: [
        ...(!vendor.logoMediaAsset ? ['The vendor has no logo asset.'] : []),
        ...(!vendor.email && !vendor.phone
          ? ['The vendor has no public contact detail.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'SHOPPING_LIST') {
    const list = await database.shoppingList.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          orderBy: {
            position: 'asc'
          },
          include: {
            product: {
              include: {
                images: {
                  orderBy: [
                    {
                      primary: 'desc'
                    },
                    {
                      position: 'asc'
                    }
                  ],
                  take: 1
                },
                variants: {
                  where: {
                    active: true
                  },
                  include: {
                    inventory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!list) {
      return {
        ...fallback,
        unsupportedReason: 'The Shopping List no longer exists.'
      };
    }

    const products = list.items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      imageUrl: item.product.images[0]?.url ?? null,
      status: item.product.status,
      available: availableQuantity(item.product.variants),
      quantity: item.quantity
    }));

    return {
      ...fallback,
      title: list.name,
      subtitle: `${list.user.name} · ${list.user.email}`,
      status: list.publicationStatus,
      href: `/account/lists/${list.id}`,
      images: products
        .map(product => product.imageUrl)
        .filter((value): value is string => Boolean(value))
        .slice(0, 8),
      fields: [
        {
          label: 'Visibility',
          value: text(list.visibility)
        },
        {
          label: 'List status',
          value: text(list.status)
        },
        {
          label: 'Description',
          value: list.description ?? '—'
        },
        {
          label: 'Submitted',
          value: text(list.publicationSubmittedAt)
        }
      ],
      metrics: [
        {
          label: 'Products',
          value: String(products.length)
        },
        {
          label: 'Total quantity',
          value: String(
            list.items.reduce((total, item) => total + item.quantity, 0)
          )
        },
        {
          label: 'Available',
          value: String(
            products.filter(product => product.available > 0).length
          )
        }
      ],
      products,
      warnings: [
        ...(products.length === 0
          ? ['The Shopping List is empty.']
          : []),
        ...(products.some(product => product.available <= 0)
          ? ['Some Shopping List products are currently unavailable.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'MEDIA') {
    const asset = await database.mediaAsset.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        },
        vendorProfile: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            productImages: true,
            productVariants: true,
            promotionBanners: true,
            collectionCovers: true,
            storeStudioPrimaryAssets: true,
            storeStudioMobileAssets: true,
            storeStudioCoverAssets: true,
            storeStudioPosterAssets: true,
            storefrontHeroMedia: true,
            storefrontHeroPosters: true,
            vendorLogos: true
          }
        }
      }
    });

    if (!asset) {
      return {
        ...fallback,
        unsupportedReason: 'The Media Studio asset no longer exists.'
      };
    }

    const usageCount = Object.values(asset._count).reduce(
      (total, count) => total + count,
      0
    );

    return {
      ...fallback,
      title:
        asset.displayName ??
        asset.originalFilename ??
        asset.publicId,
      subtitle:
        asset.vendorProfile?.name ??
        `${asset.uploadedBy.name} · ${asset.uploadedBy.email}`,
      status: asset.status,
      href: '/admin/media',
      images:
        asset.resourceType === 'IMAGE'
          ? [asset.secureUrl]
          : [],
      fields: [
        {
          label: 'Resource type',
          value: text(asset.resourceType)
        },
        {
          label: 'Format',
          value: asset.format?.toUpperCase() ?? '—'
        },
        {
          label: 'Dimensions',
          value:
            asset.width && asset.height
              ? `${asset.width} × ${asset.height}`
              : '—'
        },
        {
          label: 'Public ID',
          value: asset.publicId
        }
      ],
      metrics: [
        {
          label: 'Uses',
          value: String(usageCount)
        },
        {
          label: 'Bytes',
          value: String(asset.bytes)
        }
      ],
      products: [],
      warnings: [
        ...(usageCount > 0
          ? [
              `This asset is referenced by ${usageCount} managed record${
                usageCount === 1 ? '' : 's'
              }.`
            ]
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'ORDER') {
    const order = await database.order.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: true,
        delivery: {
          select: {
            id: true,
            status: true,
            trackingCode: true
          }
        }
      }
    });

    if (!order) {
      return {
        ...fallback,
        unsupportedReason: 'The Order no longer exists.'
      };
    }

    return {
      ...fallback,
      title: order.orderNumber,
      subtitle: `${order.user.name} · ${order.user.email}`,
      status: order.status,
      href: '/admin/orders',
      images: order.items
        .map(item => item.image)
        .filter((value): value is string => Boolean(value))
        .slice(0, 8),
      fields: [
        {
          label: 'Payment',
          value: text(order.paymentStatus)
        },
        {
          label: 'Total',
          value: money(order.total)
        },
        {
          label: 'Notes',
          value: order.notes ?? '—'
        },
        {
          label: 'Delivery',
          value: order.delivery
            ? `${text(order.delivery.status)} · ${order.delivery.trackingCode}`
            : 'Not created'
        }
      ],
      metrics: [
        {
          label: 'Items',
          value: String(order.items.length)
        },
        {
          label: 'Quantity',
          value: String(
            order.items.reduce((total, item) => total + item.quantity, 0)
          )
        }
      ],
      products: order.items.map(item => ({
        id: item.productId,
        name: item.productName,
        imageUrl: item.image,
        status: order.status,
        available: 0,
        quantity: item.quantity
      })),
      warnings: [],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'DELIVERY') {
    const delivery = await database.delivery.findFirst({
      where: {
        id: input.targetId,
        workspaceId: input.workspaceId
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            items: true
          }
        },
        dispatcher: {
          select: {
            name: true,
            email: true
          }
        },
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!delivery) {
      return {
        ...fallback,
        unsupportedReason: 'The Delivery no longer exists.'
      };
    }

    return {
      ...fallback,
      title: `Delivery ${delivery.trackingCode}`,
      subtitle: `${delivery.order.orderNumber} · ${delivery.order.user.name}`,
      status: delivery.status,
      href: '/admin/deliveries',
      images: delivery.order.items
        .map(item => item.image)
        .filter((value): value is string => Boolean(value))
        .slice(0, 8),
      fields: [
        {
          label: 'Method',
          value: text(delivery.method)
        },
        {
          label: 'Dispatcher',
          value:
            delivery.dispatcher?.name ??
            delivery.dispatcherName ??
            'Unassigned'
        },
        {
          label: 'Tracking',
          value: delivery.trackingEnabled ? 'Enabled' : 'Disabled'
        },
        {
          label: 'Estimated arrival',
          value: text(delivery.estimatedArrival)
        }
      ],
      metrics: [
        {
          label: 'Events',
          value: String(delivery.events.length)
        },
        {
          label: 'Items',
          value: String(delivery.order.items.length)
        }
      ],
      products: delivery.order.items.map(item => ({
        id: item.productId,
        name: item.productName,
        imageUrl: item.image,
        status: delivery.status,
        available: 0,
        quantity: item.quantity
      })),
      warnings: [
        ...(!delivery.dispatcherId && !delivery.dispatcherName
          ? ['No dispatcher or rider is currently assigned.']
          : [])
      ],
      canExecute: true,
      unsupportedReason: null
    };
  }

  if (input.targetType === 'USER') {
    const user = await database.user.findUnique({
      where: {
        id: input.targetId
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountState: true,
        lockedUntil: true,
        restrictionReason: true,
        createdAt: true
      }
    });

    if (!user) {
      return {
        ...fallback,
        unsupportedReason: 'The account no longer exists.'
      };
    }

    return {
      ...fallback,
      title: user.name,
      subtitle: user.email,
      status: user.accountState,
      href: `/admin/accounts/${user.id}`,
      images: [],
      fields: [
        {
          label: 'Locked until',
          value: text(user.lockedUntil)
        },
        {
          label: 'Restriction',
          value: user.restrictionReason ?? '—'
        },
        {
          label: 'Created',
          value: text(user.createdAt)
        }
      ],
      metrics: [],
      products: [],
      warnings: [],
      canExecute: false,
      unsupportedReason:
        'Account state changes remain controlled by Account Management rather than automatic Approval execution.'
    };
  }

  return {
    ...fallback,
    unsupportedReason:
      'This target can be recorded and inspected at a basic level, but it does not yet have a safe automatic execution handler.'
  };
}
