'use server';

import { revalidatePath } from 'next/cache';

import {
  createOrResubmitApprovalRequest,
  synchronizeDirectApprovalDecision
} from '@/features/admin/approvals/approvalRequestRepository';
import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';
import { prisma } from '@/lib/prisma';

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function validLogo(
  workspaceId: string,
  id: string | null,
  vendorProfileId?: string
) {
  if (!id) return null;
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id,
      workspaceId,
      status: 'ACTIVE',
      resourceType: 'IMAGE',
      ...(vendorProfileId
        ? { OR: [{ vendorProfileId: null }, { vendorProfileId }] }
        : { vendorProfileId: null })
    },
    select: { id: true }
  });
  if (!asset) throw new Error('The selected vendor logo is unavailable for this vendor.');
  return asset.id;
}

export async function createVendor(formData: FormData): Promise<void> {
  const access = await requireAdminPermission('vendor:manage');
  if (access.membership.workspace.commerceMode !== 'MULTI_VENDOR') throw new Error('Developer Admin must activate Multi Vendor mode before vendors can be created.');
  const name = text(formData, 'name');
  const slug = slugify(text(formData, 'slug') || name);
  const ownerEmail = text(formData, 'ownerEmail').toLowerCase();
  const logoMediaAssetId = await validLogo(
    access.membership.workspaceId,
    text(formData, 'logoMediaAssetId') || null
  );
  if (!name || !slug || !ownerEmail) throw new Error('Vendor name, slug and owner email are required.');

  const [owner, conflict] = await Promise.all([
    prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true, name: true, isGhostDeveloper: true, accountState: true } }),
    prisma.vendorProfile.findFirst({ where: { workspaceId: access.membership.workspaceId, slug }, select: { id: true } })
  ]);
  if (!owner || owner.isGhostDeveloper || owner.accountState !== 'ACTIVE') throw new Error('The vendor owner must have an active normal Shelsea account.');
  if (conflict) throw new Error('A vendor with this slug already exists.');

  const canApprove = access.permissions.has('vendor:approve');
  await prisma.$transaction(async tx => {
    const created = await tx.vendorProfile.create({
      data: {
        workspaceId: access.membership.workspaceId,
        ownerUserId: owner.id,
        name,
        slug,
        description: text(formData, 'description') || null,
        email: text(formData, 'email') || ownerEmail,
        phone: text(formData, 'phone') || null,
        logoMediaAssetId,
        status: canApprove ? 'ACTIVE' : 'PENDING',
        active: canApprove,
        approvedAt: canApprove ? new Date() : null
      },
      select: { id: true }
    });
    await tx.vendorMembership.create({ data: { vendorId: created.id, userId: owner.id, role: 'OWNER', active: true } });
    if (!canApprove) {
      await createOrResubmitApprovalRequest(tx, {
        workspaceId: access.membership.workspaceId,
        requestedById: access.session.user.id,
        source: 'ADMIN',
        action: 'PUBLISH_LIVE',
        targetType: 'VENDOR',
        targetId: created.id,
        reason: `Approve vendor ${name} for workspace commerce.`
      });
    }
    await tx.adminAuditEvent.create({ data: { workspaceId: access.membership.workspaceId, actorId: access.session.user.id, action: 'VENDOR_CREATED', targetType: 'VENDOR', targetId: created.id, summary: `${name} was created with ${owner.name} as owner.` } });
    return created;
  });

  revalidatePath('/admin/vendors');
  revalidatePath('/admin/approvals');
  revalidatePath('/shops');
}

export async function updateVendorProfile(vendorId: string, formData: FormData) {
  const access = await requireAdminPermission('vendor:manage');
  const existing = await prisma.vendorProfile.findFirst({ where: { id: vendorId, workspaceId: access.membership.workspaceId }, select: { id: true, slug: true } });
  if (!existing) throw new Error('The vendor profile was not found.');
  const name = text(formData, 'name');
  const slug = slugify(text(formData, 'slug') || name);
  const logoMediaAssetId = await validLogo(
    access.membership.workspaceId,
    text(formData, 'logoMediaAssetId') || null,
    vendorId
  );
  if (!name || !slug) throw new Error('Vendor name and slug are required.');
  const conflict = await prisma.vendorProfile.findFirst({ where: { workspaceId: access.membership.workspaceId, slug, id: { not: vendorId } }, select: { id: true } });
  if (conflict) throw new Error('Another vendor already uses this slug.');
  await prisma.vendorProfile.update({ where: { id: vendorId }, data: { name, slug, description: text(formData, 'description') || null, email: text(formData, 'email') || null, phone: text(formData, 'phone') || null, logoMediaAssetId } });
  await prisma.adminAuditEvent.create({ data: { workspaceId: access.membership.workspaceId, actorId: access.session.user.id, action: 'VENDOR_UPDATED', targetType: 'VENDOR', targetId: vendorId, summary: `${name} vendor profile was updated.` } });
  revalidatePath('/admin/vendors');
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath('/shops');
  revalidatePath(`/shops/${existing.slug}`);
  revalidatePath(`/shops/${slug}`);
}

