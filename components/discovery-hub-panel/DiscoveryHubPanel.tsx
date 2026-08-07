'use client';

import {
  useRef,
  type ReactNode
} from 'react';

import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import {
  cn
} from '@/lib/utils';

import {
  useDiscoveryHub
} from '@/providers/DiscoveryHubProvider';

import {
  DiscoveryHubRenderer
} from './DiscoveryHubRenderer';

import {
  resolveDiscoveryHubIcon
} from './discoveryHubIconRegistry';

import type {
  HubGroupId
} from './discoveryHubTypes';

type DiscoveryHubPanelProps = {
  className?: string;

  children?: ReactNode;

  onGroupSelect?: (
    groupId: HubGroupId
  ) => void;
};

export default function DiscoveryHubPanel({
  className,
  children,
  onGroupSelect
}: DiscoveryHubPanelProps) {
  const {
    groups,
    activeGroupId,
    setActiveGroupId
  } = useDiscoveryHub();

  const tabsRef =
    useRef<HTMLDivElement>(
      null
    );

  const scrollTabs = (
    direction:
      | 'left'
      | 'right'
  ) => {
    tabsRef.current?.scrollBy({
      left:
        direction === 'left'
          ? -160
          : 160,

      behavior:
        'smooth'
    });
  };

  const handleGroupSelect = (
    groupId: HubGroupId
  ) => {
    onGroupSelect?.(
      groupId
    );

    setActiveGroupId(
      groupId
    );
  };

  return (
    <main
      data-discovery-hub-panel
      className={cn(
        `
          flex h-full min-h-0
          w-full flex-col
          overflow-hidden
          bg-background
        `,
        className
      )}>
      <div
        className="
          relative z-40 shrink-0
          border-b border-primary/10
          bg-background/95
          backdrop-blur-xl
        ">
        <div className="px-4 pb-3 pt-4">
          <p
            className="
              text-[10px] font-semibold
              uppercase tracking-[0.2em]
              text-primary/50
            ">
            SHELSEA
          </p>

          <h2
            className="
              mt-1 text-lg
              font-bold tracking-tight
              text-primary
            ">
            Discovery Hub
          </h2>

          <p
            className="
              mt-1 pr-8 text-xs
              leading-5 text-primary/55
            ">
            Your adaptive shopping, account and activity workspace.
          </p>
        </div>

        {groups.length > 0 ? (
          <div
            className="
              border-t border-primary/10
              px-2 py-2.5
            ">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Scroll groups left"
                aria-label="Scroll groups left"
                onClick={() =>
                  scrollTabs(
                    'left'
                  )
                }
                className="
                  grid size-8 shrink-0
                  place-items-center
                  rounded-full
                  bg-background/5
                  text-primary/60
                  transition
                  hover:bg-card/10
                  hover:text-primary
                ">
                <ChevronLeft className="size-4" />
              </button>

              <div
                ref={tabsRef}
                className="
                  flex min-w-0 flex-1
                  gap-1.5 overflow-x-auto
                  scroll-smooth
                  scrollbar-none
                ">
                {groups.map(
                  group => {
                    const Icon =
                      resolveDiscoveryHubIcon(
                        group.icon
                      );

                    const isActive =
                      activeGroupId ===
                      group.id;

                    return (
                      <button
                        key={
                          group.id
                        }
                        type="button"
                        aria-pressed={
                          isActive
                        }
                        title={
                          group.description
                        }
                        onClick={() =>
                          handleGroupSelect(
                            group.id
                          )
                        }
                        className={cn(
                          `
                            relative flex shrink-0
                            items-center gap-1.5
                            whitespace-nowrap
                            rounded-full
                            px-3 py-1.5
                            text-xs
                            transition-all
                          `,
                          isActive
                            ? 'bg-card font-semibold text-primary'
                            : 'bg-background/5 text-primary/60 hover:bg-card/10 hover:text-primary'
                        )}>
                        <Icon className="size-3.5" />

                        <span>
                          {
                            group.label
                          }
                        </span>

                        {group.indicator ? (
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              group.indicator ===
                                'live'
                                ? 'bg-emerald-400'
                                : group.indicator ===
                                      'new'
                                  ? 'bg-violet-400'
                                  : group.indicator ===
                                        'spark'
                                    ? 'bg-amber-400'
                                    : 'bg-primary/50'
                            )}
                          />
                        ) : null}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                title="Scroll groups right"
                aria-label="Scroll groups right"
                onClick={() =>
                  scrollTabs(
                    'right'
                  )
                }
                className="
                  grid size-8 shrink-0
                  place-items-center
                  rounded-full
                  bg-background/5
                  text-primary/60
                  transition
                  hover:bg-background/10
                  hover:text-primary
                ">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {children ?? (
          <div
            className="
              h-full overflow-x-hidden
              overflow-y-auto
              overscroll-y-contain
              [scrollbar-gutter:stable]
            ">
            <div className="w-full p-2.5 pb-20 md:p-3">
              <DiscoveryHubRenderer />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
