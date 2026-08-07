'use client';

import {
  LoaderCircle,
  Radio,
  WifiOff
} from 'lucide-react';

import {
  cn
} from '@/lib/utils';

import type {
  SupportLiveConnectionState
} from '../client/useSupportLiveCase';

type SupportLiveStatusBadgeProps = {
  state: SupportLiveConnectionState;
  error?: string | null;
};

const labels:
  Record<
    SupportLiveConnectionState,
    string
  > = {
    connecting:
      'Connecting',
    live:
      'Live',
    reconnecting:
      'Reconnecting',
    offline:
      'Offline'
  };

export function SupportLiveStatusBadge({
  state,
  error
}: SupportLiveStatusBadgeProps) {
  const title =
    error ??
    (
      state === 'live'
        ? 'Support messages update automatically.'
        : state ===
            'offline'
          ? 'Live updates are unavailable. Saved messages remain available.'
          : 'Shelsea is restoring the live Support connection.'
    );

  return (
    <span
      title={
        title
      }
      aria-live="polite"
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold',
        state === 'live'
          ? 'border-primary/25 bg-primary/10 text-primary dark:text-primary'
          : state ===
              'offline'
            ? 'border-destructive/25 bg-destructive/10 text-destructive'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      )}>
      {state ===
      'live' ? (
        <Radio className="size-3.5" />
      ) : state ===
        'offline' ? (
        <WifiOff className="size-3.5" />
      ) : (
        <LoaderCircle className="size-3.5 animate-spin" />
      )}

      {
        labels[state]
      }
    </span>
  );
}
