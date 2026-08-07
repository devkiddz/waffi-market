'use client';

import {
  Archive,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Headphones,
  ListChecks,
  PackageCheck,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useMemo,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import type {
  NotificationCenterSnapshot,
  NotificationItem,
  NotificationTopicValue
} from '../notificationTypes';

type NotificationFilter = 'all' | 'unread';

type NotificationCenterProps = {
  initialSnapshot: NotificationCenterSnapshot;
};

function iconForTopic(topic: NotificationTopicValue) {
  if (topic === 'ORDER') return PackageCheck;
  if (topic === 'DELIVERY') return Truck;
  if (topic === 'SHOPPING_LIST') return ListChecks;
  if (topic === 'SUPPORT') return Headphones;
  if (topic === 'PROMOTION') return BellRing;
  return ShieldCheck;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function NotificationCenter({
  initialSnapshot
}: NotificationCenterProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleItems = useMemo(
    () =>
      filter === 'unread'
        ? snapshot.items.filter(item => !item.readAt)
        : snapshot.items,
    [filter, snapshot.items]
  );

  const mutedScopes = useMemo(
    () => new Set(snapshot.mutes.map(mute => mute.scopeKey)),
    [snapshot.mutes]
  );

  const request = async (
    body?: Record<string, unknown>
  ): Promise<NotificationCenterSnapshot> => {
    const response = await fetch(
      `/api/notifications?workspaceId=${encodeURIComponent(snapshot.workspaceId)}&limit=100`,
      {
        method: body ? 'PATCH' : 'GET',
        headers: body
          ? {
              'Content-Type': 'application/json'
            }
          : undefined,
        credentials: 'same-origin',
        cache: 'no-store',
        body: body ? JSON.stringify(body) : undefined
      }
    );

    if (!response.ok) {
      throw new Error('Shelsea could not update the notification centre.');
    }

    return (await response.json()) as NotificationCenterSnapshot;
  };

  const run = (
    body?: Record<string, unknown>,
    after?: () => void,
    afterError?: () => void
  ) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const nextSnapshot = await request(body);
        setSnapshot(nextSnapshot);
        setError(null);
        after?.();
      } catch (cause) {
        console.error('Notification centre action failed.', cause);
        setError(
          'The notification centre could not be refreshed. Your existing view has been preserved.'
        );
        afterError?.();
      }
    });
  };

  const openNotification = (item: NotificationItem) => {
    const navigate = () => {
      if (item.href) {
        router.push(item.href);
      }
    };

    if (!item.readAt) {
      run(
        {
          action: 'mark-read',
          notificationId: item.id
        },
        navigate,
        navigate
      );
      return;
    }

    navigate();
  };

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-200">
                <Bell className="size-5" />
              </span>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                  Trusted notification centre
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  Verified updates from your Shelsea activity.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  These are database-backed in-app notifications. Browser push delivery is not claimed or enabled in this milestone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Metric label="Unread" value={snapshot.unreadCount} />
              <Metric label="Active" value={snapshot.totalCount} />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}>
              All updates
            </FilterButton>

            <FilterButton
              active={filter === 'unread'}
              onClick={() => setFilter('unread')}>
              Unread ({snapshot.unreadCount})
            </FilterButton>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run()}
              disabled={isPending}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-bold transition hover:bg-muted disabled:opacity-50">
              <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                run({
                  action: 'mark-all-read'
                })
              }
              disabled={isPending || snapshot.unreadCount === 0}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition disabled:opacity-40">
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>

            <button
              type="button"
              onClick={() => router.push('/settings/notifications')}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-bold transition hover:bg-muted">
              <Settings2 className="size-3.5" />
              Preferences
            </button>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <BellOff className="mt-0.5 size-4 shrink-0" />
            <p>{notice}</p>
          </div>
        ) : null}

        <section className="space-y-3" aria-live="polite">
          {visibleItems.map(item => {
            const Icon = iconForTopic(item.topic);
            const unread = !item.readAt;

            return (
              <article
                key={item.id}
                className={cn(
                  'group rounded-[1.5rem] border p-4 shadow-sm transition sm:p-5',
                  unread
                    ? 'border-primary/25 bg-primary/[0.045]'
                    : 'border-border/60 bg-card/75'
                )}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-2xl',
                      unread
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                    <Icon className="size-4" />
                  </span>

                  <button
                    type="button"
                    onClick={() => openNotification(item)}
                    className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-primary/80">
                        {item.topic.replaceAll('_', ' ')}
                      </span>

                      {unread ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary">
                          NEW
                        </span>
                      ) : null}

                      {item.priority === 'URGENT' || item.priority === 'HIGH' ? (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-black text-rose-600">
                          {item.priority}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-2 text-sm font-black sm:text-base">
                      {item.title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                      {item.message}
                    </p>

                    <p className="mt-3 text-[10px] text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.scopeKey ? (
                      <button
                        type="button"
                        title={
                          mutedScopes.has(item.scopeKey)
                            ? 'Routine updates for this activity are muted'
                            : 'Mute routine updates for this activity'
                        }
                        aria-label={`Mute routine updates for ${item.title}`}
                        onClick={() => {
                          if (mutedScopes.has(item.scopeKey!)) return;

                          run(
                            {
                              action: 'mute-scope',
                              scopeKey: item.scopeKey,
                              topic: item.topic,
                              targetType: item.targetType,
                              targetId: item.targetId,
                              reason: `Muted from notification ${item.id}`
                            },
                            () =>
                              setNotice(
                                'Routine updates for this activity are muted. Urgent exceptions may still appear.'
                              )
                          );
                        }}
                        disabled={isPending || mutedScopes.has(item.scopeKey)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40">
                        <BellOff className="size-3.5" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      title="Archive notification"
                      aria-label={`Archive ${item.title}`}
                      onClick={() =>
                        run({
                          action: 'archive',
                          notificationId: item.id
                        })
                      }
                      disabled={isPending}
                      className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40">
                      <Archive className="size-3.5" />
                    </button>

                    {item.href ? (
                      <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {!visibleItems.length ? (
            <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/45 p-8 text-center">
              <div>
                <Bell className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-base font-black">
                  {filter === 'unread'
                    ? 'Everything has been read'
                    : 'No verified notifications yet'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  Order, delivery, Shopping List and support events will appear here only when the related operation actually occurs.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-full px-4 text-xs font-bold transition',
        active
          ? 'bg-foreground text-background'
          : 'border border-border bg-background hover:bg-muted'
      )}>
      {children}
    </button>
  );
}
