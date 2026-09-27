'use client';

import { Compass, House, ShoppingBag, ShoppingCart, UserRound, type LucideIcon } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isCustomerExperienceRoute } from '@/features/customer-experience/customerExperienceRoutes';

import { cn } from '@/lib/utils';

type RouteNavigationItem = {
  type: 'route';
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

type ActionNavigationItem = {
  type: 'action';
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

type MobileNavigationItem = RouteNavigationItem | ActionNavigationItem;

type MobileBottomNavigationProps = {
  discoveryOpen: boolean;
  onToggleDiscovery: () => void;
  onResetToStore: () => void;
};

export default function MobileBottomNavigation({
  discoveryOpen,
  onToggleDiscovery,
  onResetToStore
}: MobileBottomNavigationProps) {
  const pathname = usePathname();

  const allNavigationItems: MobileNavigationItem[] = [
    {
      type: 'route',
      id: 'home',
      label: 'Home',
      href: '/',
      icon: House
    },
    {
      type: 'route',
      id: 'store',
      label: 'Store',
      href: '/',
      icon: ShoppingBag
    },
    {
      type: 'action',
      id: 'discover',
      label: 'Discover',
      icon: Compass,
      onClick: onToggleDiscovery
    },
    {
      type: 'route',
      id: 'cart',
      label: 'Cart',
      href: '/cart',
      icon: ShoppingCart
    },
    {
      type: 'route',
      id: 'account',
      label: 'Account',
      href: '/account',
      icon: UserRound
    }
  ];

  if (!isCustomerExperienceRoute(pathname)) {
    return null;
  }

  const navigationItems = allNavigationItems;

  return (
    <nav
      aria-label="Main mobile navigation"
      className="
        fixed
        inset-x-3
        bottom-0
        z-30
        border
        border-white/[0.08]
        bg-background/85
        px-2
        pt-2
        pb-4
        shadow-[0_8px_32px_rgba(0,0,0,0.18)]
        backdrop-blur-xl
        backdrop-saturate-[180%]
        dark:border-white/[0.04]
        lg:hidden
      ">
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map(item => {
          const Icon = item.icon;

          if (item.type === 'action') {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                aria-label={discoveryOpen ? 'Close Discovery Hub' : 'Open Discovery Hub'}
                aria-pressed={discoveryOpen}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-muted-foreground transition',
                  'hover:bg-card/60 hover:text-foreground',
                  discoveryOpen && 'bg-card font-bold text-primary'
                )}>
                <Icon className={cn('size-5 transition-all', discoveryOpen && 'size-6 stroke-[2.5]')} />

                <span className={cn('text-[10px]', discoveryOpen && 'font-bold')}>{item.label}</span>
              </button>
            );
          }

          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={event => {
                if (item.id !== 'store') {
                  return;
                }

                event.preventDefault();

                onResetToStore();
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-muted-foreground transition',
                'hover:bg-card/60 hover:text-foreground',
                active && 'bg-card font-bold text-primary'
              )}>
              <Icon className={cn('size-5 transition-all', active && 'size-6 stroke-[2.5]')} />

              <span className={cn('text-[10px]', active && 'font-bold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
