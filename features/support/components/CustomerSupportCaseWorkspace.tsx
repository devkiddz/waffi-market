'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Send
} from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import {
  useSupportLiveCase
} from '../client/useSupportLiveCase';

import type {
  SupportLiveEventItem
} from '../supportLiveTypes';

import type {
  SupportCaseDetail
} from '../supportTypes';

import {
  SupportLiveActivityBar
} from './SupportLiveActivityBar';

import {
  SupportLiveStatusBadge
} from './SupportLiveStatusBadge';

type CustomerSupportCaseWorkspaceProps = {
  actorUserId: string;
  initialCase: SupportCaseDetail;
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

export function CustomerSupportCaseWorkspace({
  actorUserId,
  initialCase
}: CustomerSupportCaseWorkspaceProps) {
  const [supportCase, setSupportCase] =
    useState(initialCase);
  const [message, setMessage] =
    useState('');
  const [error, setError] =
    useState<string | null>(null);
  const [isPending, startTransition] =
    useTransition();

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const endpoint =
    `/api/support/cases/${encodeURIComponent(
      supportCase.id
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
              'Content-Type':
                'application/json'
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
          | SupportCaseDetail
          | { error?: string };

      if (!response.ok || !('caseNumber' in next)) {
        throw new Error(
          'error' in next && next.error
            ? next.error
            : 'Shelsea could not update the Support Case.'
        );
      }

      setSupportCase(next);
      setError(null);
      return next;
    },
    [endpoint]
  );

  const applyLiveEvent =
    useCallback(
      async (
        event:
          SupportLiveEventItem
      ): Promise<void> => {
        if (
          event.actorId ===
          actorUserId
        ) {
          return;
        }

        if (
          event.type ===
          'MESSAGE_CREATED'
        ) {
          await request(
            'PATCH',
            {
              action:
                'mark-read'
            }
          );

          return;
        }

        await request(
          'GET'
        );
      },
      [
        actorUserId,
        request
      ]
    );

  const live =
    useSupportLiveCase({
      streamUrl:
        endpoint + '/live',
      onEvent:
        applyLiveEvent
    });

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        await request('GET');
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not refresh the Support Case.'
        );
      }
    });
  }, [request]);

  /* eslint-disable react-hooks/set-state-in-effect -- Opening the workspace synchronizes server-side read state; request state updates settle asynchronously. */
  useEffect(() => {
    void request('PATCH', {
      action: 'mark-read'
    }).catch(cause => {
      console.error(
        'Support read-state update failed.',
        cause
      );
    });
  }, [request]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(
    () => {
      messagesEndRef.current
        ?.scrollIntoView({
          block: 'end',
          behavior:
            'smooth'
        });
    },
    [
      supportCase
        .conversation
        .messages.length
    ]
  );

  const sendMessage = () => {
    const body = message.trim();

    if (!body) return;

    startTransition(async () => {
      try {
        await request('PATCH', {
          action: 'send',
          body
        });

        live.setTyping(
          false
        );

        setMessage('');
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not send the message.'
        );
      }
    });
  };

  const confirmResolution = (
    confirmed: boolean
  ) => {
    startTransition(async () => {
      try {
        await request('PATCH', {
          action:
            'confirm-resolution',
          confirmed
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not update the resolution.'
        );
      }
    });
  };

  const open =
    supportCase.status !== 'CLOSED';

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem] space-y-4">
        <section className="rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/support"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border hover:bg-muted"
              aria-label="Back to Support">
              <ArrowLeft className="size-4" />
            </Link>

            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Headphones className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {supportCase.caseNumber}
              </p>
              <h1 className="mt-1 text-xl font-black sm:text-2xl">
                {supportCase.subject}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {supportCase.category.replaceAll(
                  '_',
                  ' '
                )}{' '}
                · {supportCase.priority}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SupportLiveStatusBadge
                state={
                  live.state
                }
                error={
                  live.error
                }
              />

              <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-black">
                {supportCase.status.replaceAll(
                  '_',
                  ' '
                )}
              </span>
              <button
                type="button"
                onClick={refresh}
                disabled={isPending}
                className="grid size-10 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-50">
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

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {supportCase.order ? (
              <ContextChip
                icon={
                  <PackageCheck className="size-3.5" />
                }
                label={`Order ${supportCase.order.orderNumber}`}
              />
            ) : null}
            {supportCase.assignedAgent ? (
              <ContextChip
                icon={
                  <Headphones className="size-3.5" />
                }
                label={`Agent: ${supportCase.assignedAgent.name}`}
              />
            ) : (
              <ContextChip
                icon={
                  <Headphones className="size-3.5" />
                }
                label="Awaiting assignment"
              />
            )}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {supportCase.status ===
        'RESOLVED' ? (
          <section className="rounded-[1.75rem] border border-primary/20 bg-primary/10 p-5">
            <h2 className="text-sm font-black text-primary dark:text-primary-foreground">
              Has this been resolved?
            </h2>
            <p className="mt-2 text-xs leading-5 text-primary/75 dark:text-primary-foreground/75">
              Confirm the result or reopen the case for continued support.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  confirmResolution(true)
                }
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-white disabled:opacity-50">
                <CheckCircle2 className="size-4" />
                Confirm resolution
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  confirmResolution(false)
                }
                className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 px-4 text-xs font-bold text-primary dark:text-primary-foreground disabled:opacity-50">
                <RotateCcw className="size-4" />
                Continue support
              </button>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-xl">
          <div className="max-h-[calc(100dvh-25rem)] min-h-[28rem] space-y-3 overflow-y-auto bg-muted/20 p-4 sm:p-6">
            {supportCase.conversation.messages.map(
              item => {
                const own =
                  item.sender?.id ===
                  actorUserId;

                return (
                  <article
                    key={item.id}
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
                          {item.sender?.name ??
                            item.senderRole.replaceAll(
                              '_',
                              ' '
                            )}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {item.body}
                      </p>
                      <p className="mt-2 text-right text-[9px] opacity-60">
                        {dateFormatter.format(
                          new Date(
                            item.createdAt
                          )
                        )}
                      </p>
                    </div>
                  </article>
                );
              }
            )}

            <div
              ref={
                messagesEndRef
              }
              aria-hidden="true"
            />
          </div>

          <SupportLiveActivityBar
            actorUserId={
              actorUserId
            }
            participants={
              live.participants
            }
            remoteLabel="Support agent"
          />

          <div className="bg-card/70 p-3 sm:p-4">
            {open ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={message}
                  maxLength={4000}
                  onChange={event => {
                    const value =
                      event.target.value;

                    setMessage(
                      value
                    );

                    live.setTyping(
                      Boolean(
                        value.trim()
                      )
                    );
                  }}
                  onBlur={() =>
                    live.setTyping(
                      false
                    )
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
                  placeholder="Continue the Support conversation…"
                  className="min-h-12 max-h-36 min-w-0 flex-1 resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    isPending ||
                    !message.trim()
                  }
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                This Support Case is closed.
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
