'use client';

import { MapPin } from 'lucide-react';

import SearchBarComponent from '@/components/SearchBarComponent';
import LogoComponent from '@/components/shared/LogoComponent';
import CustomerHeaderActions from '@/components/navigation/CustomerHeaderActions';
import SidebarToggle from '@/components/shared/SidebarToggle';

type BrandType = {
  brandName: string;
  brandSlug: string;
};

export default function NavbarComponent({ brandName, brandSlug }: BrandType) {
  return (
    <div className="w-full border-b border-border bg-background text-foreground">
      <div data-pwa-safe-inline className="flex min-h-[var(--app-navbar-height)] min-w-0 items-center gap-3 px-[var(--app-page-gutter)] lg:gap-5">
        <SidebarToggle />
        <LogoComponent brandName={brandName} brandSlug={brandSlug} />
        <div className="hidden min-w-0 items-center gap-1 text-muted-foreground xl:flex">
          <MapPin className="size-5 shrink-0" />
          <div className="min-w-0 text-xs leading-tight">
            <span className="block">Deliver to</span>
            <span className="block truncate font-semibold text-foreground">Set at checkout</span>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 xl:block">
          <SearchBarComponent />
        </div>
        <CustomerHeaderActions />
      </div>
    </div>
  );
}
