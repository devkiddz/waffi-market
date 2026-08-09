import { NextResponse } from 'next/server';

import { getVendorApiAccess } from '@/features/vendor/auth/vendorAccess';
import { createCloudinaryUploadSignature } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

  const mediaLimit = access.studio.limits.mediaAssets;

  if (mediaLimit !== null) {
    const currentMediaCount = await prisma.mediaAsset.count({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE'
      }
    });

    if (currentMediaCount >= mediaLimit) {
      return NextResponse.json(
        { error: `This Vendor Studio tier allows up to ${mediaLimit} media assets.` },
        { status: 403 }
      );
    }
  }

  const body = (await request.json().catch(() => null)) as
    | {
        purpose?: string;
        resourceType?: 'IMAGE' | 'VIDEO';
      }
    | null;

  if (!body?.resourceType) {
    return NextResponse.json(
      { error: 'Media resource type is required.' },
      { status: 400 }
    );
  }

  if (
    body.resourceType === 'VIDEO' &&
    !access.studio.capabilities.video
  ) {
    return NextResponse.json(
      { error: 'Video uploads are not available on this Vendor Studio tier.' },
      { status: 403 }
    );
  }

  if (body.purpose === 'reels' && body.resourceType !== 'VIDEO') {
    return NextResponse.json(
      { error: 'Reel uploads must use video media.' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(
      createCloudinaryUploadSignature({
        workspaceId: access.workspace.id,
        workspaceFolderPrefix: access.workspace.mediaFolderPrefix,
        ownerPath: `vendors/${access.vendor.slug}`,
        purpose: body?.purpose ?? 'general'
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to prepare upload.'
      },
      { status: 400 }
    );
  }
}
