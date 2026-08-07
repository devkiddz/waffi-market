'use client';

import * as React from 'react';

import {
  useRouter
} from 'next/navigation';

import {
  Bell,
  CreditCard,
  Heart,
  Headphones,
  LogIn,
  LogOut,
  Palette,
  Settings,
  ShoppingBag,
  ShoppingCart,
  User
} from 'lucide-react';

import BaseTriggerButton from '@/components/shared/BaseTriggerButton';

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

import {
  useCart
} from '@/features/cart';

import {
  useNotificationSummary
} from '@/features/notifications';

import {
  WorkspaceSwitcher
} from '@/features/workspace';

import {
  useIdentity
} from '@/providers/IdentityProvider';

import ThemeController from './ThemeController';

const CLOSE_ACCOUNT_SHEET_EVENT =
  'rcentz:close-account-sheet';

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string | number;
};

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  badge
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        disabled
          ? 'flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm opacity-40'
          : 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted'
      }>
      <span className="text-muted-foreground">
        {icon}
      </span>

      <span className="flex-1">
        {label}
      </span>

      {badge !== undefined ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return 'AJ';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

function UserTrigger() {
  const {
    user,
    isAuthenticated,
    isPending
  } = useIdentity();

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="size-9 animate-pulse rounded-full bg-muted" />

        <div className="hidden space-y-1 lg:block">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />

          <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const firstName =
    user?.name.split(' ')[0] ??
    'Guest';

  return (
    <div className="flex items-center gap-2 rounded-full border border-transparent p-1 transition hover:border-white/[0.08] hover:bg-background/55 lg:pr-3">
      <Avatar className="size-9 lg:size-10">
        <AvatarImage
          src={user?.image ?? undefined}
          alt={user?.name ?? 'Guest'}
        />

        <AvatarFallback>
          {isAuthenticated
            ? getInitials(user?.name)
            : 'G'}
        </AvatarFallback>
      </Avatar>

      <div className="hidden min-w-0 flex-col items-start lg:flex">
        <span className="max-w-28 truncate text-sm font-semibold">
          {isAuthenticated
            ? `Hi, ${firstName}`
            : 'Guest'}
        </span>

        <span className="max-w-32 truncate text-[11px] capitalize text-muted-foreground">
          {isAuthenticated
            ? `${user?.tier ?? 'member'} member`
            : 'Explore Shelsea'}
        </span>
      </div>
    </div>
  );
}

export default function UserActionComponent() {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    signOut
  } = useIdentity();

  const {
    totalQuantity,
    loading: cartLoading
  } = useCart();

  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const {
    unreadCount,
    loading: notificationsLoading
  } = useNotificationSummary(1, open);

  React.useEffect(() => {
    const closeSheet = () => {
      setOpen(false);
    };

    window.addEventListener(
      CLOSE_ACCOUNT_SHEET_EVENT,
      closeSheet
    );

    return () => {
      window.removeEventListener(
        CLOSE_ACCOUNT_SHEET_EVENT,
        closeSheet
      );
    };
  }, []);

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      setOpen(false);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <BaseTriggerButton
            type="button"
            title="Open account menu"
            aria-label={
              isAuthenticated
                ? 'Open account menu'
                : 'Open guest menu'
            }
            className="rounded-full"
          />
        }>
        <UserTrigger />
      </SheetTrigger>

      <SheetContent
        side="right"
        style={{
          top: 'env(safe-area-inset-top, 0px)',
          bottom: 0,
          height: 'auto',
          maxHeight: 'none'
        }}
        className="flex w-[min(23.75rem,100vw)] flex-col gap-0 overflow-hidden rounded-tl-[1.75rem] border-l border-t border-white/[0.1] bg-background/88 p-0 shadow-[0_0_70px_rgba(0,0,0,0.35)] backdrop-blur-[34px] backdrop-saturate-[185%] sm:max-w-[380px] [&_[data-slot=sheet-close]]:right-4 [&_[data-slot=sheet-close]]:top-[15px] [&_[data-slot=sheet-close]]:z-40 [&_[data-slot=sheet-close]]:rounded-full [&_[data-slot=sheet-close]]:border [&_[data-slot=sheet-close]]:border-white/[0.09] [&_[data-slot=sheet-close]]:bg-background/80 [&_[data-slot=sheet-close]]:shadow-sm [&_[data-slot=sheet-close]]:backdrop-blur-xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <SheetHeader className="sticky top-0 z-30 border-b border-border/70 bg-background/82 px-5 pb-5 pt-5 pr-16 text-left shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
            <SheetTitle className="text-base">
              {isAuthenticated
                ? 'My Shelsea'
                : 'Guest Experience'}
            </SheetTitle>

            <SheetDescription>
              {isAuthenticated
                ? 'Manage your account, shopping activity and preferences.'
                : 'Sign in to save products and continue your shopping journey.'}
            </SheetDescription>

            {isAuthenticated && user ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Avatar className="size-11">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name}
                  />

                  <AvatarFallback>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                    {user.tier} member
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  You are browsing as a guest.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigateTo('/sign-in')
                  }
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <LogIn className="size-4" />

                  Sign in
                </button>
              </div>
            )}

            <div className="mt-3">
              <WorkspaceSwitcher variant="account-sheet" />
            </div>
          </SheetHeader>

          <div className="space-y-3 px-3 py-4">
            <div
              id="customer-experience-history-account-slot"
              className="lg:hidden"
              aria-live="polite"
            />

            <div className="space-y-1">
              <MenuItem
                icon={<User className="size-4" />}
                label="Profile"
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/account')
                }
              />

              <MenuItem
                icon={<ShoppingCart className="size-4" />}
                label="Cart"
                badge={
                  cartLoading
                    ? '…'
                    : totalQuantity > 99
                      ? '99+'
                      : totalQuantity
                }
                onClick={() =>
                  navigateTo('/cart')
                }
              />

              <MenuItem
                icon={<Heart className="size-4" />}
                label="Wishlist"
                badge={0}
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/wishlist')
                }
              />

              <MenuItem
                icon={<ShoppingBag className="size-4" />}
                label="Orders"
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/orders')
                }
              />

              <MenuItem
                icon={<Bell className="size-4" />}
                label="Notifications"
                badge={
                  notificationsLoading
                    ? '…'
                    : unreadCount > 99
                      ? '99+'
                      : unreadCount
                }
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/notifications')
                }
              />

              <MenuItem
                icon={<Headphones className="size-4" />}
                label="Support"
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/support')
                }
              />

              <MenuItem
                icon={<CreditCard className="size-4" />}
                label="Payments"
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/payments')
                }
              />

              <MenuItem
                icon={<Settings className="size-4" />}
                label="Account settings"
                disabled={!isAuthenticated}
                onClick={() =>
                  navigateTo('/settings')
                }
              />
            </div>
          </div>

          <div className="border-t px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Palette className="size-4" />

                Theme
              </div>

              <ThemeController />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t bg-background/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-2xl">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-50">
              <LogOut className="size-4" />

              {signingOut
                ? 'Signing out...'
                : 'Sign out'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigateTo('/sign-up')
              }
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Create account
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
