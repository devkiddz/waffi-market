'use client';

import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';

import { useFeedExperience } from '@/features/feed-experience';

import { cn } from '@/lib/utils';

import type { HubAction, HubWidget } from '../discoveryHubTypes';

import HubMap from './HubMap';
import HubSlider from './HubSlider';

type HubCardProps = {
  widget: HubWidget;
};

const statusStyles = {
  idle: 'bg-background/12 text-primary',
  active: 'bg-primary/10 text-primary',
  warning: 'bg-accent/15 text-accent',
  success: 'bg-secondary/12 text-secondary'
};

const layoutStyles: Record<NonNullable<HubWidget['layout']>, string> = {
  summary: 'p-5',
  membership: 'p-5',
  tracking: 'p-5',

  hero: 'min-h-[32rem] p-5 md:min-h-[36rem]',

  grid: 'min-h-[35rem] p-5',

  'minimal-grid': 'min-h-[22rem] p-5',

  slider: 'min-h-[15rem] p-5'
};

function hasActionDestination(action: HubAction): boolean {
  return Boolean(action.target || action.href?.trim());
}

export default function HubCard({ widget }: HubCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { actions } = useFeedExperience();

  const layout = widget.layout ?? 'summary';

  const widgetActions = (
    widget.actions?.length ? widget.actions : widget.action ? [widget.action] : []
  ).filter(hasActionDestination);

  const runWidgetAction = (action: HubAction): void => {
    /*
     * Experience targets remain the primary
     * Discovery Hub navigation mechanism.
     */
    if (action.target) {
      actions.openExperience(action.target);

      return;
    }

    const href = action.href?.trim();

    if (!href) {
      return;
    }

    /*
     * Scroll to an element inside the current
     * feed or Discovery Hub workspace.
     */
    if (href.startsWith('#')) {
      const elementId = href.slice(1).trim();

      if (!elementId) {
        return;
      }

      const targetElement = document.getElementById(decodeURIComponent(elementId));

      targetElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      return;
    }

    /*
     * Preserve the current pathname for
     * query-only destinations.
     *
     * Example:
     * ?category=wines
     */
    if (href.startsWith('?')) {
      router.push(`${pathname}${href}`);

      return;
    }

    /*
     * Handle absolute URLs safely.
     *
     * Same-origin URLs remain inside the
     * Next.js router. External URLs use
     * normal browser navigation.
     */
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const destination = new URL(href);

      if (destination.origin === window.location.origin) {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);

        return;
      }

      window.location.assign(destination.href);

      return;
    }

    /*
     * Support both:
     *
     * /cart
     * cart
     * store?category=wines
     */
    const internalHref = href.startsWith('/') ? href : `/${href}`;

    router.push(internalHref);
  };

  const renderWidgetActions = (className?: string) => {
    if (!widgetActions.length) {
      return null;
    }

    return (
      <div className={cn('mt-4 flex flex-wrap gap-2', className)}>
        {widgetActions.map((action, index) => (
          <button
            key={`${action.label}:${action.href ?? action.target?.type ?? 'action'}:${index}`}
            type="button"
            onClick={() => runWidgetAction(action)}
            className="
                inline-flex items-center
                gap-2 rounded-full
                border border-primary/12
                bg-background/50
                px-4 py-2
                text-xs font-semibold
                text-primary
                transition
                hover:bg-primary
                hover:text-background
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/40
              ">
            {action.label}

            <ArrowRight className="size-3" />
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // HERO LAYOUT
  // ============================================================

  if (layout === 'hero') {
    return (
      <div className="w-full min-w-0">
        {widget.slides?.length ? (
          <HubSlider
            items={widget.slides}
            autoSlide={widget.autoSlide ?? true}
            variant="hero"
          />
        ) : null}

        {renderWidgetActions('px-1')}
      </div>
    );
  }

  // ============================================================
  // STANDARD LAYOUTS
  // ============================================================

  return (
    <article
      data-layout={layout}
      className={cn(
        `
          overflow-hidden rounded-3xl
          border border-primary/12
          bg-card/40
          shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.25)]
          transition duration-300
          hover:border-primary/20
          hover:bg-card/60
        `,
        layoutStyles[layout],
        widget.accent && `bg-gradient-to-br ${widget.accent}`
      )}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            `
              rounded-full
              px-2.5 py-1
              text-[12px] font-semibold
              uppercase tracking-wide
            `,
            widget.status ? statusStyles[widget.status] : statusStyles.idle
          )}>
          {widget.meta ?? widget.groupId}
        </span>

        {widget.badge ? (
          <span className="rounded-full bg-background/40 px-2.5 py-1 text-[12px] font-semibold text-accent">
            {widget.badge}
          </span>
        ) : null}
      </div>

      <h3 className="text-sm font-semibold tracking-tight text-primary">{widget.title}</h3>

      {widget.description ? (
        <p className="mt-2 text-sm leading-5 text-primary/55">{widget.description}</p>
      ) : null}

      {/* ========================================================
          MEMBERSHIP
      ======================================================== */}

      {layout === 'membership' ? (
        <div className="mt-4 rounded-2xl border border-amber-300/15 bg-background/45 p-4">
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">
              SHELSEA
            </p>

            <h4 className="mt-3 text-lg font-bold text-primary">Gold Member</h4>

            <p className="mt-1 text-xs text-primary/50">Premium rewards status</p>
          </div>

          {widget.stats?.length ? (
            <div className="grid grid-cols-3 gap-2">
              {widget.stats.map(stat => (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-xl border border-primary/10 bg-background/35 px-2 py-3 text-center">
                  <p className="truncate text-[10px] font-medium uppercase tracking-wide text-primary/45">
                    {stat.label}
                  </p>

                  <p className="mt-1 text-base font-bold text-primary">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ========================================================
          STATS
      ======================================================== */}

      {layout !== 'membership' && widget.stats?.length ? (
        <div className="mt-4 grid grid-cols-3 divide-x divide-primary/12 border-t border-primary/25">
          {widget.stats.map(stat => (
            <div key={stat.label} className="min-w-0 px-3 py-3 first:pl-0 last:pr-0">
              <p className="truncate text-[11px] font-medium text-accent">{stat.label}</p>

              <p className="mt-1 text-sm font-bold text-accent">{stat.value}</p>

              {stat.helper ? (
                <p className="mt-0.5 truncate text-[11px] text-primary/45">{stat.helper}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* ========================================================
          TRACKING
      ======================================================== */}

      {layout === 'tracking' && widget.location ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-primary/25 bg-background">
          {widget.location.coordinates ? (
            <HubMap lat={widget.location.coordinates.lat} lng={widget.location.coordinates.lng} />
          ) : null}

          <div className="p-3">
            <p className="text-xs font-semibold text-primary">{widget.location.title}</p>

            {widget.location.subtitle ? (
              <p className="mt-0.5 text-[11px] text-primary/55">{widget.location.subtitle}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ========================================================
          PROGRESS
      ======================================================== */}

      {widget.progress ? (
        <div className="mt-4 rounded-xl bg-background/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-primary/70">{widget.progress.label}</p>

            <p className="text-[11px] font-bold text-primary">{widget.progress.value}%</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-accent shadow-[0_0_18px_hsl(var(--accent)/0.45)] transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, widget.progress.value))}%`
              }}
            />
          </div>

          {widget.progress.helper ? (
            <p className="mt-2 text-[12px] text-primary/45">{widget.progress.helper}</p>
          ) : null}
        </div>
      ) : null}

      {/* ========================================================
          TIMELINE
      ======================================================== */}

      {widget.timeline?.length ? (
        <div className="mt-4 space-y-3 rounded-xl bg-background/35 p-3">
          {widget.timeline.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              ) : (
                <Circle
                  className={cn('mt-0.5 size-4 shrink-0', item.active ? 'text-accent' : 'text-primary/25')}
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary">{item.label}</p>

                {item.time ? <p className="mt-0.5 text-[12px] text-primary/45">{item.time}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ========================================================
          CONDITIONS
      ======================================================== */}

      {widget.conditions?.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {widget.conditions.map(condition => (
            <div key={condition.label} className="rounded-xl bg-background/35 p-2">
              <p className="text-[12px] text-accent">{condition.label}</p>

              <p className="mt-1 text-[11px] font-semibold text-primary">{condition.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* ========================================================
          SLIDES
      ======================================================== */}

      {widget.slides?.length ? (
        <HubSlider
          items={widget.slides}
          autoSlide={widget.autoSlide}
          variant={layout === 'grid' ? 'grid' : layout === 'minimal-grid' ? 'minimal-grid' : 'strip'}
        />
      ) : null}

      {/* ========================================================
          INSIGHT
      ======================================================== */}

      {widget.insight ? (
        <p className="mt-4 rounded-xl border border-primary/12 bg-background/40 p-3 text-xs leading-5 text-primary/70">
          {widget.insight}
        </p>
      ) : null}

      {renderWidgetActions()}
    </article>
  );
}
