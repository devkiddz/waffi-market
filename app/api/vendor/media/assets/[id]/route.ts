import { NextResponse } from 'next/server';

import { getVendorApiAccess } from '@/features/vendor/auth/vendorAccess';
import { destroyCloudinaryAsset } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

async function resolveVendorAsset(
  id: string,
  workspaceId: string,
  vendorProfileId: string
) {
  return prisma.mediaAsset.findFirst({
    where: {
      id,
      workspaceId,
      vendorProfileId,
      status: 'ACTIVE'
    },
    include: {
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
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getVendorApiAccess(request.headers);

  if (!access) {
    return NextResponse.json(
      { error: 'Vendor authentication required.' },
      { status: 401 }
    );
  }

  if (!access.permissions.has('media:manage')) {
    return NextResponse.json(
      { error: 'Vendor media permission is required.' },
      { status: 403 }
    );
  }

  if (!access.studio.capabilities.media) {
    return NextResponse.json(
      { error: 'Media Studio is not available on this Vendor Studio tier.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const asset = await resolveVendorAsset(
    id,
    access.workspace.id,
    access.vendor.id
  );

  if (!asset) {
    return NextResponse.json({ error: 'Vendor media was not found.' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { displayName?: string; altText?: string }
    | null;
  const displayName = body?.displayName?.trim() || null;
  const altText = body?.altText?.trim() || null;

  if ((displayName?.length ?? 0) > 160 || (altText?.length ?? 0) > 500) {
    return NextResponse.json(
      { error: 'Media name or alternative text is too long.' },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async transaction => {
    const result = await transaction.mediaAsset.update({
      where: { id: asset.id },
      data: { displayName, altText }
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: 'VENDOR_MEDIA_METADATA_UPDATED',
        targetType: 'MEDIA',
        targetId: asset.id,
        summary: `${access.vendor.name} updated ${displayName ?? asset.publicId}.`,
        metadata: {
          vendorProfileId: access.vendor.id,
          vendorStudioTier: access.studio.tier
        }
      }
    });

    return result;
  });

  return NextResponse.json({ asset: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getVendorApiAccess(request.headers);

  if (!access) {
    return NextResponse.json(
      { error: 'Vendor authentication required.' },
      { status: 401 }
    );
  }

  if (!access.permissions.has('media:manage')) {
    return NextResponse.json(
      { error: 'Vendor media permission is required.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const asset = await resolveVendorAsset(
    id,
    access.workspace.id,
    access.vendor.id
  );

  if (!asset) {
    return NextResponse.json({ error: 'Vendor media was not found.' }, { status: 404 });
  }

  const usageCount = Object.values(asset._count).reduce(
    (sum, count) => sum + count,
    0
  );

  if (usageCount) {
    return NextResponse.json(
      {
        error: `This asset is still used in ${usageCount} record${
          usageCount === 1 ? '' : 's'
        }.`
      },
      { status: 409 }
    );
  }

  await destroyCloudinaryAsset({
    publicId: asset.publicId,
    resourceType:
      asset.resourceType === 'VIDEO'
        ? 'video'
        : asset.resourceType === 'RAW'
          ? 'raw'
          : 'image'
  });

  await prisma.$transaction([
    prisma.mediaAsset.update({
      where: { id },
      data: { status: 'DELETED' }
    }),
    prisma.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: 'VENDOR_MEDIA_DELETED',
        targetType: 'MEDIA',
        targetId: id,
        summary: `${access.vendor.name} removed ${asset.displayName ?? asset.publicId}.`,
        metadata: {
          vendorProfileId: access.vendor.id,
          vendorStudioTier: access.studio.tier
        }
      }
    })
  ]);

  return NextResponse.json({ success: true });
}
