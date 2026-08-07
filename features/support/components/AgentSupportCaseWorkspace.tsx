'use client';

import {
  ArrowLeft,
  CheckCircle2,
  ChevronUp,
  Headphones,
  LoaderCircle,
  MessageCircle,
  NotebookPen,
  RefreshCw,
  Send,
  ShieldAlert,
  UserRoundCheck
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

import {
  SupportIntelligencePanel
} from './SupportIntelligencePanel';

import {
  SupportLiveActivityBar
} from './SupportLiveActivityBar';

import {
  SupportLiveStatusBadge
} from './SupportLiveStatusBadge';
import {
  SupportOperationsPanel
} from './SupportOperationsPanel';

import {
  SUPPORT_CASE_PRIORITIES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_RESOLUTION_TYPES
} from '../supportTypes';
import type {
  SupportCaseDetail,
  SupportCasePriorityValue,
  SupportCaseStatusValue,
  SupportResolutionTypeValue
} from '../supportTypes';

export type SupportAgentOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AgentSupportCaseWorkspaceProps = {
  actorUserId: string;
  initialCase: SupportCaseDetail;
  agents: SupportAgentOption[];
  permissions: {
    reply: boolean;
    assign: boolean;
    escalate: boolean;
    resolve: boolean;
    prepareCommerce: boolean;
    approveCommerce: boolean;
  };
};

const dateFormatter = new Intl.DateTimeFormat(
  'en-NG',
  {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
);

export function AgentSupportCaseWorkspace({
  actorUserId,
  initialCase,
  agents,
  permissions
}: AgentSupportCaseWorkspaceProps) {
  const [supportCase, setSupportCase] =
    useState(initialCase);
  const [message, setMessage] =
    useState('');
  const [note, setNote] = useState('');
  const [selectedAgentId, setSelectedAgentId] =
    useState(
      initialCase.assignedAgent?.id ??
        actorUserId
    );
  const [selectedStatus, setSelectedStatus] =
    useState<SupportCaseStatusValue>(
      initialCase.status
    );
  const [selectedPriority, setSelectedPriority] =
    useState<SupportCasePriorityValue>(
      initialCase.priority
    );
  const [escalationReason, setEscalationReason] =
    useState('');
  const [resolutionType, setResolutionType] =
    useState<SupportResolutionTypeValue>(
      'INFORMATION'
    );
  const [resolutionSummary, setResolutionSummary] =
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
    `/api/admin/support/cases/${encodeURIComponent(
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
      setSelectedStatus(next.status);
      setSelectedPriority(next.priority);
      setSelectedAgentId(
        current =>
          next.assignedAgent?.id ??
          current
      );
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

  /* eslint-disable react-hooks/set-state-in-effect -- Opening the workspace synchronizes server-side read state; request state updates settle asynchronously. */
  useEffect(() => {
    void request(
      'PATCH',
      {
        action:
          'mark-read'
      }
    ).catch(cause => {
      console.error(
        'Support agent read-state update failed.',
        cause
      );
    });
  }, [request]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const run = (
    payload: Record<string, unknown>,
    after?: () => void
  ) => {
    startTransition(async () => {
      try {
        await request('PATCH', payload);
        after?.();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not update the Support Case.'
        );
      }
    });
  };

  const assignedToActor =
    supportCase.assignedAgent?.id ===
    actorUserId;

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-4">
        <section className="rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/admin/support"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border hover:bg-muted">
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
                {supportCase.customer.name} ·{' '}
                {supportCase.category.replaceAll(
                  '_',
                  ' '
                )}
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

              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  run({
                    action:
                      'refresh'
                  })
                }
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
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.65fr)]">
          <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-xl">
            <div className="max-h-[calc(100dvh-22rem)] min-h-[34rem] space-y-3 overflow-y-auto bg-muted/20 p-4 sm:p-6">
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
              remoteLabel="Customer"
            />

            <div className="bg-card/70 p-3 sm:p-4">
              {permissions.reply &&
              assignedToActor &&
              supportCase.status !== 'CLOSED' ? (
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
                    placeholder="Reply to the customer…"
                    className="min-h-12 max-h-36 min-w-0 flex-1 resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        {
                          action: 'send',
                          body: message
                        },
                        () => {
                          live.setTyping(
                            false
                          );

                          setMessage('');
                        }
                      )
                    }
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
                  {!supportCase.assignedAgent
                    ? 'Assign this case before replying.'
                    : !assignedToActor
                      ? `This case is assigned to ${supportCase.assignedAgent.name}.`
                      : 'Reply access is unavailable.'}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Panel
              icon={
                <UserRoundCheck className="size-4" />
              }
              title="Assignment">
              <select
                value={selectedAgentId}
                onChange={event =>
                  setSelectedAgentId(
                    event.target.value
                  )
                }
                disabled={!permissions.assign}
                className={inputClass}>
                {agents.map(agent => (
                  <option
                    key={agent.id}
                    value={agent.id}>
                    {agent.name} · {agent.role}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={
                  isPending ||
                  !permissions.assign ||
                  !selectedAgentId
                }
                onClick={() =>
                  run({
                    action: 'assign',
                    agentId:
                      selectedAgentId
                  })
                }
                className={primaryButton}>
                Assign case
              </button>
            </Panel>

            <Panel
              icon={
                <CheckCircle2 className="size-4" />
              }
              title="Status">
              <select
                value={selectedStatus}
                onChange={event =>
                  setSelectedStatus(
                    event.target.value as
                      SupportCaseStatusValue
                  )
                }
                className={inputClass}>
                {SUPPORT_CASE_STATUSES.map(
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
              <button
                type="button"
                disabled={
                  isPending ||
                  selectedStatus ===
                    supportCase.status
                }
                onClick={() =>
                  run({
                    action: 'status',
                    status: selectedStatus
                  })
                }
                className={primaryButton}>
                Update status
              </button>
            </Panel>

            <Panel
              icon={
                <NotebookPen className="size-4" />
              }
              title="Internal note">
              <textarea
                value={note}
                maxLength={6000}
                onChange={event =>
                  setNote(event.target.value)
                }
                placeholder="Visible only to Support operations."
                className={textareaClass}
              />
              <button
                type="button"
                disabled={
                  isPending || !note.trim()
                }
                onClick={() =>
                  run(
                    {
                      action: 'note',
                      body: note
                    },
                    () => setNote('')
                  )
                }
                className={primaryButton}>
                Save internal note
              </button>

              {supportCase.notes.length ? (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  {supportCase.notes
                    .slice(0, 4)
                    .map(item => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-muted/55 p-3">
                        <p className="text-[10px] font-bold">
                          {item.author?.name ??
                            'Support'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                    ))}
                </div>
              ) : null}
            </Panel>

            <Panel
              icon={
                <ShieldAlert className="size-4" />
              }
              title="Escalation">
              <select
                value={selectedPriority}
                onChange={event =>
                  setSelectedPriority(
                    event.target.value as
                      SupportCasePriorityValue
                  )
                }
                disabled={!permissions.escalate}
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
              <textarea
                value={escalationReason}
                onChange={event =>
                  setEscalationReason(
                    event.target.value
                  )
                }
                placeholder="Why is escalation required?"
                className={textareaClass}
              />
              <button
                type="button"
                disabled={
                  isPending ||
                  !permissions.escalate ||
                  !escalationReason.trim()
                }
                onClick={() =>
                  run(
                    {
                      action: 'escalate',
                      priority:
                        selectedPriority,
                      reason:
                        escalationReason
                    },
                    () =>
                      setEscalationReason('')
                  )
                }
                className={primaryButton}>
                <ChevronUp className="size-3.5" />
                Escalate
              </button>
            </Panel>

            <Panel
              icon={
                <CheckCircle2 className="size-4" />
              }
              title="Proposed resolution">
              <select
                value={resolutionType}
                onChange={event =>
                  setResolutionType(
                    event.target.value as
                      SupportResolutionTypeValue
                  )
                }
                disabled={!permissions.resolve}
                className={inputClass}>
                {SUPPORT_RESOLUTION_TYPES.map(
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
              <textarea
                value={resolutionSummary}
                onChange={event =>
                  setResolutionSummary(
                    event.target.value
                  )
                }
                placeholder="Describe the proposed outcome. This does not execute a refund or irreversible commerce action."
                className={textareaClass}
              />
              <button
                type="button"
                disabled={
                  isPending ||
                  !permissions.resolve ||
                  !resolutionSummary.trim()
                }
                onClick={() =>
                  run(
                    {
                      action: 'resolution',
                      type: resolutionType,
                      summary:
                        resolutionSummary
                    },
                    () =>
                      setResolutionSummary('')
                  )
                }
                className={primaryButton}>
                Propose resolution
              </button>
            </Panel>

            <SupportIntelligencePanel
              caseId={supportCase.id}
            />

            <SupportOperationsPanel
              caseId={supportCase.id}
              canPrepare={
                permissions.prepareCommerce
              }
              canApprove={
                permissions.approveCommerce
              }
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  'h-10 w-full rounded-xl border border-border bg-background px-3 text-xs';
const textareaClass =
  'min-h-24 w-full resize-y rounded-xl border border-border bg-background p-3 text-xs leading-5';
const primaryButton =
  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background disabled:opacity-40';

function Panel({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-black">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
