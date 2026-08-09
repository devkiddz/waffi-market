import { AdminPage, AdminPageHeader } from '@/features/admin/components';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import {
  createVendorProduct,
  VendorProductEditor
} from '@/features/vendor/products';
import { prisma } from '@/lib/prisma';

export default async function NewVendorProductPage() {
  const access = await getVendorAccess();

  if (!access.permissions.has('product:manage')) {
    throw new Error('Product management permission is required.');
  }

  if (!access.studio.capabilities.products) {
    throw new Error(
      `Product Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  const productLimit = access.studio.limits.products;

  if (productLimit !== null) {
    const currentProductCount = await prisma.product.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      }
    });

    if (currentProductCount >= productLimit) {
      throw new Error(
        `This Vendor Studio tier allows up to ${productLimit} product${productLimit === 1 ? '' : 's'}.`
      );
    }
  }

  const [categories, brands, media] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      include: {
        subcategories: {
          where: { active: true },
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    }),
    prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    }),
    prisma.mediaAsset.findMany({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE',
        resourceType: 'IMAGE'
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
  ]);

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`Product Studio · ${access.studio.tier}`}
          title="Create vendor product"
          description="Build the complete product and submit it for Waffi Market approval."
          backHref="/vendor/products"
          backLabel="Vendor products"
        />
        <VendorProductEditor
          action={createVendorProduct}
          media={media.map(item => ({
            id: item.id,
            secureUrl: item.secureUrl,
            displayName: item.displayName,
            originalFilename: item.originalFilename
          }))}
          taxonomy={{
            categories: categories.map(item => ({
              id: item.id,
              label: item.label,
              subcategories: item.subcategories.map(sub => ({
                id: sub.id,
                label: sub.label
              }))
            })),
            brands: brands.map(item => ({
              id: item.id,
              name: item.name
            }))
          }}
        />
      </div>
    </AdminPage>
  );
}
