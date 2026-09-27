'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import DesktopDiscoveryRail from '@/components/discovery-hub-panel/DesktopDiscoveryRail';
import MobileDiscoverySheetHost from '@/components/discovery-hub-panel/MobileDiscoverySheetHost';

import { discoveryRegistry } from '@/data/discoveryHubData';

import {
  CUSTOMER_EXPERIENCE_START_FRESH_EVENT
} from '@/features/customer-experience/customerExperienceEvents';

import { isCustomerExperienceRoute } from '@/features/customer-experience/customerExperienceRoutes';
import CustomerExperienceNavigationPortal from '@/features/experience-stack/CustomerExperienceNavigationPortal';
import { ExperienceStackProvider } from '@/features/experience-stack/ExperienceStackProvider';
import { useWorkspace } from '@/features/workspace';
import { useCatalog } from '@/features/catalog';

import { GlobalExperienceRuntime } from '@/features/feed-experience/runtime';

import GlobalCustomerFeedPortal from './GlobalCustomerFeedPortal';

import { cn } from '@/lib/utils';

type DiscoverySurfaceProps = {
  pathname: string;
  workspaceId: string;
};

function DiscoverySurface({ pathname, workspaceId }: DiscoverySurfaceProps) {
  /* AJ_PRODUCT_PAGE_HUB_HANDOFF_COLLAPSED_V2K */
  const [collapsed, setCollapsed] = useState(
    () =>
      !pathname.startsWith('/account')
  );
  const [expanded, setExpanded] = useState(false);

  const [
    hubResetVersion,
    setHubResetVersion
  ] = useState(0);

useEffect(() => {
    const handleStartFresh =
      () => {
        setCollapsed(
          true
        );
        setExpanded(false);

        setHubResetVersion(
          current =>
            current + 1
        );
      };

    window.addEventListener(
      CUSTOMER_EXPERIENCE_START_FRESH_EVENT,
      handleStartFresh
    );

    return () => {
      window.removeEventListener(
        CUSTOMER_EXPERIENCE_START_FRESH_EVENT,
        handleStartFresh
      );
    };
  }, []);

  return (
    <GlobalExperienceRuntime>
      <ExperienceStackProvider workspaceId={workspaceId}>
        <CustomerExperienceNavigationPortal />
        <GlobalCustomerFeedPortal />

        <div
            key={`desktop-hub:${hubResetVersion}`}
            data-aj-fluid-discovery-hub-width
            className={cn(
              'hidden shrink-0 overflow-hidden transition-[width] duration-300 lg:block',
              expanded && !collapsed
                ? 'fixed inset-x-0 bottom-0 top-[var(--app-navbar-height)] z-[115] w-screen bg-background p-0'
                : cn(
                    'sticky top-[var(--app-navbar-height)] z-40 h-[calc(100dvh-var(--app-navbar-height))] border-l border-border',
                    collapsed ? 'w-20' : 'w-[var(--app-panel-width)]'
                  )
            )}>
            <DesktopDiscoveryRail
              registry={discoveryRegistry}
              collapsed={collapsed}
              expanded={expanded}
              onExpandedChange={setExpanded}
              onCollapsedChange={next => {
                setCollapsed(next);
                if (next) setExpanded(false);
              }}
            />
        </div>
        <MobileDiscoverySheetHost key={`mobile-hub:${hubResetVersion}`} />
      </ExperienceStackProvider>
    </GlobalExperienceRuntime>
  );
}

export default function GlobalDiscoveryHost() {
  const pathname = usePathname();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { loading: catalogLoading } = useCatalog();

  if (!isCustomerExperienceRoute(pathname)) {
    return null;
  }

  if (workspaceLoading || catalogLoading) {
    return (
      <aside aria-label="Discovery Hub loading" className="sticky top-[var(--app-navbar-height)] hidden h-[calc(100dvh-var(--app-navbar-height))] w-20 shrink-0 border-l border-border bg-card lg:grid lg:place-items-start">
        <span className="mx-auto mt-4 size-10 animate-pulse rounded-md bg-muted" />
      </aside>
    );
  }

  return (
    <DiscoverySurface
      pathname={pathname}
      workspaceId={activeWorkspace?.id ?? 'guest-live'}
    />
  );
}
