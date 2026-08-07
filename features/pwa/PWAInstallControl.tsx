'use client';

import { Download, RefreshCcw, Share2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePWARuntime } from './PWARuntimeProvider';

type PWAInstallControlProps = {
  presentation?: 'navbar' | 'account-sheet' | 'sidebar';
};

export function PWAInstallControl({ presentation = 'navbar' }: PWAInstallControlProps) {
  const {
    installMode,
    isStandalone,
    installAvailable,
    updateReady,
    install,
    shareCurrentExperience,
    applyUpdate
  } = usePWARuntime();

  const visible = updateReady || isStandalone || installAvailable;

  if (!visible) {
    return null;
  }

  const action = updateReady
    ? () => void applyUpdate()
    : isStandalone
      ? () => void shareCurrentExperience()
      : () => void install();

  const Icon = updateReady ? RefreshCcw : isStandalone ? Share2 : Download;

  const label = updateReady
    ? 'Update Shelsea'
    : isStandalone
      ? 'Share experience'
      : installMode === 'beta'
        ? 'Install Shelsea Beta'
        : 'Install Shelsea';

  const title = updateReady
    ? 'Apply the latest Shelsea update'
    : isStandalone
      ? 'Share this Shelsea experience'
      : label;

  const expanded = presentation !== 'navbar';

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={action}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center gap-2 border text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        expanded
          ? ['h-12 w-full', 'justify-start', 'rounded-2xl', 'px-4']
          : ['h-10', 'rounded-full', 'px-3'],
        updateReady
          ? [
              'border-amber-500/30',
              'bg-amber-500/10',
              'text-amber-700',
              'hover:bg-amber-500/15',
              'dark:text-amber-300'
            ]
          : ['border-border/70', 'bg-background/60', 'text-foreground', 'backdrop-blur-xl', 'hover:bg-muted']
      )}>
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full',
          updateReady ? 'bg-amber-500/15' : 'bg-muted/80'
        )}>
        <Icon className={cn('size-4', updateReady && 'animate-pulse')} />
      </span>

      <span className={cn('whitespace-nowrap', expanded ? 'inline' : 'hidden sm:inline')}>{label}</span>

      {expanded ? (
        <span className="ml-auto text-[10px] font-medium text-muted-foreground">
          {updateReady ? 'Ready' : isStandalone ? 'System share' : 'Available'}
        </span>
      ) : null}

      {updateReady ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-amber-500"
        />
      ) : null}
    </button>
  );
}
