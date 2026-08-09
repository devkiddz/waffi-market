import {
  ShieldCheck,
  UserPlus,
  UsersRound
} from 'lucide-react';

import {
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminFieldClass
} from '@/features/admin/components';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import {
  addVendorTeamMember,
  updateVendorTeamMember
} from '@/features/vendor/team';
import { prisma } from '@/lib/prisma';

function quotaValue(current: number, limit: number | null): string {
  return limit === null ? `${current} · Unlimited` : `${current} / ${limit}`;
}

export default async function VendorTeamPage() {
  const access = await getVendorAccess();

  if (!access.permissions.has('vendor:view')) {
    throw new Error('Vendor access is required.');
  }

  const members = await prisma.vendorMembership.findMany({
    where: { vendorId: access.vendor.id },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
  });

  const activeMembers = members.filter(item => item.active).length;
  const teamLimit = access.studio.limits.teamMembers;
  const hasTeamCapacity =
    teamLimit === null || activeMembers < teamLimit;

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`${access.vendor.name} · ${access.studio.tier} Studio`}
          title="Team Management"
          description="Vendor members inherit vendor-scoped permissions only. The Studio seat limit includes the owner."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetric
            icon={UsersRound}
            label="Active seats"
            value={quotaValue(activeMembers, teamLimit)}
          />
          <AdminMetric
            icon={ShieldCheck}
            label="Active"
            value={activeMembers}
          />
          <AdminMetric
            icon={UserPlus}
            label="Editors and managers"
            value={
              members.filter(
                item =>
                  item.active &&
                  ['MANAGER', 'EDITOR'].includes(item.role)
              ).length
            }
          />
        </section>

        {access.permissions.has('team:manage') && hasTeamCapacity ? (
          <AdminPanel
            title="Add team member"
            description="The person must already have an active Waffi Market account.">
            <form
              action={addVendorTeamMember}
              className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <input
                name="email"
                type="email"
                required
                placeholder="member@example.com"
                className={adminFieldClass}
              />
              <select name="role" className={adminFieldClass}>
                <option value="EDITOR">Editor</option>
                <option value="MANAGER">Manager</option>
                <option value="ANALYST">Analyst</option>
              </select>
              <button className="h-11 rounded-full bg-foreground px-5 text-xs font-bold text-background">
                Add member
              </button>
            </form>
          </AdminPanel>
        ) : null}

        <AdminPanel title="Current team">
          <div className="space-y-3">
            {members.map(member => (
              <article
                key={member.id}
                className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/55 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">
                    {member.user.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>

                {member.role === 'OWNER' ? (
                  <span className="rounded-full bg-primary/10 px-3 py-2 text-[9px] font-black text-primary">
                    OWNER
                  </span>
                ) : access.permissions.has('team:manage') ? (
                  <form
                    action={updateVendorTeamMember}
                    className="flex flex-wrap items-center gap-2">
                    <input
                      type="hidden"
                      name="membershipId"
                      value={member.id}
                    />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="h-10 rounded-full border border-border bg-background px-3 text-[10px] font-bold">
                      <option value="EDITOR">Editor</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ANALYST">Analyst</option>
                    </select>
                    <button
                      name="active"
                      value={member.active ? 'false' : 'true'}
                      className="h-10 rounded-full border border-border px-3 text-[10px] font-bold">
                      {member.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </form>
                ) : (
                  <span className="text-[9px] font-black">
                    {member.role}
                  </span>
                )}
              </article>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
