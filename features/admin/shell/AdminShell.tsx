'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BadgePercent,
  BrainCircuit,
  Boxes,
  ChartNoAxesCombined,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  FolderKanban,
  GalleryVerticalEnd,
  Grid2X2Plus,
  Headphones,
  LayoutDashboard,
  ListTodo,
  Menu,
  PackageSearch,
  Settings2,
  Tags,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Store,
  Truck,
  UsersRound,
  Warehouse,
  X
} from 'lucide-react';
import { useState, type ComponentType } from 'react';

import SignOutButton from '@/components/auth/SignOutButton';
import { AdminActionFeedbackBridge } from '@/features/admin/components/AdminActionFeedbackBridge';
import { cn } from '@/lib/utils';

export type AdminShellPermission =
  | 'commerce:view'
  | 'inventory:view'
  | 'activity:view'
  | 'analytics:view'
  | 'todo:view'
  | 'delivery:view'
  | 'order:view'
  | 'customer:view'
  | 'media:view'
  | 'category:view'
  | 'brand:view'
  | 'collection:view'
  | 'promotion:view'
  | 'experience:manage'
  | 'vendor:view'
  | 'approval:view'
  | 'staff:view'
  | 'support:view'
  | 'settings:view'
  | 'system:manage'
  | 'platform:manage';

type AdminShellProps = {
  children: React.ReactNode;
  operator: {
    name: string;
    role: string;
    workspaceName: string;
    workspaceMode: string;
    commerceMode: string;
    isDeveloperAdmin: boolean;
  };
  permissions: AdminShellPermission[];
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: AdminShellPermission;
  developerOnly?: boolean;
};

const navigation: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Command',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      {
        href: '/admin/assistant',
        label: 'AJ Studio Manager',
        icon: BrainCircuit,
        permission: 'commerce:view'
      },
      { href: '/admin/activity', label: 'Activity', icon: Activity, permission: 'activity:view' },
      {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: ChartNoAxesCombined,
        permission: 'analytics:view'
      },
      { href: '/admin/todos', label: 'Todos', icon: ListTodo, permission: 'todo:view' },
      { href: '/admin/approvals', label: 'Approvals', icon: ShieldCheck, permission: 'approval:view' }
    ]
  },
  {
    label: 'Commerce studios',
    items: [
      { href: '/admin/media', label: 'Media Studio', icon: GalleryVerticalEnd, permission: 'media:view' },
      { href: '/admin/products', label: 'Product Studio', icon: Boxes, permission: 'commerce:view' },
      { href: '/admin/categories', label: 'Category Studio', icon: Grid2X2Plus, permission: 'category:view' },
      { href: '/admin/brands', label: 'Brand Studio', icon: Tags, permission: 'brand:view' },
      {
        href: '/admin/collections',
        label: 'Collection Studio',
        icon: FolderKanban,
        permission: 'collection:view'
      },
      {
        href: '/admin/promotions',
        label: 'Promotion Studio',
        icon: BadgePercent,
        permission: 'promotion:view'
      },
      {
        href: '/admin/store-studio',
        label: 'Store Studio',
        icon: Clapperboard,
        permission: 'experience:manage'
      },
      { href: '/admin/hero', label: 'Homepage Hero', icon: Sparkles, permission: 'system:manage' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/support', label: 'Support', icon: Headphones, permission: 'support:view' },
      { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, permission: 'inventory:view' },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, permission: 'order:view' },
      { href: '/admin/deliveries', label: 'Deliveries', icon: Truck, permission: 'delivery:view' },
      { href: '/admin/customers', label: 'Customers', icon: CircleUserRound, permission: 'customer:view' }
    ]
  },
  {
    label: 'People and access',
    items: [
      { href: '/admin/vendors', label: 'Vendors', icon: Store, permission: 'vendor:view' },
      { href: '/admin/staff', label: 'Staff', icon: UsersRound, permission: 'staff:view' },
      { href: '/admin/accounts', label: 'Accounts', icon: PackageSearch, permission: 'system:manage' }
    ]
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/settings', label: 'Workspace settings', icon: Settings2, permission: 'settings:view' },
      {
        href: '/admin/system',
        label: 'Developer system',
        icon: Activity,
        permission: 'platform:manage',
        developerOnly: true
      }
    ]
  }
];

function activeFor(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, operator, permissions }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const permissionSet = new Set(permissions);

  const groups = navigation
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.developerOnly && !operator.isDeveloperAdmin) return false;
        return !item.permission || permissionSet.has(item.permission);
      })
    }))
    .filter(group => group.items.length > 0);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-4">
        <Link href="/admin" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted/60">
          <span className="grid size-10 place-items-center rounded-2xl bg-foreground text-background">
            <Store className="size-5" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm">Shelsea Admin</strong>
            <span className="block truncate text-xs text-muted-foreground">Rcentz control plane</span>
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groups.map(group => (
            <section key={group.label}>
              <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = activeFor(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                        active
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}>
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronRight
                        className={cn(
                          'size-3.5 transition',
                          active ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-2xl bg-muted/55 p-3">
          <p className="truncate text-sm font-bold">{operator.name}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {operator.role.replaceAll('_', ' ')} · {operator.workspaceName}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold">
              {operator.workspaceMode}
            </span>
            <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold">
              {operator.commerceMode.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="mt-3 border-t border-border/60 pt-3">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-control-plane min-h-dvh bg-background">
      <AdminActionFeedbackBridge />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border/60 bg-card/95 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Admin navigation"
          className="grid size-10 place-items-center rounded-2xl border border-border/60 bg-card">
          <Menu className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-bold">{operator.workspaceName}</p>
          <p className="truncate text-[11px] text-muted-foreground">Admin control plane</p>
        </div>
        <Link
          href="/store"
          className="grid size-10 place-items-center rounded-2xl border border-border/60 bg-card"
          aria-label="Open Store">
          <ShoppingBag className="size-4" />
        </Link>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close Admin navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] border-r border-border/60 bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close Admin navigation"
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-border/60 bg-background">
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-60">{children}</div>
    </div>
  );
}
