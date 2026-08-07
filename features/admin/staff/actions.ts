'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAdminPermission, roleForStaffLevel } from '@/features/admin/auth/adminPermissions';

export async function assignStaffLevel(formData: FormData) {
  const access = await requireAdminPermission('staff:assign');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const level = String(formData.get('level') ?? '') as 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  const title = String(formData.get('title') ?? '').trim();
  const department = String(formData.get('department') ?? '').trim();
  if (!email || !['LEVEL_1', 'LEVEL_2', 'LEVEL_3'].includes(level)) throw new Error('A valid user email and staff level are required.');

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, isGhostDeveloper: true } });
  if (!user) throw new Error('The user must create an Shelsea account before staff access can be assigned.');
  if (user.isGhostDeveloper && user.id !== access.session.user.id) throw new Error('This protected account is not available.');

  const role = roleForStaffLevel(level);
  await prisma.$transaction(async transaction => {
    await transaction.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: access.membership.workspaceId, userId: user.id } },
      update: { role, active: true },
      create: { workspaceId: access.membership.workspaceId, userId: user.id, role, active: true }
    });
    await transaction.staffProfile.upsert({
      where: { userId: user.id },
      update: { workspaceId: access.membership.workspaceId, level, title: title || null, department: department || null, active: true, invitedById: access.session.user.id },
      create: { userId: user.id, workspaceId: access.membership.workspaceId, level, employeeCode: `AJ-${randomUUID().slice(0, 8).toUpperCase()}`, title: title || null, department: department || null, invitedById: access.session.user.id }
    });
    await transaction.adminAuditEvent.create({ data: { workspaceId: access.membership.workspaceId, actorId: access.session.user.id, action: 'STAFF_LEVEL_ASSIGNED', targetType: 'STAFF', targetId: user.id, summary: `${user.name} assigned ${level}`, metadata: { role, email } } });
  });

  revalidatePath('/admin');
  revalidatePath('/admin/staff');
}
