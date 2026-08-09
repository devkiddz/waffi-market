import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveCommerceCapabilities } from '@/features/commerce-mode';
import { resolveVendorStudioEntitlements } from '@/features/vendor/entitlements';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type VendorPermission =
  | 'vendor:view'
  | 'media:view'
  | 'media:manage'
  | 'product:view'
  | 'product:manage'
  | 'collection:view'
  | 'collection:manage'
  | 'promotion:view'
  | 'promotion:manage'
  | 'campaign:view'
  | 'campaign:manage'
  | 'submission:view'
  | 'analytics:view'
  | 'communication:view'
  | 'communication:reply'
  | 'team:manage';

const permissionsByRole = {
  OWNER: ['vendor:view','media:view','media:manage','product:view','product:manage','collection:view','collection:manage','promotion:view','promotion:manage','campaign:view','campaign:manage','submission:view','analytics:view','communication:view','communication:reply','team:manage'],
  MANAGER: ['vendor:view','media:view','media:manage','product:view','product:manage','collection:view','collection:manage','promotion:view','promotion:manage','campaign:view','campaign:manage','submission:view','analytics:view','communication:view','communication:reply'],
  EDITOR: ['vendor:view','media:view','media:manage','product:view','product:manage','collection:view','collection:manage','promotion:view','promotion:manage','campaign:view','campaign:manage','submission:view','communication:view','communication:reply'],
  ANALYST: ['vendor:view','media:view','product:view','collection:view','promotion:view','campaign:view','submission:view','analytics:view']
} as const satisfies Record<string, readonly VendorPermission[]>;

async function resolveVendorAccess(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  if (!session) return null;

  const memberships = await prisma.vendorMembership.findMany({
    where: {
      userId: session.user.id,
      active: true,
      vendor: {
        active: true,
        status: 'ACTIVE',
        workspace: { active: true }
      }
    },
    include: { vendor: { include: { workspace: true } } },
    orderBy: { createdAt: 'asc' },
    take: 2
  });

  if (memberships.length !== 1) {
    return null;
  }

  const membership = memberships[0];

  if (!membership) {
    return null;
  }

  const capabilities = resolveCommerceCapabilities(
    membership.vendor.workspace.commerceMode,
    {
      vendorApplicationsOpen:
        membership.vendor.workspace.vendorApplicationsOpen
    }
  );

  if (!capabilities.vendorStudioAllowed) {
    return null;
  }

  const studio = await resolveVendorStudioEntitlements(
    membership.vendor.id
  );

  if (!studio.active) {
    return null;
  }

  return {
    session,
    membership,
    vendor: membership.vendor,
    workspace: membership.vendor.workspace,
    capabilities,
    studio,
    permissions: new Set<VendorPermission>(permissionsByRole[membership.role])
  };
}

export async function getVendorAccess() {
  const access = await resolveVendorAccess(await headers());
  if (!access) redirect('/account');
  return access;
}

export async function getVendorApiAccess(requestHeaders: Headers) {
  return resolveVendorAccess(requestHeaders);
}

export async function requireVendorPermission(permission: VendorPermission) {
  const access = await getVendorAccess();
  if (!access.permissions.has(permission)) throw new Error(`Missing vendor permission: ${permission}`);
  return access;
}