export async function adminAddVendorMember(vendorId: string, formData: FormData) {
  const access = await requireAdminPermission('vendor:manage');
  const vendor = await prisma.vendorProfile.findFirst({ where: { id: vendorId, workspaceId: access.membership.workspaceId }, select: { id: true, name: true } });
  if (!vendor) throw new Error('The vendor profile was not found.');
  const email = text(formData, 'email').toLowerCase();
  const requested = text(formData, 'role');
  const role = (['MANAGER', 'EDITOR', 'ANALYST'].includes(requested) ? requested : 'EDITOR') as 'MANAGER' | 'EDITOR' | 'ANALYST';
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, accountState: true, isGhostDeveloper: true } });
  if (!user || user.accountState !== 'ACTIVE' || user.isGhostDeveloper) throw new Error('The team member must have an active normal Shelsea account.');
  await prisma.vendorMembership.upsert({ where: { vendorId_userId: { vendorId, userId: user.id } }, update: { role, active: true }, create: { vendorId, userId: user.id, role, active: true } });
  await prisma.adminAuditEvent.create({ data: { workspaceId: access.membership.workspaceId, actorId: access.session.user.id, action: 'VENDOR_TEAM_MEMBER_ADDED', targetType: 'VENDOR', targetId: vendorId, summary: `${user.name} joined ${vendor.name} as ${role}.` } });
  revalidatePath(`/admin/vendors/${vendorId}`);
}

export async function adminUpdateVendorMember(vendorId: string, formData: FormData) {
  const access = await requireAdminPermission('vendor:manage');
  const membershipId = text(formData, 'membershipId');
  const requested = text(formData, 'role');
  const active = text(formData, 'active') === 'true';
  const role = (['MANAGER', 'EDITOR', 'ANALYST'].includes(requested) ? requested : 'EDITOR') as 'MANAGER' | 'EDITOR' | 'ANALYST';
  const membership = await prisma.vendorMembership.findFirst({
    where: {
      id: membershipId,
      vendorId,
      role: { not: 'OWNER' },
      vendor: { workspaceId: access.membership.workspaceId }
    },
    select: { id: true, user: { select: { name: true } }, vendor: { select: { name: true } } }
  });
  if (!membership) throw new Error('The vendor membership is unavailable or protected.');
  await prisma.$transaction([
    prisma.vendorMembership.update({ where: { id: membership.id }, data: { role, active } }),
    prisma.adminAuditEvent.create({
      data: {
        workspaceId: access.membership.workspaceId,
        actorId: access.session.user.id,
        action: active ? 'VENDOR_TEAM_MEMBER_UPDATED' : 'VENDOR_TEAM_MEMBER_DISABLED',
        targetType: 'VENDOR',
        targetId: vendorId,
        summary: `${membership.user.name} was ${active ? `updated to ${role}` : 'disabled'} in ${membership.vendor.name}.`
      }
    })
  ]);
  revalidatePath(`/admin/vendors/${vendorId}`);
}

export async function setVendorStatus(formData: FormData) {
  const access = await requireAdminPermission('vendor:approve');
  const id = text(formData, 'id');
  const status = text(formData, 'status');
  if (!id || !['ACTIVE', 'SUSPENDED', 'REJECTED', 'ARCHIVED'].includes(status)) throw new Error('A valid vendor decision is required.');
  if (status === 'ACTIVE' && access.membership.workspace.commerceMode !== 'MULTI_VENDOR') throw new Error('Multi Vendor mode must be active before a vendor can be approved.');
  await prisma.$transaction(async transaction => {
    const updated = await transaction.vendorProfile.update({
      where: { id, workspaceId: access.membership.workspaceId },
      data: {
        status: status as 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'ARCHIVED',
        active: status === 'ACTIVE',
        approvedAt: status === 'ACTIVE' ? new Date() : undefined,
        suspendedAt: status === 'SUSPENDED' ? new Date() : null
      },
      select: { name: true }
    });

    await synchronizeDirectApprovalDecision(transaction, {
      workspaceId: access.membership.workspaceId,
      actorId: access.session.user.id,
      targetType: 'VENDOR',
      targetId: id,
      status:
        status === 'ACTIVE'
          ? 'EXECUTED'
          : status === 'SUSPENDED'
            ? 'PAUSED'
            : status === 'REJECTED'
              ? 'REJECTED'
              : 'CANCELLED',
      note: `Vendor status changed directly to ${status}.`,
      resultSnapshot: { status, active: status === 'ACTIVE' }
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.membership.workspaceId,
        actorId: access.session.user.id,
        action: `VENDOR_${status}`,
        targetType: 'VENDOR',
        targetId: id,
        summary: `${updated.name} moved to ${status}.`
      }
    });

    return updated;
  });
  revalidatePath('/admin/vendors');
  revalidatePath(`/admin/vendors/${id}`);
  revalidatePath('/store');
  revalidatePath('/shops');
}
