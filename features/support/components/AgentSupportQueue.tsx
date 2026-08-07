'use client';

import {
  AlertTriangle,
  BookOpenCheck,
  BrainCircuit,
  Headphones,
  RefreshCw,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useMemo,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import {
  SUPPORT_CASE_STATUSES
} from '../supportTypes';
import type {
  SupportCaseStatusValue,
  SupportQueueSnapshot
} from '../supportTypes';

type AgentSupportQueueProps = {
  initialSnapshot: SupportQueueSnapshot;
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

export function AgentSupportQueue({
  initialSnapshot
}: AgentSupportQueueProps) {
  const router = useRouter();

  const [snapshot, setSnapshot] =
    useState(initialSnapshot);
  const [query, setQuery] = useState('');
  const [status, setStatus] =
    useState<SupportCaseStatusValue | 'ALL'>(
      'ALL'
    );
  const [error, setError] =
    useState<string | null>(null);
  const [isPending, startTransition] =
    useTransition();

  const visible = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    return snapshot.cases.filter(item => {
      if (
        status !== 'ALL' &&
        item.status !== status
      ) {
        return false;
      }

      if (!normalized) return true;

      return [
        item.caseNumber,
        item.subject,
        item.customer.name,
        item.customer.email,
        item.order?.orderNumber,
        item.assignedAgent?.name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, snapshot.cases, status]);

  const refresh = () => {
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/admin/support/cases?limit=200',
          {
            credentials: 'same-origin',
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Shelsea could not refresh the Support queue.'
          );
        }

        setSnapshot(
          (await response.json()) as
            SupportQueueSnapshot
        );
        setError(null);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not refresh the Support queue.'
        );
      }
    });
  };

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                Service Operations
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                Support queue
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Triage, assign and resolve customer cases while preserving conversation and commerce context.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/admin/support/operations"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-950">
                  <BrainCircuit className="size-3.5" />
                  Operations & Intelligence
                </Link>
                <Link
                  href="/admin/support/analytics"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-black text-white">
                  Analytics & Audit
                </Link>
                <Link
                  href="/admin/support/knowledge"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-black text-white">
                  <BookOpenCheck className="size-3.5" />
                  Knowledge Studio
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="New"
                value={snapshot.counts.NEW}
              />
              <Metric
                label="Assigned"
                value={
                  snapshot.counts.ASSIGNED
                }
              />
              <Metric
                label="Active"
                value={
                  snapshot.counts.IN_PROGRESS
                }
              />
              <Metric
                label="Urgent"
                value={
                  snapshot.cases.filter(
                    item =>
                      item.priority ===
                      'URGENT'
                  ).length
                }
              />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event =>
                setQuery(event.target.value)
              }
              placeholder="Search case, customer, agent or order"
              className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm"
            />
          </label>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            <FilterButton
              active={status === 'ALL'}
              label="All"
              onClick={() =>
                setStatus('ALL')
              }
            />
            {SUPPORT_CASE_STATUSES.map(
              value => (
                <FilterButton
                  key={value}
                  active={status === value}
                  label={value.replaceAll(
                    '_',
                    ' '
                  )}
                  onClick={() =>
                    setStatus(value)
                  }
                />
              )
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-bold hover:bg-muted disabled:opacity-50">
            <RefreshCw
              className={cn(
                'size-3.5',
                isPending && 'animate-spin'
              )}
            />
            Refresh
          </button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3">
          {visible.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                router.push(
                  `/admin/support/${encodeURIComponent(
                    item.id
                  )}`
                )
              }
              className={cn(
                'flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-card sm:p-5',
                item.priority === 'URGENT'
                  ? 'border-rose-500/25 bg-rose-500/[0.045]'
                  : 'border-border/60 bg-card/70'
              )}>
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-2xl',
                  item.priority === 'URGENT'
                    ? 'bg-rose-500 text-white'
                    : 'bg-primary/10 text-primary'
                )}>
                {item.priority === 'URGENT' ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Headphones className="size-4" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm sm:text-base">
                    {item.subject}
                  </strong>
                  <Badge>
                    {item.caseNumber}
                  </Badge>
                  <Badge>
                    {item.status.replaceAll(
                      '_',
                      ' '
                    )}
                  </Badge>
                  <Badge>
                    {item.priority}
                  </Badge>
                </span>

                <span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>

                <span className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span>
                    {item.customer.name}
                  </span>
                  {item.order ? (
                    <span>
                      Order{' '}
                      {item.order.orderNumber}
                    </span>
                  ) : null}
                  <span>
                    {item.assignedAgent
                      ? `Agent: ${item.assignedAgent.name}`
                      : 'Unassigned'}
                  </span>
                  <span>
                    {dateFormatter.format(
                      new Date(item.updatedAt)
                    )}
                  </span>
                </span>
              </span>
            </button>
          ))}

          {!visible.length ? (
            <div className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/45 p-8 text-center">
              <div>
                <Headphones className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-base font-black">
                  No matching cases
                </h2>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function FilterButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 shrink-0 rounded-full px-3 text-[10px] font-bold transition',
        active
          ? 'bg-foreground text-background'
          : 'border border-border bg-background text-muted-foreground'
      )}>
      {label}
    </button>
  );
}

function Badge({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-[9px] font-black text-muted-foreground">
      {children}
    </span>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}
