import { notFound } from 'next/navigation';

/* SHELSEA_ADMIN_EDIT_VARIANT_COLOR_V1 */

import AdminProductEditor from '@/features/admin/products/AdminProductEditor';
import { getAdminAccess } from '@/features/admin/auth/adminPermissions';
import { prisma } from '@/lib/prisma';

export default async function EditAdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  const { id } = await params;

  const [product, categories, brands, media, vendors] = await Promise.all([
    prisma.product.findFirst({
      where: { id, workspaceId: access.membership.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        subcategoryId: true,
        brandId: true,
        vendorProfileId: true,
        shortDescription: true,
        longDescription: true,
        estimatedDelivery: true,
        tags: true,
        active: true,
        featured: true,
        isNew: true,
        status: true,
        discountPercentage: true,
        images: {
          orderBy: { position: 'asc' },
          select: { mediaAssetId: true }
        },
        variants: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            label: true,
            color: true,
            colorHex: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            mediaAssetId: true,
            active: true,
            inventory: { select: { quantity: true, reserved: true, reorderLevel: true } }
          }
        }
      }
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        label: true,
        subcategories: {
          where: { active: true },
          orderBy: { position: 'asc' },
          select: { id: true, label: true }
        }
      }
    }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.mediaAsset.findMany({
      where: { workspaceId: access.membership.workspaceId, status: 'ACTIVE', resourceType: 'IMAGE' },
      orderBy: { createdAt: 'desc' },
      take: 120,
      select: { id: true, secureUrl: true, displayName: true, originalFilename: true }
    }),
    access.membership.workspace.commerceMode === 'MULTI_VENDOR'
      ? prisma.vendorProfile.findMany({
          where: { workspaceId: access.membership.workspaceId, status: 'ACTIVE', active: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true }
        })
      : Promise.resolve([])
  ]);

  if (!product) notFound();

  return (
    <AdminProductEditor
      product={{
        ...product,
        mediaAssetIds: product.images.map(image => image.mediaAssetId).filter((value): value is string => Boolean(value)),
        existingImageCount: product.images.length,
        variants: product.variants.map(variant => ({
          id: variant.id,
          label: variant.label,
          color: variant.color ?? '',
          colorHex: variant.colorHex ?? '',
          sku: variant.sku ?? '',
          price: Number(variant.price),
          compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
          mediaAssetId: variant.mediaAssetId,
          quantity: variant.inventory?.quantity ?? 0,
          reserved: variant.inventory?.reserved ?? 0,
          reorderLevel: variant.inventory?.reorderLevel ?? 5,
          active: variant.active
        }))
      }}
      taxonomy={{ categories, brands, vendors }}
      media={media}
      canManage={access.permissions.has('product:update')}
      canPublish={access.permissions.has('approval:review')}
      multivendorEnabled={access.membership.workspace.commerceMode === 'MULTI_VENDOR'}
    />
  );
}
