'use server';

import { revalidatePath } from 'next/cache';

import { requireVendorPermission } from '@/features/vendor/auth/vendorAccess';
import {
  assertVendorStudioQuotaAvailable,
  lockVendorStudioMember,
  lockVendorStudioQuota
} from '@/features/vendor/entitlements';
import { prisma } from '@/lib/prisma';

const text = (data: FormData, key: string) =>
  String(data.get(key) ?? '').trim();

function anotherVendorMessage() {
  return (
    'This account already belongs to another active vendor. ' +
    'Vendor switching is not available yet, so the membership was not changed.'
  );
}

export async function addVendorTeamMember(formData: FormData) {
  const access = await requireVendorPermission('team:manage');
  const email = text(formData, 'email').toLowerCase();
  const requested = text(formData, 'role');
  const role = (
    ['MANAGER', 'EDITOR', 'ANALYST'].includes(requested)
      ? requested
      : 'EDITOR'
  ) as 'MANAGER' | 'EDITOR' | 'ANALYST';

  if (!email) {
    throw new Error('A team member email is required.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      isGhostDeveloper: true,
      accountState: true
    }
  });

  if (!user || user.isGhostDeveloper || user.accountState !== 'ACTIVE') {
    throw new Error(
      'The team member must have an active normal Waffi Market account.'
    );
  }

  const teamLimit = access.studio.limits.teamMembers;

  await prisma.$transaction(async transaction => {
    // Always use the same lock order for Team mutations: vendor, then user.
    await lockVendorStudioQuota(transaction, access.vendor.id);
    await lockVendorStudioMember(transaction, user.id);

    const existing = await transaction.vendorMembership.findUnique({
      where: {
        vendorId_userId: {
          vendorId: access.vendor.id,
          userId: user.id
        }
      },
      select: {
        id: true,
        active: true,
        role: true
      }
    });

    if (existing?.role === 'OWNER') {
      throw new Error('The vendor owner membership is protected.');
    }

    const otherActiveMembership =
      await transaction.vendorMembership.findFirst({
        where: {
          userId: user.id,
          active: true,
          vendorId: { not: access.vendor.id }
        },
        select: { id: true }
      });

    if (otherActiveMembership) {
      throw new Error(anotherVendorMessage());
    }

    if (!existing?.active && teamLimit !== null) {
      const activeMembers = await transaction.vendorMembership.count({
        where: {
          vendorId: access.vendor.id,
          active: true
        }
      });

      assertVendorStudioQuotaAvailable({
        current: activeMembers,
        limit: teamLimit,
        message: `This Vendor Studio tier allows up to ${teamLimit} active team member${teamLimit === 1 ? '' : 's'}, including the owner.`
      });
    }

    await transaction.vendorMembership.upsert({
      where: {
        vendorId_userId: {
          vendorId: access.vendor.id,
          userId: user.id
        }
      },
      update: {
        role,
        active: true
      },
      create: {
        vendorId: access.vendor.id,
        userId: user.id,
        role,
        active: true
      }
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: 'VENDOR_TEAM_MEMBER_ADDED',
        targetType: 'VENDOR',
        targetId: access.vendor.id,
        summary: `${user.name} joined ${access.vendor.name} as ${role}.`,
        metadata: {
          userId: user.id,
          role,
          vendorStudioTier: access.studio.tier
        }
      }
    });
  });

  revalidatePath('/vendor/team');
  revalidatePath('/admin/vendors');
}

export async function updateVendorTeamMember(formData: FormData) {
  const access = await requireVendorPermission('team:manage');
  const membershipId = text(formData, 'membershipId');
  const requested = text(formData, 'role');
  const active = text(formData, 'active') === 'true';
  const role = (
    ['MANAGER', 'EDITOR', 'ANALYST'].includes(requested)
      ? requested
      : 'EDITOR'
  ) as 'MANAGER' | 'EDITOR' | 'ANALYST';
  const teamLimit = access.studio.limits.teamMembers;

  await prisma.$transaction(async transaction => {
    // Team writes serialize per vendor first, then per affected user.
    await lockVendorStudioQuota(transaction, access.vendor.id);

    const membership = await transaction.vendorMembership.findFirst({
      where: {
        id: membershipId,
        vendorId: access.vendor.id,
        role: { not: 'OWNER' }
      },
      select: {
        id: true,
        userId: true,
        active: true,
        role: true
      }
    });

    if (!membership) {
      throw new Error('The team membership is unavailable or protected.');
    }

    await lockVendorStudioMember(transaction, membership.userId);

    if (active) {
      const otherActiveMembership =
        await transaction.vendorMembership.findFirst({
          where: {
            userId: membership.userId,
            active: true,
            vendorId: { not: access.vendor.id }
          },
          select: { id: true }
        });

      if (otherActiveMembership) {
        throw new Error(anotherVendorMessage());
      }
    }

    if (active && !membership.active && teamLimit !== null) {
      const activeMembers = await transaction.vendorMembership.count({
        where: {
          vendorId: access.vendor.id,
          active: true
        }
      });

      assertVendorStudioQuotaAvailable({
        current: activeMembers,
        limit: teamLimit,
        message: `This Vendor Studio tier allows up to ${teamLimit} active team member${teamLimit === 1 ? '' : 's'}, including the owner.`
      });
    }

    await transaction.vendorMembership.update({
      where: { id: membership.id },
      data: { role, active }
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.workspace.id,
        actorId: access.session.user.id,
        action: 'VENDOR_TEAM_MEMBER_UPDATED',
        targetType: 'VENDOR',
        targetId: access.vendor.id,
        summary: `${access.vendor.name} updated a vendor team membership.`,
        metadata: {
          userId: membership.userId,
          previousRole: membership.role,
          nextRole: role,
          previousActive: membership.active,
          nextActive: active,
          vendorStudioTier: access.studio.tier
        }
      }
    });
  });

  revalidatePath('/vendor/team');
  revalidatePath('/admin/vendors');
}
