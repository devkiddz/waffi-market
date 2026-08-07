'use client';

import {
  ArrowLeft,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Store
} from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import type {
  CommunicationConversationDetail
} from '../communicationTypes';

type ConversationWorkspaceProps = {
  audience: 'customer' | 'vendor';
  actorUserId: string;
  initialConversation:
    CommunicationConversationDetail;
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

export function ConversationWorkspace({
  audience,
  actorUserId,
  initialConversation
}: ConversationWorkspaceProps) {
  const [conversation, setConversation] =
    useState(initialConversation);
  const [body, setBody] = useState('');
  const [error, setError] =
    useState<string | null>(null);
  const [isPending, startTransition] =
    useTransition();

  const routePrefix =
    audience === 'vendor'
      ? '/vendor/inbox'
      : '/inbox';
  const endpoint =
    audience === 'vendor'
      ? `/api/vendor/communication/conversations/${encodeURIComponent(
          conversation.id
        )}`
      : `/api/communication/conversations/${encodeURIComponent(
          conversation.id
        )}`;

  const request = useCallback(
    async (
      method: 'GET' | 'PATCH',
      payload?: Record<string, unknown>
    ) => {
      const response = await fetch(endpoint, {
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json'
            }
          : undefined,
        credentials: 'same-origin',
        cache: 'no-store',
        body: payload
          ? JSON.stringify(payload)
          : undefined
      });

      const next =
        (await response.json()) as
          | CommunicationConversationDetail
          | { error?: string };

      if (!response.ok || !('messages' in next)) {
        throw new Error(
          'error' in next && next.error
            ? next.error
            : 'Shelsea could not update the conversation.'
        );
      }

      setConversation(next);
      setError(null);
      return next;
    },
    [endpoint]
  );

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        await request('GET');
      } catch (cause) {
        console.error(
          'Conversation refresh failed.',
          cause
        );
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not refresh the conversation.'
        );
      }
    });
  }, [request]);

  useEffect(() => {
    void request('PATCH', {
      action: 'mark-read'
    }).catch(cause => {
      console.error(
        'Conversation read-state update failed.',
        cause
      );
    });
  }, [request]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        document.visibilityState === 'visible'
      ) {
        refresh();
      }
    }, 45_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refresh]);

  const sendMessage = () => {
    const message = body.trim();

    if (!message) return;

    startTransition(async () => {
      try {
        await request('PATCH', {
          action: 'send',
          body: message
        });
        setBody('');
      } catch (cause) {
        console.error(
          'Communication message failed.',
          cause
        );
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not send the message.'
        );
      }
    });
  };

  const open =
    conversation.status === 'OPEN';

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] space-y-4">
        <section className="rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={routePrefix}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border transition hover:bg-muted"
              aria-label="Back to Inbox">
              <ArrowLeft className="size-4" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {conversation.type.replaceAll(
                  '_',
                  ' '
                )}
              </p>
              <h1 className="mt-1 truncate text-xl font-black sm:text-2xl">
                {conversation.subject ??
                  conversation.vendor?.name ??
                  'Shelsea conversation'}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {conversation.vendor?.name
                  ? `Marketplace conversation with ${conversation.vendor.name}`
                  : 'Protected Shelsea communication'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1.5 text-[10px] font-black',
                  open
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
                )}>
                {conversation.status}
              </span>

              <button
                type="button"
                onClick={refresh}
                disabled={isPending}
                aria-label="Refresh conversation"
                className="grid size-10 place-items-center rounded-full border border-border transition hover:bg-muted disabled:opacity-50">
                <RefreshCw
                  className={cn(
                    'size-4',
                    isPending &&
                      'animate-spin'
                  )}
                />
              </button>
            </div>
          </div>

          {conversation.context ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
              {conversation.context.orderNumber ? (
                <ContextChip
                  icon={
                    <PackageCheck className="size-3.5" />
                  }
                  label={`Order ${conversation.context.orderNumber}`}
                />
              ) : null}

              {conversation.context.productName ? (
                <ContextChip
                  icon={
                    <Store className="size-3.5" />
                  }
                  label={
                    conversation.context.productName
                  }
                />
              ) : null}

              {conversation.context
                .orderItemIds.length ? (
                <ContextChip
                  icon={
                    <ShieldCheck className="size-3.5" />
                  }
                  label={`${conversation.context.orderItemIds.length} vendor-scoped order item${conversation.context.orderItemIds.length === 1 ? '' : 's'}`}
                />
              ) : null}
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-xl">
          <div className="max-h-[calc(100dvh-22rem)] min-h-[28rem] space-y-3 overflow-y-auto bg-muted/20 p-4 sm:p-6">
            {conversation.messages.map(
              message => {
                const own =
                  message.sender?.id ===
                  actorUserId;

                return (
                  <article
                    key={message.id}
                    className={cn(
                      'flex',
                      own
                        ? 'justify-end'
                        : 'justify-start'
                    )}>
                    <div
                      className={cn(
                        'max-w-[88%] rounded-[1.4rem] border px-4 py-3 shadow-sm sm:max-w-[72%]',
                        own
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border/60 bg-card'
                      )}>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
                        <MessageCircle className="size-3" />
                        <span>
                          {message.sender?.name ??
                            message.senderRole.replaceAll(
                              '_',
                              ' '
                            )}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {message.body}
                      </p>

                      <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] opacity-60">
                        <span>
                          {dateFormatter.format(
                            new Date(
                              message.createdAt
                            )
                          )}
                        </span>
                        {own ? (
                          <CheckCheck className="size-3" />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              }
            )}

            {!conversation.messages.length ? (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <MessageCircle className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-4 text-sm font-black">
                    No messages yet
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border/60 bg-card/70 p-3 sm:p-4">
            {open ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={body}
                  maxLength={4000}
                  onChange={event =>
                    setBody(event.target.value)
                  }
                  onKeyDown={event => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message…"
                  className="min-h-12 max-h-36 min-w-0 flex-1 resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    isPending || !body.trim()
                  }
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                  aria-label="Send message">
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                This conversation is not open for new messages.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ContextChip({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}
