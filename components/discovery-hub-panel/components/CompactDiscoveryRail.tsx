'use client';

import { Compass, PanelRightOpen } from 'lucide-react';

import { cn } from '@/lib/utils';

import { DiscoveryHubIcon } from '../discoveryHubIconRegistry';

import type { CompactDiscoveryItem, CompactDiscoveryItemTone } from '../discoveryHubTypes';

type CompactDiscoveryRailProps = {
  items: CompactDiscoveryItem[];
  onExpand: () => void;
  onSelectItem: (item: CompactDiscoveryItem) => void;
};

const toneMap: Record<CompactDiscoveryItemTone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  violet: 'bg-violet-500/10 text-violet-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500'
};

export default function CompactDiscoveryRail({
  items,
  onExpand,
  onSelectItem
}: CompactDiscoveryRailProps) {
  return (
    <section className="flex h-full min-h-0 flex-col items-center rounded-lg border border-primary/10 bg-card/70 px-2 py-3 shadow-sm backdrop-blur-xl">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand Discovery Hub"
        title="Discovery Hub"
        className="group grid size-11 shrink-0 place-items-center rounded-2xl border border-border/70 bg-background/90 text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <span className="relative">
          <Compass className="size-5 transition group-hover:rotate-12" />
          <PanelRightOpen className="absolute -bottom-1.5 -right-2 size-3 rounded-full bg-background" />
        </span>
      </button>

      <div className="my-3 h-px w-8 shrink-0 bg-border/70" />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain scrollbar-none">
        {items.slice(0, 8).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item)}
            aria-label={`${item.label}: ${item.value}`}
            title={`${item.label}: ${item.value}`}
            className={cn(
              'relative grid size-11 place-items-center rounded-2xl border border-transparent transition',
              'hover:-translate-y-0.5 hover:border-border/70 hover:bg-background hover:shadow-sm',
              toneMap[item.tone]
            )}>
            <DiscoveryHubIcon iconKey={item.icon} className="size-4" />
            {item.active ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
