'use client';

import {
  Bell,
  BellOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Truck
} from 'lucide-react';
import {
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import type {
  NotificationCenterSnapshot,
  NotificationPreferences
} from '../notificationTypes';

type PreferenceKey = Exclude<
  keyof NotificationPreferences,
  'mutedUntil'
>;

type NotificationSettingsPanelProps = {
  initialSnapshot: NotificationCenterSnapshot;
};

const preferenceRows: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
}> = [
  {
    key: 'inAppEnabled',
    title: 'In-app notifications',
    description: 'Master control for the trusted notification centre.'
  },
  {
    key: 'orderUpdates',
    title: 'Order updates',
    description: 'Confirmed, processing, ready, dispatched and final order states.'
  },
  {
    key: 'deliveryUpdates',
    title: 'Delivery updates',
    description: 'Assignment, movement, arrival and delivery exceptions.'
  },
  {
    key: 'shoppingListUpdates',
    title: 'Shopping List updates',
    description: 'Publication review and future preparation progress.'
  },
  {
    key: 'supportUpdates',
    title: 'Support updates',
    description: 'Verified replies and status changes from Customer Care.'
  },
  {
    key: 'communicationUpdates',
    title: 'Inbox messages',
    description: 'Customer and vendor marketplace conversation alerts.'
  },
  {
    key: 'systemUpdates',
    title: 'Important system updates',
    description: 'Account or commerce information that Shelsea must surface.'
  },
  {
    key: 'promotionUpdates',
    title: 'Promotion updates',
    description: 'Optional approved offers. Disabled by default.'
  }
];

export function NotificationSettingsPanel({
  initialSnapshot
}: NotificationSettingsPanelProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const patch = (body: Record<string, unknown>) => {
    setSaved(false);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/notifications?workspaceId=${encodeURIComponent(snapshot.workspaceId)}&limit=10`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            cache: 'no-store',
            body: JSON.stringify(body)
          }
        );

        if (!response.ok) {
          throw new Error('Unable to save notification preferences.');
        }

        const nextSnapshot =
          (await response.json()) as NotificationCenterSnapshot;

        setSnapshot(nextSnapshot);
        setError(null);
        setSaved(true);
      } catch (cause) {
        console.error('Notification preference update failed.', cause);
        setError('Your notification preferences could not be saved.');
      }
    });
  };

  const toggle = (key: PreferenceKey) => {
    patch({
      action: 'update-preferences',
      preferences: {
        [key]: !snapshot.preferences[key]
      }
    });
  };

  const pauseUntil = (date: Date | null) => {
    patch({
      action: 'update-preferences',
      preferences: {
        mutedUntil: date?.toISOString() ?? null
      }
    });
  };

  const mutedUntil = snapshot.preferences.mutedUntil
    ? new Date(snapshot.preferences.mutedUntil)
    : null;
  const activelyMuted = Boolean(mutedUntil && mutedUntil > new Date());

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-200">
              <Bell className="size-5" />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                Notification controls
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Control verified in-app updates.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Shelsea now persists operational notifications. Browser push permission and background delivery are intentionally not represented as active.
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {saved ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Preferences saved.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <h2 className="font-black">Notification topics</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Urgent operational updates may bypass a temporary mute, but never bypass the master in-app setting.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-border/60">
              {preferenceRows.map(row => {
                const checked = snapshot.preferences[row.key];
                const disabled =
                  row.key !== 'inAppEnabled' &&
                  !snapshot.preferences.inAppEnabled;

                return (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold">{row.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {row.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      disabled={isPending || disabled}
                      onClick={() => toggle(row.key)}
                      className={cn(
                        'relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40',
                        checked ? 'bg-primary' : 'bg-muted'
                      )}>
                      <span
                        className={cn(
                          'absolute top-1 size-5 rounded-full bg-white shadow-sm transition',
                          checked ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  {activelyMuted ? (
                    <BellOff className="size-4" />
                  ) : (
                    <Clock3 className="size-4" />
                  )}
                </span>
                <div>
                  <h2 className="text-sm font-black">Temporary pause</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activelyMuted && mutedUntil
                      ? `Paused until ${mutedUntil.toLocaleString('en-NG')}`
                      : 'Notifications are not paused.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <PauseButton
                  disabled={isPending}
                  onClick={() =>
                    pauseUntil(new Date(Date.now() + 60 * 60 * 1000))
                  }>
                  Pause for 1 hour
                </PauseButton>
                <PauseButton
                  disabled={isPending}
                  onClick={() =>
                    pauseUntil(new Date(Date.now() + 8 * 60 * 60 * 1000))
                  }>
                  Pause for 8 hours
                </PauseButton>
                <PauseButton
                  disabled={isPending}
                  onClick={() =>
                    pauseUntil(new Date(Date.now() + 24 * 60 * 60 * 1000))
                  }>
                  Pause for 24 hours
                </PauseButton>
                {activelyMuted ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => pauseUntil(null)}
                    className="h-10 rounded-full bg-foreground px-4 text-xs font-bold text-background disabled:opacity-40">
                    Resume notifications
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
              <Smartphone className="size-5 text-primary" />
              <h2 className="mt-4 text-sm font-black">Delivery channels</h2>
              <div className="mt-4 space-y-3">
                <Channel
                  icon={PackageCheck}
                  title="In-app centre"
                  status="Active"
                  description="Stored in PostgreSQL and loaded with no-store requests."
                />
                <Channel
                  icon={Truck}
                  title="Browser push"
                  status="Not implemented"
                  description="No permission prompt, subscription or background delivery is claimed."
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
              <BellOff className="size-5 text-primary" />
              <h2 className="mt-4 text-sm font-black">Muted activities</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Routine updates from these specific orders, lists or support threads are paused. Urgent exceptions can still appear.
              </p>

              <div className="mt-4 space-y-2">
                {snapshot.mutes.map(mute => (
                  <div
                    key={mute.scopeKey}
                    className="rounded-2xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">
                          {mute.topic.replaceAll('_', ' ')} · {mute.targetId ?? mute.scopeKey}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                          {mute.mutedUntil
                            ? `Muted until ${new Date(mute.mutedUntil).toLocaleString('en-NG')}`
                            : 'Muted until you restore it.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          patch({
                            action: 'unmute-scope',
                            scopeKey: mute.scopeKey
                          })
                        }
                        className="h-8 shrink-0 rounded-full border border-border px-3 text-[10px] font-bold transition hover:bg-muted disabled:opacity-40">
                        Restore
                      </button>
                    </div>
                  </div>
                ))}

                {!snapshot.mutes.length ? (
                  <p className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    No activity-specific mutes.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function PauseButton({
  disabled,
  onClick,
  children
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-10 rounded-full border border-border px-4 text-xs font-bold transition hover:bg-muted disabled:opacity-40">
      {children}
    </button>
  );
}

function Channel({
  icon: Icon,
  title,
  status,
  description
}: {
  icon: typeof PackageCheck;
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-primary" />
        <p className="text-xs font-bold">{title}</p>
        <span className="ml-auto rounded-full bg-muted px-2 py-1 text-[9px] font-black">
          {status}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
