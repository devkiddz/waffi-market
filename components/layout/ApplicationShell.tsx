import { Suspense, type ReactNode } from 'react';

import FooterComponent from '@/components/FooterComponent';
import NavbarComponent from '@/components/Navbar';
import ApplicationShellBoundary from '@/components/layout/ApplicationShellBoundary';
import CustomerExperienceShell from '@/components/layout/CustomerExperienceShell';
import MobileApplicationShell from '@/components/layout/MobileApplicationShell';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import SearchMobileOverlay from '@/features/search/SearchMobileOverlay';

import { QuickSupportChatLauncher } from '@/features/support/components/QuickSupportChatLauncher';

import { AppSidebar } from '@/providers/AppSideBar';

type ApplicationShellProps = {
  children: ReactNode;
};

export default function ApplicationShell({ children }: ApplicationShellProps) {
  const customerShell = (
    <SidebarProvider defaultOpen>
      <AppSidebar />

      <SidebarInset className="min-w-0 overflow-x-clip">
        <div className="flex min-h-svh min-w-0 flex-col">
          <header className="sticky top-0 z-[120] shrink-0 bg-background" data-app-navbar>
            <Suspense fallback={null}>
              <NavbarComponent brandName="Shelsea" brandSlug="" />
            </Suspense>
          </header>

          <main className="relative flex min-w-0 flex-1 flex-col">
            <div
              id="customer-experience-back-slot"
              className="pointer-events-none absolute inset-x-0 top-0 z-[90] min-w-0 empty:hidden"
              aria-live="polite"
            />

            <MobileApplicationShell>
              <CustomerExperienceShell>{children}</CustomerExperienceShell>
            </MobileApplicationShell>
          </main>

          <FooterComponent brandName="Shelsea" brandSlug="" />
        </div>
      </SidebarInset>

      <SearchMobileOverlay />

      <QuickSupportChatLauncher />
    </SidebarProvider>
  );

  return (
    <ApplicationShellBoundary
      customerShell={customerShell}
      operationalShell={<div className="min-h-dvh min-w-0 bg-background">{children}</div>}
    />
  );
}
