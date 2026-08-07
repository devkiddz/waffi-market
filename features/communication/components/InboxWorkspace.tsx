'use client';

import {
  Inbox,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Store,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useMemo,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import type {
  CommunicationConversationSummary,
  CommunicationInboxSnapshot
} from '../communicationTypes';

export type CommunicationComposeVendor = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

type InboxWorkspaceProps = {
  audience: 'customer' | 'vendor';
  initialSnapshot: CommunicationInboxSnapshot;
  vendors?: CommunicationComposeVendor[];
  vendorName?: string;
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

function titleFor(
  conversation: CommunicationConversationSummary
) {
  return (
    conversation.subject ??
    conversation.vendor?.name ??
    'Shelsea conversation'
  );
}

function previewFor(
  conversation: CommunicationConversationSummary
) {
  return (
    conversation.lastMessage?.body ??
    (conversation.context?.orderNumber
      ? `Order ${conversation.context.orderNumber}`
      : null) ??
    conversation.context?.productName ??
    'Conversation ready'
  );
}

export function InboxWorkspace({
  audience,
  initialSnapshot,
  vendors = [],
  vendorName
}: InboxWorkspaceProps) {
  const router = useRouter();

  const [snapshot, setSnapshot] =
    useState(initialSnapshot);
  const [query, setQuery] = useState('');
  const [composeOpen, setComposeOpen] =
    useState(false);
  const [selectedVendorId, setSelectedVendorId] =
    useState(vendors[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] =
    useState<string | null>(null);
  const [notice, setNotice] =
    useState<string | null>(null);
  const [isPending, startTransition] =
    useTransition();

  const endpoint =
    audience === 'vendor'
      ? '/api/vendor/communication/conversations'
      : '/api/communication/conversations';

  const routePrefix =
    audience === 'vendor'
      ? '/vendor/inbox'
      : '/inbox';

  const conversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return snapshot.conversations;
    }

    return snapshot.conversations.filter(
      conversation => {
        const haystack = [
          titleFor(conversation),
          previewFor(conversation),
          conversation.vendor?.name,
          conversation.context?.orderNumber,
          conversation.context?.productName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalized);
      }
    );
  }, [query, snapshot.conversations]);

  const refresh = () => {
    setNotice(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `${endpoint}?limit=100`,
          {
            cache: 'no-store',
            credentials: 'same-origin'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Shelsea could not refresh the Inbox.'
          );
        }

        setSnapshot(
          (await response.json()) as
            CommunicationInboxSnapshot
        );
        setError(null);
      } catch (cause) {
        console.error(
          'Communication Inbox refresh failed.',
          cause
        );
        setError(
          'The Inbox could not be refreshed. Your current view has been preserved.'
        );
      }
    });
  };

  const createConversation = () => {
    if (
      audience !== 'customer' ||
      !selectedVendorId ||
      !message.trim()
    ) {
      setError(
        'Choose a vendor and enter your message.'
      );
      return;
    }

    setNotice(null);

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({
            vendorProfileId: selectedVendorId,
            subject,
            message,
            source: 'CUSTOMER_INBOX'
          })
        });

        const payload =
          (await response.json()) as
            | CommunicationConversationSummary
            | { error?: string };

        if (!response.ok || !('id' in payload)) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Shelsea could not start the conversation.'
          );
        }

        setComposeOpen(false);
        setSubject('');
        setMessage('');
        setError(null);
        router.push(
          `${routePrefix}/${encodeURIComponent(
            payload.id
          )}`
        );
      } catch (cause) {
        console.error(
          'Communication creation failed.',
          cause
        );
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not start the conversation.'
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
                <Inbox className="size-5" />
              </span>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                  {audience === 'vendor'
                    ? 'Vendor communication'
                    : 'Customer communication'}
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  {audience === 'vendor'
                    ? `${vendorName ?? 'Vendor'} Inbox`
                    : 'Your Shelsea Inbox'}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  {audience === 'vendor'
                    ? 'Reply to customers through vendor-scoped conversations without exposing another seller’s order context.'
                    : 'Continue protected conversations with marketplace vendors from one workspace.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Metric
                label="Unread"
                value={snapshot.unreadCount}
              />
              <Metric
                label="Conversations"
                value={snapshot.conversations.length}
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
              placeholder="Search conversations"
              className="h-11 w-full rounded-full border border-border/70 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-bold transition hover:bg-muted disabled:opacity-50">
            <RefreshCw
              className={cn(
                'size-3.5',
                isPending && 'animate-spin'
              )}
            />
            Refresh
          </button>

          {audience === 'customer' ? (
            <button
              type="button"
              onClick={() =>
                setComposeOpen(current => !current)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs font-bold text-background">
              {composeOpen ? (
                <X className="size-3.5" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {composeOpen
                ? 'Close composer'
                : 'New conversation'}
            </button>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            {notice}
          </div>
        ) : null}

        {composeOpen &&
        audience === 'customer' ? (
          <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Send className="size-4" />
              </span>

              <div>
                <h2 className="text-base font-black">
                  Start a vendor conversation
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Vendors can reply only inside their own marketplace boundary.
                </p>
              </div>
            </div>

            {vendors.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-xs font-bold">
                  <span>Vendor</span>
                  <select
                    value={selectedVendorId}
                    onChange={event =>
                      setSelectedVendorId(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal">
                    {vendors.map(vendor => (
                      <option
                        key={vendor.id}
                        value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-xs font-bold">
                  <span>Subject</span>
                  <input
                    value={subject}
                    maxLength={180}
                    onChange={event =>
                      setSubject(event.target.value)
                    }
                    placeholder="Optional subject"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                  />
                </label>

                <label className="space-y-2 text-xs font-bold md:col-span-2">
                  <span>Message</span>
                  <textarea
                    value={message}
                    maxLength={4000}
                    onChange={event =>
                      setMessage(event.target.value)
                    }
                    placeholder="Tell the vendor what you need help with."
                    className="min-h-32 w-full resize-y rounded-2xl border border-border bg-background p-3 text-sm font-normal leading-6"
                  />
                </label>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      !selectedVendorId ||
                      !message.trim()
                    }
                    onClick={createConversation}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">
                    {isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Send message
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No active marketplace vendor is available.
              </div>
            )}
          </section>
        ) : null}

        <section className="grid gap-3">
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              type="button"
              onClick={() =>
                router.push(
                  `${routePrefix}/${encodeURIComponent(
                    conversation.id
                  )}`
                )
              }
              className={cn(
                'group flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-card sm:p-5',
                conversation.unreadCount
                  ? 'border-sky-500/25 bg-sky-500/[0.045]'
                  : 'border-border/60 bg-card/70'
              )}>
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-2xl',
                  conversation.unreadCount
                    ? 'bg-sky-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}>
                {conversation.vendor ? (
                  <Store className="size-4" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-sm sm:text-base">
                    {titleFor(conversation)}
                  </strong>

                  {conversation.unreadCount ? (
                    <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-black text-white">
                      {conversation.unreadCount > 99
                        ? '99+'
                        : conversation.unreadCount}
                    </span>
                  ) : null}

                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                    {conversation.status}
                  </span>
                </span>

                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                  {previewFor(conversation)}
                </span>

                <span className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  {conversation.vendor?.name ? (
                    <span>
                      {conversation.vendor.name}
                    </span>
                  ) : null}

                  {conversation.context?.orderNumber ? (
                    <span>
                      Order{' '}
                      {
                        conversation.context
                          .orderNumber
                      }
                    </span>
                  ) : null}

                  <span>
                    {dateFormatter.format(
                      new Date(
                        conversation.lastMessageAt ??
                          conversation.updatedAt
                      )
                    )}
                  </span>
                </span>
              </span>
            </button>
          ))}

          {!conversations.length ? (
            <div className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-card/45 p-8 text-center">
              <div>
                <Inbox className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-base font-black">
                  {query
                    ? 'No matching conversations'
                    : 'Your Inbox is ready'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  {query
                    ? 'Try another vendor, order number or message phrase.'
                    : audience === 'customer'
                      ? 'Start a protected marketplace conversation when you need information from a vendor.'
                      : 'Customer conversations will appear here when they contact your store.'}
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
      <p className="mt-1 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}
