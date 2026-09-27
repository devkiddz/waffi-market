'use client';

/* AJ_DESKTOP_HUB_CLOSE_BEFORE_PRODUCT_PAGE_V2K */

/* AJ_DESKTOP_HUB_PREVIEW_AUTHORITY_V1 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent
} from 'react';

import {
  usePathname
} from 'next/navigation';

import {
  ChevronRight,
  Expand,
  Shrink,
  PanelRightOpen
} from 'lucide-react';

import ActiveProductWidget from '@/components/ActiveProductWidget';

import {
  discoveryRegistry
} from '@/data/discoveryHubData';

import {
  resolveDiscoveryExperience,
  resolveDiscoveryPageMode
} from '@/features/feed-experience/discovery';

import {
  useFeedExperience
} from '@/features/feed-experience';

import {
  clearHubProductPreview,
  useHubProductPreview
} from '@/features/product-experience-state/hubProductPreviewBridge';

import {
  useProductDeepInsight
} from '@/features/product-intelligence';

import { cn } from '@/lib/utils';

import {
  DiscoveryHubProvider
} from '@/providers/DiscoveryHubProvider';

import CompactDiscoveryRail from './components/CompactDiscoveryRail';

import DiscoveryHubPanel from './DiscoveryHubPanel';

import {
  DiscoveryHubRenderer
} from './DiscoveryHubRenderer';

import type {
  CompactDiscoveryItem,
  DiscoveryRegistry,
  HubGroup,
  HubGroupId,
  HubWidget
} from './discoveryHubTypes';

type DesktopDiscoveryRailProps = {
  /**
   * Compatibility props.
   *
   * Existing callers may still pass groups and widgets.
   * The dynamic registry is now the source of truth.
   */
  groups?: HubGroup[];
  widgets?: HubWidget[];

  registry?: DiscoveryRegistry;

  collapsed: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;

  onCollapsedChange: (
    collapsed: boolean
  ) => void;
};

type HubView =
  | 'discovery'
  | 'product';

