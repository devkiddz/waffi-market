import Link from 'next/link';
import { ArrowLeft, Eye, ShieldCheck, UserCog, UsersRound } from 'lucide-react';

import { getAdminAccess } from '@/features/admin/auth/adminPermissions';
import { assignStaffLevel } from '@/features/admin/staff/actions';
import { prisma } from '@/lib/prisma';

export default async function AdminStaffPage() {
  const access = await getAdminAccess();
  if (!access.permissions.has('staff:view') && !access.permissions.has('staff:assign')) throw new Error('Staff activity requires Level 3 or Super Admin access.');

  const actor = await prisma.user.findUnique({ where: { id: access.session.user.id }, select: { isGhostDeveloper: true } });
  const staff = await prisma.staffProfile.findMany({ where: { workspaceId: access.membership.workspaceId, ...(actor?.isGhostDeveloper ? {} : { user: { isGhostDeveloper: false } }) }, include: { user: { select: { name: true, email: true, image: true, updatedAt: true } } }, orderBy: [{ active: 'desc' }, { level: 'desc' }] });
  const canAssign = access.permissions.has('staff:assign');
  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-xl sm:p-7"><Link href="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-4" /> Attention center</Link><div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Supervised access</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Staff control</h1><p className="mt-2 text-sm text-muted-foreground">Level 3 can inspect staff profiles and activity. Only Super Admin can assign or change access.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-[10px] font-bold text-primary"><UsersRound className="size-4" /> {staff.length} profiles</span></div></header>

      {canAssign ? <section className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg sm:p-6"><div className="flex gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><UserCog className="size-5" /></div><div><h2 className="font-bold">Assign staff level</h2><p className="mt-1 text-xs text-muted-foreground">The user must already have an Shelsea account.</p></div></div><form action={assignStaffLevel} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><input required type="email" name="email" placeholder="Staff account email" className={fieldClass + ' lg:col-span-2'} /><select name="level" className={fieldClass}><option value="LEVEL_1">Level 1 · View</option><option value="LEVEL_2">Level 2 · Operate</option><option value="LEVEL_3">Level 3 · Approve</option></select><input name="title" placeholder="Job title" className={fieldClass} /><input name="department" placeholder="Department" className={fieldClass} /><button className="h-11 rounded-full bg-foreground px-4 text-xs font-bold text-background sm:col-span-2 lg:col-span-5">Assign secured access</button></form></section> : null}

      <section className="rounded-[2rem] border border-border/60 bg-card/70 p-3 shadow-lg sm:p-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{staff.map(profile => <article key={profile.id} className="rounded-3xl border border-border/60 bg-background/60 p-4"><div className="flex items-start justify-between gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-muted font-black">{profile.user.name.charAt(0)}</div><span className={profile.active ? 'rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold text-emerald-600' : 'rounded-full bg-muted px-2 py-1 text-[8px] font-bold text-muted-foreground'}>{profile.active ? 'ACTIVE' : 'SUSPENDED'}</span></div><h2 className="mt-4 truncate text-sm font-bold">{profile.user.name}</h2><p className="mt-1 truncate text-[10px] text-muted-foreground">{profile.user.email}</p><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-3"><Info label="Access" value={profile.level.replace('_', ' ')} /><Info label="Code" value={profile.employeeCode} /><Info label="Title" value={profile.title ?? 'Staff'} /><Info label="Department" value={profile.department ?? 'Commerce'} /></div><div className="mt-4 flex items-center gap-2 text-[9px] text-muted-foreground"><Eye className="size-3.5" /> Last profile update {profile.user.updatedAt.toLocaleDateString('en-NG')}</div></article>)}</div>{!staff.length ? <div className="grid min-h-48 place-items-center text-center"><div><ShieldCheck className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-bold">No staff profiles yet</p><p className="mt-1 text-xs text-muted-foreground">Super Admin can assign the first staff member above.</p></div></div> : null}</section>
    </div></main>
  );
}

const fieldClass = 'h-11 min-w-0 rounded-2xl border border-border/70 bg-background px-3 text-xs outline-none focus:border-primary';
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-[8px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-[10px] font-bold">{value}</p></div>; }
