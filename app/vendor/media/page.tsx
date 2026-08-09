import { GalleryVerticalEnd, ImageIcon, Video } from 'lucide-react';

import {
  AdminMetric,
  AdminPage,
  AdminPageHeader
} from '@/features/admin/components';
import { MediaStudioDashboard } from '@/features/admin/media';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import { cloudinaryIsConfigured } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

function quotaValue(current: number, limit: number | null): string {
  return limit === null ? `${current} · Unlimited` : `${current} / ${limit}`;
}

export default async function VendorMediaPage() {
  const access = await getVendorAccess();

  if (!access.permissions.has('media:view')) {
    throw new Error('Media access is required.');
  }

  if (!access.studio.capabilities.media) {
    throw new Error(
      `Media Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  const [assets, totalAssets, resourceCounts] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE'
      },
      include: {
        uploadedBy: { select: { name: true } },
        vendorProfile: { select: { name: true } },
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
            vendorLogos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 250
    }),
    prisma.mediaAsset.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE'
      }
    }),
    prisma.mediaAsset.groupBy({
      by: ['resourceType'],
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE'
      },
      _count: { _all: true }
    })
  ]);

  const mapped = assets.map(asset => ({
    ...asset,
    createdAt: asset.createdAt.toISOString(),
    usageCount: Object.values(asset._count).reduce(
      (sum, count) => sum + count,
      0
    )
  }));
  const imageCount =
    resourceCounts.find(item => item.resourceType === 'IMAGE')?._count._all ?? 0;
  const videoCount =
    resourceCounts.find(item => item.resourceType === 'VIDEO')?._count._all ?? 0;
  const limit = access.studio.limits.mediaAssets;
  const hasCapacity = limit === null || totalAssets < limit;
  const canManage = access.permissions.has('media:manage');

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`${access.vendor.name} · ${access.studio.tier} Studio`}
          title="Vendor Media Studio"
          description={
            access.studio.capabilities.video
              ? 'Upload and reuse vendor-owned images and videos across your available Waffi Market Studios.'
              : 'Upload and reuse vendor-owned images across your available Waffi Market Studios. Video is not included in this tier.'
          }
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetric
            icon={GalleryVerticalEnd}
            label="Assets"
            value={quotaValue(totalAssets, limit)}
          />
          <AdminMetric
            icon={ImageIcon}
            label="Images"
            value={imageCount}
          />
          <AdminMetric
            icon={Video}
            label="Videos"
            value={videoCount}
          />
        </section>

        <MediaStudioDashboard
          assets={mapped}
          canUpload={canManage && hasCapacity}
          canDelete={canManage}
          configured={cloudinaryIsConfigured()}
          apiBasePath="/api/vendor/media"
          uploadAccept={
            access.studio.capabilities.video ? 'image-and-video' : 'image'
          }
        />
      </div>
    </AdminPage>
  );
}
