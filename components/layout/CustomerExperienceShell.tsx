'use client';

import { Suspense, type ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import GlobalDiscoveryHost from '@/features/feed-experience/layout/GlobalDiscoveryHost';
import CategoryNavigation from '@/components/navigation/CategoryNavigation';

import { isCustomerExperienceRoute } from '@/features/customer-experience/customerExperienceRoutes';

type CustomerExperienceShellProps = {
  children: ReactNode;
};

export default function CustomerExperienceShell({ children }: CustomerExperienceShellProps) {
  const pathname = usePathname();

  if (!isCustomerExperienceRoute(pathname)) {
    return <><Suspense fallback={null}><CategoryNavigation /></Suspense>{children}</>;
  }

  return (
    <div className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="relative min-w-0">
        {pathname !== '/' ? (
          <div className="sticky top-[var(--app-navbar-height)] z-[100] min-w-0">
            <Suspense fallback={null}><CategoryNavigation /></Suspense>
          </div>
        ) : null}
        <div id="customer-global-feed-slot" className="min-w-0" />

        <div id="customer-route-content" className="min-w-0">
          {children}
        </div>
      </div>

      <Suspense fallback={null}>
        <GlobalDiscoveryHost />
      </Suspense>
    </div>
  );
}
