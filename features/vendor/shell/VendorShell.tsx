'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgePercent,
  BarChart3,
  BrainCircuit,
  Boxes,
  Clapperboard,
  FileClock,
  FolderKanban,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Store,
  UsersRound,
  X
} from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';

import type { VendorPermission } from '@/features/vendor/auth/vendorAccess';
import type { VendorStudioCapabilities } from '@/features/vendor/entitlements/contracts';
import { signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type VendorShellProps = {
  children: ReactNode;
  vendor: string;
  vendorSlug: string;
  role: string;
  permissions: VendorPermission[];
  studioCapabilities: VendorStudioCapabilities;
};

type VendorNavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: VendorPermission;
  capability?: keyof VendorStudioCapabilities;
};

const navigation: VendorNavigationItem[] = [
  { href: '/vendor', label: 'Overview', icon: LayoutDashboard },
  { href: '/vendor/assistant', label: 'AJ Studio Manager', icon: BrainCircuit },
  { href: '/vendor/inbox', label: 'Inbox', icon: MessageSquareText, permission: 'communication:view' },
  { href: '/vendor/media', label: 'Media Studio', icon: GalleryVerticalEnd, permission: 'media:view', capability: 'media' },
  { href: '/vendor/products', label: 'Product Studio', icon: Boxes, permission: 'product:view', capability: 'products' },
  { href: '/vendor/collections', label: 'Collection Studio', icon: FolderKanban, permission: 'collection:view', capability: 'collections' },
  { href: '/vendor/promotions', label: 'Promotion Studio', icon: BadgePercent, permission: 'promotion:view', capability: 'promotions' },
  { href: '/vendor/stories', label: 'Stories', icon: Clapperboard, permission: 'campaign:view', capability: 'stories' },
  { href: '/vendor/reels', label: 'Reels', icon: Clapperboard, permission: 'campaign:view', capability: 'reels' },
  { href: '/vendor/submissions', label: 'Submissions', icon: FileClock, permission: 'submission:view' },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics:view' },
  { href: '/vendor/team', label: 'Team', icon: UsersRound, permission: 'team:manage' }
];

function isActive(pathname: string, href: string): boolean {
  return href === '/vendor'
    ? pathname === '/vendor'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function VendorShell({
  children,
  vendor,
  vendorSlug,
  role,
  permissions,
  studioCapabilities
}: VendorShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const permissionSet = new Set(permissions);
  const visibleNavigation = navigation.filter(
    item =>
      (!item.permission || permissionSet.has(item.permission)) &&
      (!item.capability || studioCapabilities[item.capability])
  );

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut();
      setMobileOpen(false);
      router.replace('/account');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-4">
        <Link href="/vendor" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted/60">
          <span className="grid size-10 place-items-center rounded-2xl bg-foreground text-background">
            <Store className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{vendor}</p>
            <p className="text-[9px] text-muted-foreground">Vendor Studio</p>
          </div>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {visibleNavigation.map(item => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-4">
        <p className="text-[9px] font-bold uppercase text-muted-foreground">
          {role.replaceAll('_', ' ')}
        </p>
        <div className="mt-3 space-y-1">
          <Link
            href={`/shops/${encodeURIComponent(vendorSlug)}`}
            onClick={() => setMobileOpen(false)}
            className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <span>Open Store</span>
            <Store className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60">
            <span>{signingOut ? 'Signing out?' : 'Log Out'}</span>
            <LogOut className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border/60 bg-card/95 lg:block">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Vendor navigation"
          className="grid size-10 place-items-center rounded-2xl border border-border">
          <Menu className="size-5" />
        </button>
        <p className="truncate text-xs font-black">{vendor}</p>
        <Link
          href="/store"
          aria-label="Open Store"
          className="grid size-10 place-items-center rounded-2xl border border-border">
          <Store className="size-4" />
        </Link>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close Vendor navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,19rem)] bg-card shadow-2xl">
            <button
              type="button"
              aria-label="Close Vendor navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-background">
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
