'use client';

import {
  useCallback,
  useState
} from 'react';

import {
  ChevronUp,
  Heart,
  LayoutGrid,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  TextSearch
} from 'lucide-react';

import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation';

import SearchBarComponent from '@/components/SearchBarComponent';
import UserActionComponent from '@/components/UserActionComponent';
import LogoComponent from '@/components/shared/LogoComponent';
import SidebarToggle from '@/components/shared/SidebarToggle';
import StoreCategoriesPill from '@/components/store/StoreCategoriesPill';
import { Button } from '@/components/ui/button';
import PremiumStoreButton from '@/components/ui/premium-store-button';
import { MarketplaceLink } from '@/features/commerce-mode/components/MarketplaceLink';
import {
  requestFreshStoreExperience
} from '@/features/customer-experience/customerExperienceEvents';
import { MobileSearchButton } from '@/features/search';

import { CommunicationBell } from '@/features/communication';

type BrandType = {
  brandName: string;
  brandSlug: string;
};

const brands = [
  {
    id: 'all',
    label: 'All',
    icon: LayoutGrid,
    slug: 'all'
  },
  {
    id: 'clothing',
    label: 'Clothing',
    icon: ShoppingBag,
    slug: 'clothing'
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: Sparkles,
    slug: 'apparel-accessories'
  },
  {
    id: 'hair',
    label: 'Hair',
    icon: Scissors,
    slug: 'hair'
  },
  {
    id: 'perfumes',
    label: 'Perfumes',
    icon: Heart,
    slug: 'perfumes'
  }
] as const;

export default function NavbarComponent({
  brandName,
  brandSlug
}: BrandType) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const selectedCategory = searchParams.get('category') ?? 'all';

  const isStorePage =
    pathname === '/store' ||
    pathname.startsWith('/store/');

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all') {
          params.delete(key);
          return;
        }

        params.set(key, value);
      });

      const query = params.toString();

      router.push(query ? `/store?${query}` : '/store', {
        scroll: false
      });
    },
    [router, searchParams]
  );

  const openStore = useCallback(() => {
    setMobileToolsOpen(
      false
    );

    requestFreshStoreExperience();

    /**
     * Route fallback keeps Shelsea Store usable even during the
     * brief period before the global experience runtime mounts.
     */
    router.replace(
      '/store'
    );
  }, [router]);

  return (
    <div className="relative isolate w-full overflow-visible border-b border-white/[0.1] bg-background/78 shadow-[0_14px_46px_rgba(0,0,0,0.22)] backdrop-blur-[34px] backdrop-saturate-[195%] supports-[backdrop-filter]:bg-background/60">
      <div className="header-ambient-light opacity-80" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

      <div className="pointer-events-none absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />

      <div className="pointer-events-none absolute left-[6%] top-0 h-full w-44 bg-[radial-gradient(circle_at_top,rgba(215,184,111,0.1),transparent_72%)] blur-2xl" />

      <div
        data-pwa-safe-inline
        className="relative isolate mx-auto flex h-[var(--app-navbar-height)] min-w-0 items-center gap-1.5 px-[var(--app-page-gutter)] sm:gap-2 lg:gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <SidebarToggle />

          <LogoComponent
            brandName={brandName}
            brandSlug={brandSlug}
          />
        </div>

        <div className="hidden min-w-0 flex-1 items-center xl:flex">
          <div className="mx-auto flex min-w-0 max-w-[78rem] flex-1 items-center gap-1.5 rounded-2xl border border-white/[0.09] bg-background/38 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_14px_38px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
            <nav
              aria-label="Store categories"
              className="flex shrink-0 items-center gap-0.5">
              {brands.map(item => {
                const Icon = item.icon;
                const isActive = selectedCategory === item.slug;

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateQuery({
                        category:
                          item.slug === 'all'
                            ? null
                            : item.slug
                      })
                    }
                    className={
                      isActive
                        ? 'h-10 gap-2 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground shadow-[0_8px_24px_rgba(201,164,92,0.18)] transition-all'
                        : 'h-10 gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground'
                    }>
                    <Icon className="size-4" />

                    <span className="whitespace-nowrap">
                      {item.label}
                    </span>
                  </Button>
                );
              })}

              <PremiumStoreButton
                active={isStorePage}
                onClick={openStore}
              />

              <MarketplaceLink className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition hover:bg-background/70 hover:text-foreground">
                <Store className="size-4" />
                <span>Shops</span>
              </MarketplaceLink>
            </nav>

            <div className="mx-1.5 h-7 w-px shrink-0 bg-border/70" />

            <div className="min-w-[15rem] flex-1">
              <SearchBarComponent />
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
          <button
            type="button"
            title="Open search and categories"
            aria-label="Open search and categories"
            aria-expanded={mobileToolsOpen}
            aria-controls="mobile-discovery-tools"
            onClick={() =>
              setMobileToolsOpen(current => !current)
            }
            className="grid size-10 place-items-center rounded-full border border-white/[0.09] bg-background/48 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:border-accent/25 hover:bg-muted/70 hover:text-foreground xl:hidden">
            {mobileToolsOpen ? (
              <ChevronUp className="size-[1.15rem]" />
            ) : (
              <TextSearch className="size-[1.15rem]" />
            )}
          </button>

          <CommunicationBell />

          <div
            id="customer-experience-history-slot"
            className="relative hidden min-h-10 shrink-0 items-center lg:flex"
            aria-live="polite"
          />

          <UserActionComponent />
        </div>
      </div>

      <div
        id="mobile-discovery-tools"
        className="xl:hidden">
        <div
          className={
            mobileToolsOpen
              ? 'max-h-56 overflow-hidden border-t border-white/[0.08] bg-background/86 opacity-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[32px] transition-all duration-300 ease-in-out'
              : 'max-h-0 overflow-hidden border-t border-transparent bg-background/86 opacity-0 backdrop-blur-[32px] transition-all duration-300 ease-in-out'
          }>
          <div className="space-y-3 px-[var(--app-page-gutter)] pb-4 pt-3">
            <MobileSearchButton />

            <StoreCategoriesPill
              selectedCategory={selectedCategory}
              onSelectCategory={category =>
                updateQuery({
                  category
                })
              }
            />

            <MarketplaceLink className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/70 text-xs font-bold text-foreground">
              <Store className="size-4" />
              Browse verified shops
            </MarketplaceLink>
          </div>
        </div>
      </div>
    </div>
  );
}
