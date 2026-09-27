'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import { prisma } from '@/lib/prisma';

function text(data: FormData, key: string) {
  return String(data.get(key) ?? '').trim();
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function updateWorkspaceSettings(formData: FormData) {
  const access = await requireAdminPermission('settings:manage');
  const name = text(formData, 'name') || access.membership.workspace.name;
  const currency = (text(formData, 'currency') || 'NGN').toUpperCase();
  const timezone = text(formData, 'timezone') || 'Africa/Lagos';
  const requestedLowStock = Number.parseInt(
    text(formData, 'defaultLowStockLevel'),
    10
  );
  const defaultLowStockLevel = Number.isFinite(requestedLowStock)
    ? Math.min(100_000, Math.max(0, requestedLowStock))
    : 5;
  const mediaFolderPrefix = text(formData, 'mediaFolderPrefix') || null;
  const vendorApplicationsOpen =
    formData.get('vendorApplicationsOpen') === 'on';

  if (name.length > 120) {
    throw new Error('Workspace name cannot exceed 120 characters.');
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Currency must be a valid three-letter ISO code.');
  }

  if (!validTimezone(timezone)) {
    throw new Error('Timezone must be a valid IANA timezone, such as Africa/Lagos.');
  }

  if (
    mediaFolderPrefix &&
    (!/^[a-zA-Z0-9/_-]+$/.test(mediaFolderPrefix) ||
      mediaFolderPrefix.length > 120)
  ) {
    throw new Error(
      'Cloudinary folder prefix may only contain letters, numbers, slashes, dashes and underscores.'
    );
  }

  if (
    vendorApplicationsOpen &&
    access.membership.workspace.commerceMode !== 'MULTI_VENDOR'
  ) {
    throw new Error('Vendor applications cannot open in Single Merchant mode.');
  }

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: access.membership.workspaceId },
      data: {
        name,
        currency,
        timezone,
        defaultLowStockLevel,
        mediaFolderPrefix,
        vendorApplicationsOpen
      }
    }),
    prisma.adminAuditEvent.create({
      data: {
        workspaceId: access.membership.workspaceId,
        actorId: access.session.user.id,
        action: 'WORKSPACE_SETTINGS_UPDATED',
        targetType: 'WORKSPACE',
        targetId: access.membership.workspaceId,
        summary: 'Workspace commerce settings were updated.',
        metadata: {
          currency,
          timezone,
          defaultLowStockLevel,
          vendorApplicationsOpen
        }
      }
    })
  ]);

  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  revalidatePath('/vendor');
  revalidatePath('/store');
  revalidatePath('/vendors');
}
