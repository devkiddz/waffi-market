'use client';

import { Suspense } from 'react';

import Image from 'next/image';
import { Crown, Heart, LogOut, ShieldCheck, ShoppingCart, Store } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

import { useCatalog } from '@/features/catalog';
import { MarketplaceLink } from '@/features/commerce-mode/components/MarketplaceLink';

import { useCart } from '@/features/cart';
import { PWAInstallControl } from '@/features/pwa';
import { useWishlist } from '@/features/wishlist';
import { useWorkspace } from '@/features/workspace';

import { useIdentity } from '@/providers/IdentityProvider';
import SidebarHeaderContent from '@/providers/SidebarHeaderContent';

function SidebarShopMenu() {
  const { categories } = useCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const activeCategory = pathname.startsWith('/categories/') ? decodeURIComponent(pathname.split('/')[2] ?? 'all') : 'all';

  const handleCategoryChange = (slug: string): void => {
    router.push(slug === 'all' ? '/' : `/categories/${encodeURIComponent(slug)}`, {
      scroll: false
    });
  };

  return (
    <SidebarMenu className="space-y-1">
      {categories.map(category => (
        <SidebarMenuItem key={category.id}>
          <SidebarMenuButton
            size="lg"
            isActive={activeCategory === category.slug}
            onClick={() => handleCategoryChange(category.slug)}
            tooltip={category.label}
            className="h-12 rounded-xl px-2 transition-all data-[active=true]:bg-secondary/10 data-[active=true]:text-secondary group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0!">
            <Image
              src={category.image}
              alt={category.label}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg object-cover group-data-[collapsible=icon]:size-9"
            />

            <span className="font-semibold group-data-[collapsible=icon]:hidden">{category.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const compact = state === 'collapsed' && !isMobile;

  const { user, isAuthenticated, isPending, signOut } = useIdentity();

  const { totalQuantity, loading: cartLoading } = useCart();
  const { count: wishlistCount, loading: wishlistLoading } = useWishlist();
  const { activeWorkspace } = useWorkspace();
  const adminRoles = ['SUPPORT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  const hasAdminAccess = Boolean(activeWorkspace && adminRoles.includes(activeWorkspace.membership.role));

  const cartCountLabel = cartLoading ? '…' : totalQuantity > 99 ? '99+' : totalQuantity;
  const wishlistCountLabel = wishlistLoading ? '…' : wishlistCount > 99 ? '99+' : wishlistCount;

  const handleSignOut = async (): Promise<void> => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" style={{ top: 'var(--app-navbar-height)', height: 'calc(100svh - var(--app-navbar-height))' }}>
      <div className="flex h-full flex-col overflow-hidden rounded-none shadow-none backdrop-blur-xl">
        {!compact ? <SidebarHeader className="px-4 pb-3 pt-4"><SidebarHeaderContent /></SidebarHeader> : null}

        <SidebarContent className={compact ? 'px-1.5 pt-3' : 'px-3'}>
          <SidebarGroup className={compact ? 'p-0' : 'p-3'}>
            <SidebarGroupLabel className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Shop
            </SidebarGroupLabel>

            <Suspense
              fallback={
                <div className="space-y-2 p-2">
                  <div className="h-10 animate-pulse rounded-xl bg-muted" />
                  <div className="h-10 animate-pulse rounded-xl bg-muted" />
                </div>
              }>
              <SidebarShopMenu />
            </Suspense>
            <MarketplaceLink className="mt-2 flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0" >
              <Store className="size-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Shops</span>
            </MarketplaceLink>
          </SidebarGroup>

          {!compact ? <div className="mt-4 rounded-3xl border border-white/5 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Crown className="size-4" />
              </div>

              <div>
                <h3 className="text-sm font-black">Shelsea Premium</h3>

                <p className="text-xs text-muted-foreground">Priority service</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Priority delivery, member offers and early access to selected drops.
            </p>

            <button
              type="button"
              onClick={() => router.push('/membership')}
              className="mt-4 w-full rounded-2xl bg-accent px-3 py-2 text-sm font-bold text-accent-foreground transition hover:opacity-90">
              Upgrade
            </button>
          </div> : null}
        </SidebarContent>

        {compact ? (
          <SidebarFooter className="mt-auto items-center gap-1 p-1.5">
            <button type="button" title="Wishlist" aria-label="Wishlist" onClick={() => router.push('/wishlist')} className="grid size-9 place-items-center rounded-md hover:bg-muted"><Heart className="size-4" /></button>
            <button type="button" title="Cart" aria-label="Cart" onClick={() => router.push('/cart')} className="grid size-9 place-items-center rounded-md hover:bg-muted"><ShoppingCart className="size-4" /></button>
            <button type="button" title="Account" aria-label="Account" onClick={() => router.push('/account')} className="grid size-9 place-items-center rounded-md hover:bg-muted"><Crown className="size-4" /></button>
          </SidebarFooter>
        ) : <SidebarFooter className="mt-auto space-y-2 p-3">
          <PWAInstallControl presentation="sidebar" />

          <div className="rounded-3xl border border-white/5 bg-background/50 p-4">
            {isPending ? (
              <div className="space-y-3">
                <div className="h-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-9 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/account')}
                  className="flex w-full items-center gap-3 rounded-2xl text-left">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="size-10 object-cover"
                      />
                    ) : (
                      <span className="font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{user.name}</p>

                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>

                    <p className="mt-0.5 text-[10px] font-semibold capitalize text-primary">
                      {user.tier} member
                    </p>
                  </div>
                </button>

                <div className="mt-3 space-y-1">
                  {hasAdminAccess ? (
                    <button
                      type="button"
                      onClick={() => router.push('/admin')}
                      className="flex w-full items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-left text-sm font-semibold text-primary transition hover:bg-primary/15">
                      <ShieldCheck className="size-4" />
                      Admin console
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => router.push('/wishlist')}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-muted">
                    <Heart className="size-4 text-secondary" />

                    <span className="flex-1">Wishlist</span>

                    <span className="text-xs font-semibold text-muted-foreground">{wishlistCountLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/cart')}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-muted">
                    <ShoppingCart className="size-4 text-secondary" />

                    <span className="flex-1">Cart</span>

                    <span className="text-xs font-semibold text-muted-foreground">{cartCountLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-500/10">
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold">Welcome to Shelsea</p>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Your guest cart is available on this device. Sign in later to save and sync your shopping
                    experience.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="flex w-full items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-left text-sm font-semibold transition hover:bg-muted/80">
                  <ShoppingCart className="size-4 text-secondary" />

                  <span className="flex-1">Cart</span>

                  <span className="text-xs font-semibold text-muted-foreground">{cartCountLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/sign-in')}
                  className="w-full rounded-2xl bg-accent px-3 py-2 text-sm font-bold text-accent-foreground">
                  Sign in
                </button>
              </div>
            )}
          </div>
        </SidebarFooter>}
      </div>
    </Sidebar>
  );
}