export default function DesktopDiscoveryRail({
  registry =
    discoveryRegistry,
  collapsed,
  expanded,
  onExpandedChange,
  onCollapsedChange
}: DesktopDiscoveryRailProps) {
  const pathname =
    usePathname();

  const {
    intent,
    context
  } = useFeedExperience();

  const hubProductPreview =
    useHubProductPreview();

  const productDeepInsight =
    useProductDeepInsight();

  const pageMode =
    resolveDiscoveryPageMode(
      pathname
    );

  const [
    activeHubGroupId,
    setActiveHubGroupId
  ] =
    useState<HubGroupId>('');

  const [
    viewPreference,
    setViewPreference
  ] = useState<{
    productId: string;
    view: HubView;
  } | null>(null);

  const lastRevealedPreviewRequestIdRef =
    useRef<string | null>(
      null
    );

  const lastResolutionFocusRef =
    useRef<string>('');

  const discoveryScrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const discoveryScrollTopRef =
    useRef(0);

  const resolution =
    useMemo(
      () =>
        resolveDiscoveryExperience({
          pageMode,

          intent,

          context,

          registry,

          previousActiveGroupId:
            activeHubGroupId ||
            undefined
        }),
      [
        activeHubGroupId,
        context,
        intent,
        pageMode,
        registry
      ]
    );

  const resolutionFocusKey =
    `${pageMode}:${intent.id}`;

  useEffect(() => {
    const activeGroupStillExists =
      resolution.groups.some(
        group =>
          group.id ===
          activeHubGroupId
      );

    const experienceChanged =
      lastResolutionFocusRef.current !==
      resolutionFocusKey;

    if (
      experienceChanged ||
      !activeGroupStillExists
    ) {
      lastResolutionFocusRef.current =
        resolutionFocusKey;

      setActiveHubGroupId(
        resolution.primaryGroupId ??
          resolution.groups[0]?.id ??
          ''
      );
    }
  }, [
    activeHubGroupId,
    resolution.groups,
    resolution.primaryGroupId,
    resolutionFocusKey
  ]);

  const routeProductId =
    intent.type === 'product'
      ? intent.targetId ??
        null
      : null;

  const activeProductId =
    hubProductPreview?.productId ??
    routeProductId;

  useEffect(() => {
    if (
      !productDeepInsight
    ) {
      return;
    }

    setActiveHubGroupId(
      'ai'
    );

    setViewPreference(
      activeProductId
        ? {
            productId:
              activeProductId,

            view:
              'discovery'
          }
        : null
    );

    onCollapsedChange(
      false
    );
  }, [
    activeProductId,
    onCollapsedChange,
    productDeepInsight?.requestId
  ]);

  const hubView: HubView =
    !activeProductId
      ? 'discovery'
      : viewPreference
            ?.productId ===
          activeProductId
        ? viewPreference.view
        : 'product';

  const productMode =
    Boolean(
      activeProductId
    );

  const showProductPanel =
    productMode &&
    hubView === 'product';

  useEffect(() => {
    if (
      !activeProductId ||
      !hubProductPreview?.reveal
    ) {
      return;
    }

    if (
      lastRevealedPreviewRequestIdRef.current ===
      hubProductPreview.requestId
    ) {
      return;
    }

    lastRevealedPreviewRequestIdRef.current =
      hubProductPreview.requestId;

    setViewPreference(
      null
    );

    onCollapsedChange(
      false
    );
  }, [
    activeProductId,
    hubProductPreview?.requestId,
    hubProductPreview?.reveal,
    onCollapsedChange
  ]);

  useEffect(() => {
    if (
      hubView !==
      'discovery'
    ) {
      return;
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          if (
            discoveryScrollRef.current
          ) {
            discoveryScrollRef.current.scrollTop =
              discoveryScrollTopRef.current;
          }
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [hubView]);

  const handleNavigatorGroupSelect =
    (
      groupId: HubGroupId
    ) => {
      setActiveHubGroupId(
        groupId
      );

      setViewPreference(
        activeProductId
          ? {
              productId:
                activeProductId,

              view:
                'discovery'
            }
          : null
      );
    };

  const handleSelectItem = (
    item: CompactDiscoveryItem
  ) => {
    if (item.groupId) {
      setActiveHubGroupId(
        item.groupId
      );
    }

    setViewPreference(
      activeProductId
        ? {
            productId:
              activeProductId,

            view:
              'discovery'
          }
        : null
    );

    onCollapsedChange(false);
  };

  const handleBackToDiscovery =
    () => {
      /**
       * Returning to Hub discovery clears only the independent
       * Hub preview. The central Feed keeps its current intent,
       * module composition, history and scroll position.
       */
      setViewPreference(
        activeProductId
          ? {
              productId:
                activeProductId,

              view:
                'discovery'
            }
          : null
      );

      clearHubProductPreview();
    };

  const handleShowProductDetails =
    () => {
      if (!activeProductId) {
        return;
      }

      setViewPreference({
        productId:
          activeProductId,

        view:
          'product'
      });

      onCollapsedChange(false);
    };

  const handleDiscoveryScroll = (
    event:
      UIEvent<HTMLDivElement>
  ) => {
    discoveryScrollTopRef.current =
      event.currentTarget.scrollTop;
  };

  return (
    <aside className="relative hidden h-full min-w-0 overflow-hidden transition-all duration-300 lg:block">
      <DiscoveryHubProvider
        groups={
          resolution.groups
        }
        widgets={
          resolution.widgets
        }
        activeGroupId={
          activeHubGroupId
        }
        onActiveGroupIdChange={
          setActiveHubGroupId
        }
      >
        <div className="absolute inset-0 min-h-0 overflow-hidden">
          {collapsed ? (
            <CompactDiscoveryRail
              items={
                resolution.compactItems
              }
              onExpand={() =>
                onCollapsedChange(
                  false
                )
              }
              onSelectItem={
                handleSelectItem
              }
            />
          ) : (
            <div className="relative h-full min-h-0 w-full overflow-hidden">
              <DiscoveryHubPanel
                className={expanded ? 'rounded-none border border-border' : 'rounded-lg border border-border'}
                onGroupSelect={
                  handleNavigatorGroupSelect
                }
              >
                <div className="h-full min-h-0 overflow-hidden">
                  <div
                    className={cn(
                      'h-full min-h-0',

                      showProductPanel
                        ? 'hidden'
                        : 'block'
                    )}
                  >
                    <div
                      ref={
                        discoveryScrollRef
                      }
                      onScroll={
                        handleDiscoveryScroll
                      }
                      className="h-full overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
                    >
                      <div className="w-full p-3 pb-24 md:p-4">
                        <DiscoveryHubRenderer />
                      </div>
                    </div>
                  </div>

                  {showProductPanel ? (
                    <div className="h-full min-h-0 overflow-hidden">
                      <ActiveProductWidget
                        onBackToDiscovery={
                          handleBackToDiscovery
                        }
                        onBeforeOpenProductPage={() => {
                          onCollapsedChange(
                            true
                          );
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </DiscoveryHubPanel>

              <button
                type="button"
                onClick={() => onExpandedChange(!expanded)}
                aria-label={expanded ? 'Restore Discovery Hub width' : 'Expand Discovery Hub to full width'}
                title={expanded ? 'Restore width' : 'Expand to full width'}
                className="absolute right-14 top-3 z-[70] grid size-9 place-items-center rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground">
                {expanded ? <Shrink className="size-4" /> : <Expand className="size-4" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  onCollapsedChange(
                    true
                  )
                }
                aria-label="Collapse Discovery Hub"
                className="absolute right-3 top-3 z-[70] grid size-9 place-items-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-xl transition hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>

              {productMode &&
              !showProductPanel ? (
                <button
                  type="button"
                  onClick={
                    handleShowProductDetails
                  }
                  className="absolute bottom-4 right-4 z-[70] inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  <PanelRightOpen className="size-4" />

                  Product details
                </button>
              ) : null}
            </div>
          )}
        </div>
      </DiscoveryHubProvider>
    </aside>
  );
}
