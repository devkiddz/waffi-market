'use client';

import {
  CircleHelp,
  Headphones,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useMemo,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import {
  SUPPORT_CASE_CATEGORIES,
  SUPPORT_CASE_PRIORITIES
} from '../supportTypes';
import type {
  SupportCaseCategoryValue,
  SupportCaseListSnapshot,
  SupportCasePriorityValue
} from '../supportTypes';

export type SupportOrderOption = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryId: string | null;
};

type CustomerSupportWorkspaceProps = {
  initialSnapshot: SupportCaseListSnapshot;
  orders: SupportOrderOption[];
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

export function CustomerSupportWorkspace({
  initialSnapshot,
  orders
}: CustomerSupportWorkspaceProps) {
  const router = useRouter();

  const [snapshot, setSnapshot] =
    useState(initialSnapshot);
  const [query, setQuery] = useState('');
  const [composeOpen, setComposeOpen] =
    useState(false);
  const [category, setCategory] =
    useState<SupportCaseCategoryValue>(
      'ORDER'
    );
  const [priority, setPriority] =
    useState<SupportCasePriorityValue>(
      'NORMAL'
    );
  const [orderId, setOrderId] =
    useState('');
  const [subject, setSubject] =
    useState('');
  const [description, setDescription] =
    useState('');
  const [error, setError] =
    useState<string | null>(null);
  const [isPending, startTransition] =
    useTransition();

  const visibleCases = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return snapshot.cases;
    }

    return snapshot.cases.filter(item =>
      [
        item.caseNumber,
        item.subject,
        item.description,
        item.status,
        item.category,
        item.order?.orderNumber
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, snapshot.cases]);

  const refresh = () => {
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/support/cases?limit=100',
          {
            credentials: 'same-origin',
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Shelsea could not refresh Support.'
          );
        }

        setSnapshot(
          (await response.json()) as
            SupportCaseListSnapshot
        );
        setError(null);
      } catch (cause) {
        console.error(
          'Customer Support refresh failed.',
          cause
        );
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not refresh Support.'
        );
      }
    });
  };

  const createCase = () => {
    if (
      !subject.trim() ||
      !description.trim()
    ) {
      setError(
        'Enter a subject and describe what happened.'
      );
      return;
    }

    startTransition(async () => {
      try {
        const selectedOrder =
          orders.find(
            item => item.id === orderId
          ) ?? null;

        const response = await fetch(
          '/api/support/cases',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            credentials: 'same-origin',
            cache: 'no-store',
            body: JSON.stringify({
              category,
              priority,
              subject,
              description,
              orderId:
                selectedOrder?.id ?? null,
              deliveryId:
                selectedOrder?.deliveryId ??
                null
            })
          }
        );

        const payload =
          (await response.json()) as
            | { id: string }
            | { error?: string };

        if (!response.ok || !('id' in payload)) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Shelsea could not create the Support Case.'
          );
        }

        setComposeOpen(false);
        setSubject('');
        setDescription('');
        setOrderId('');
        setError(null);

        router.push(
          `/support/${encodeURIComponent(
            payload.id
          )}`
        );
      } catch (cause) {
        console.error(
          'Support Case creation failed.',
          cause
        );
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not create the Support Case.'
        );
      }
    });
  };

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-200">
                <Headphones className="size-5" />
              </span>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                  Shelsea Support
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  Help that keeps its context.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  Create a case, attach an order and continue the same protected conversation until the resolution is confirmed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Cases"
                value={snapshot.totalCount}
              />
              <Metric
                label="Open"
                value={
                  snapshot.cases.filter(
                    item =>
                      item.status !== 'CLOSED'
                  ).length
                }
              />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event =>
                setQuery(event.target.value)
              }
              placeholder="Search case number, order or subject"
              className="h-11 w-full rounded-full border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-bold hover:bg-muted disabled:opacity-50">
            <RefreshCw
              className={cn(
                'size-3.5',
                isPending && 'animate-spin'
              )}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              setComposeOpen(current => !current)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs font-bold text-background">
            <Plus className="size-3.5" />
            {composeOpen
              ? 'Close form'
              : 'Create Support Case'}
          </button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {composeOpen ? (
          <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CircleHelp className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-black">
                  What happened?
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Use a clear subject and include the facts the Support team needs.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <select
                  value={category}
                  onChange={event =>
                    setCategory(
                      event.target.value as
                        SupportCaseCategoryValue
                    )
                  }
                  className={inputClass}>
                  {SUPPORT_CASE_CATEGORIES.map(
                    value => (
                      <option
                        key={value}
                        value={value}>
                        {value.replaceAll(
                          '_',
                          ' '
                        )}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={priority}
                  onChange={event =>
                    setPriority(
                      event.target.value as
                        SupportCasePriorityValue
                    )
                  }
                  className={inputClass}>
                  {SUPPORT_CASE_PRIORITIES.map(
                    value => (
                      <option
                        key={value}
                        value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Related order">
                <select
                  value={orderId}
                  onChange={event =>
                    setOrderId(
                      event.target.value
                    )
                  }
                  className={inputClass}>
                  <option value="">
                    No order selected
                  </option>
                  {orders.map(order => (
                    <option
                      key={order.id}
                      value={order.id}>
                      {order.orderNumber} ·{' '}
                      {order.status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <input
                  value={subject}
                  maxLength={180}
                  onChange={event =>
                    setSubject(
                      event.target.value
                    )
                  }
                  placeholder="Brief summary"
                  className={inputClass}
                />
              </Field>

              <label className="space-y-2 text-xs font-bold md:col-span-2">
                <span>Description</span>
                <textarea
                  value={description}
                  maxLength={6000}
                  onChange={event =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe what happened, when it happened and what outcome you need."
                  className="min-h-40 w-full resize-y rounded-2xl border border-border bg-background p-3 text-sm font-normal leading-6"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={createCase}
                  disabled={
                    isPending ||
                    !subject.trim() ||
                    !description.trim()
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Submit Support Case
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-3">
          {visibleCases.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                router.push(
                  `/support/${encodeURIComponent(
                    item.id
                  )}`
                )
              }
              className="flex w-full items-start gap-4 rounded-[1.5rem] border border-border/60 bg-card/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-card sm:p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Headphones className="size-4" />
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
                    {item.category.replaceAll(
                      '_',
                      ' '
                    )}
                  </span>
                  {item.order ? (
                    <span>
                      Order{' '}
                      {item.order.orderNumber}
                    </span>
                  ) : null}
                  <span>
                    Updated{' '}
                    {dateFormatter.format(
                      new Date(item.updatedAt)
                    )}
                  </span>
                </span>
              </span>
            </button>
          ))}

          {!visibleCases.length ? (
            <div className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/45 p-8 text-center">
              <div>
                <Headphones className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-base font-black">
                  {query
                    ? 'No matching Support Cases'
                    : 'No Support Cases yet'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  Create a case when you need governed help with an order, delivery, payment, product or account experience.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal';

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-xs font-bold">
      <span>{label}</span>
      {children}
    </label>
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
    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}
