'use client';

import {
  ArrowRight,
  Bot,
  Eraser,
  Headphones,
  LoaderCircle,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Undo2
} from 'lucide-react';

import Link from 'next/link';

import {
  usePathname
} from 'next/navigation';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  cn
} from '@/lib/utils';

import type {
  SupportCaseDetail
} from '../supportTypes';

import type {
  SupportGuideMessage,
  SupportGuideResponse
} from '../supportGuideTypes';

import {
  buildSupportGuideHandoffDraft,
  supportGuideTranscript
} from '../supportGuideHandoff';

const quickQuestions = [
  'How do I buy?',
  'How do I use Shelsea?',
  'Is Shelsea multivendor?',
  'Track my order',
  'Payment help',
  'Talk to a human agent'
] as const;

const SUPPORT_INTELLIGENCE_WELCOME =
  `Hi 👋 I’m AJ Support Intelligence. I’m active 24/7 to help you shop, use Shelsea, understand vendors, track orders, resolve payment or delivery questions, and connect you to a human Support agent when needed.

What can I help you with today?`;

const CLEAR_UNDO_WINDOW_MS =
  8000;

type FeedbackState =
  | 'IDLE'
  | 'UNHELPFUL_REASON'
  | 'SAVED_HELPFUL'
  | 'SAVED_UNHELPFUL';

type ClearedConversation = {
  messages:
    SupportGuideMessage[];
  question:
    string;
  latest:
    SupportGuideResponse | null;
  error:
    string | null;
  feedbackState:
    FeedbackState;
  feedbackReason:
    string;
};

async function readFailure(
  response:
    Response,
  fallback:
    string
): Promise<string> {
  try {
    const payload =
      (await response.json()) as {
        error?: string;
      };

    return payload.error ??
      fallback;
  } catch {
    return fallback;
  }
}

function welcomeMessage():
  SupportGuideMessage {
  return {
    id:
      `guide-welcome-${Date.now()}`,
    role:
      'GUIDE',
    body:
      SUPPORT_INTELLIGENCE_WELCOME,
    createdAt:
      new Date()
        .toISOString()
  };
}

type SupportGuidePanelProps = {
  workspaceId:
    string | null;
  online:
    boolean;
  onCaseCreated:
    (
      supportCase:
        SupportCaseDetail
    ) => void;
};

export function SupportGuidePanel({
  workspaceId,
  online,
  onCaseCreated
}: SupportGuidePanelProps) {
  const pathname =
    usePathname();

  const [
    messages,
    setMessages
  ] =
    useState<
      SupportGuideMessage[]
    >([
      welcomeMessage()
    ]);

  const [
    question,
    setQuestion
  ] =
    useState(
      ''
    );

  const [
    latest,
    setLatest
  ] =
    useState<
      SupportGuideResponse | null
    >(
      null
    );

  const [
    busy,
    setBusy
  ] =
    useState(
      false
    );

  const [
    handoffBusy,
    setHandoffBusy
  ] =
    useState(
      false
    );

  const [
    feedbackState,
    setFeedbackState
  ] =
    useState<
      FeedbackState
    >(
      'IDLE'
    );

  const [
    feedbackReason,
    setFeedbackReason
  ] =
    useState(
      ''
    );

  const [
    feedbackBusy,
    setFeedbackBusy
  ] =
    useState(
      false
    );

  const [
    error,
    setError
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    clearedConversation,
    setClearedConversation
  ] =
    useState<
      ClearedConversation | null
    >(
      null
    );

  const shortcutLabel =
    'Ctrl/⌘ ⇧ ⌫';

  const requestRef =
    useRef<
      AbortController | null
    >(
      null
    );

  const undoTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null
    );

  const messagesEndRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    );

  const canAsk =
    Boolean(
      online &&
      workspaceId &&
      question.trim() &&
      !busy &&
      !handoffBusy
    );

  const canClear =
    Boolean(
      !handoffBusy &&
      (
        busy ||
        messages.length >
          1 ||
        question.trim() ||
        latest ||
        error
      )
    );

  const append =
    useCallback(
      (
        role:
          SupportGuideMessage['role'],
        body:
          string
      ) => {
        setMessages(
          current => [
            ...current,
            {
              id:
                `guide-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              role,
              body,
              createdAt:
                new Date()
                  .toISOString()
            }
          ]
        );
      },
      []
    );

  const clearUndoTimer =
    useCallback(
      () => {
        if (
          undoTimerRef
            .current
        ) {
          clearTimeout(
            undoTimerRef
              .current
          );

          undoTimerRef.current =
            null;
        }
      },
      []
    );

  const clearConversation =
    useCallback(
      () => {
        if (
          !canClear
        ) {
          return;
        }

        requestRef.current
          ?.abort();

        requestRef.current =
          null;

        clearUndoTimer();

        setClearedConversation({
          messages:
            [
              ...messages
            ],
          question,
          latest,
          error,
          feedbackState,
          feedbackReason
        });

        setMessages([
          welcomeMessage()
        ]);

        setQuestion(
          ''
        );

        setLatest(
          null
        );

        setBusy(
          false
        );

        setError(
          null
        );

        setFeedbackState(
          'IDLE'
        );

        setFeedbackReason(
          ''
        );

        setFeedbackBusy(
          false
        );

        undoTimerRef.current =
          setTimeout(
            () => {
              setClearedConversation(
                null
              );

              undoTimerRef.current =
                null;
            },
            CLEAR_UNDO_WINDOW_MS
          );
      },
      [
        canClear,
        clearUndoTimer,
        error,
        feedbackReason,
        feedbackState,
        latest,
        messages,
        question
      ]
    );

  const undoClear =
    useCallback(
      () => {
        if (
          !clearedConversation
        ) {
          return;
        }

        clearUndoTimer();

        setMessages(
          clearedConversation
            .messages
        );

        setQuestion(
          clearedConversation
            .question
        );

        setLatest(
          clearedConversation
            .latest
        );

        setError(
          clearedConversation
            .error
        );

        setFeedbackState(
          clearedConversation
            .feedbackState
        );

        setFeedbackReason(
          clearedConversation
            .feedbackReason
        );

        setClearedConversation(
          null
        );
      },
      [
        clearUndoTimer,
        clearedConversation
      ]
    );

  const ask =
    useCallback(
      async (
        value:
          string
      ) => {
        const normalized =
          value.trim();

        if (
          !normalized ||
          !workspaceId ||
          busy ||
          handoffBusy
        ) {
          return;
        }

        if (!online) {
          setError(
            'Reconnect before asking AJ Support Intelligence.'
          );

          return;
        }

        clearUndoTimer();

        setClearedConversation(
          null
        );

        requestRef.current
          ?.abort();

        const controller =
          new AbortController();

        requestRef.current =
          controller;

        setBusy(
          true
        );

        setError(
          null
        );

        setFeedbackState(
          'IDLE'
        );

        setFeedbackReason(
          ''
        );

        setQuestion(
          ''
        );

        append(
          'CUSTOMER',
          normalized
        );

        try {
          const response =
            await fetch(
              `/api/support/guide?workspaceId=${encodeURIComponent(workspaceId)}`,
              {
                method:
                  'POST',
                credentials:
                  'same-origin',
                cache:
                  'no-store',
                signal:
                  controller.signal,
                headers: {
                  'Content-Type':
                    'application/json'
                },
                body:
                  JSON.stringify({
                    question:
                      normalized,
                    pathname
                  })
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await readFailure(
                response,
                'AJ Support Intelligence could not answer right now.'
              )
            );
          }

          const answer =
            (await response.json()) as
              SupportGuideResponse;

          setLatest(
            answer
          );

          append(
            'GUIDE',
            [
              answer.answer,
              answer.followUp
            ]
              .filter(
                Boolean
              )
              .join(
                '\n\n'
              )
          );
        } catch (
          cause
        ) {
          if (
            cause instanceof
              DOMException &&
            cause.name ===
              'AbortError'
          ) {
            return;
          }

          setError(
            cause instanceof Error
              ? cause.message
              : 'AJ Support Intelligence could not answer right now.'
          );
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current =
              null;

            setBusy(
              false
            );
          }
        }
      },
      [
        append,
        busy,
        clearUndoTimer,
        handoffBusy,
        online,
        pathname,
        workspaceId
      ]
    );

  const submitFeedback =
    useCallback(
      async (
        helpful:
          boolean
      ) => {
        if (
          !workspaceId ||
          !latest
            ?.interactionId ||
          feedbackBusy
        ) {
          return;
        }

        setFeedbackBusy(
          true
        );

        setError(
          null
        );

        try {
          const response =
            await fetch(
              `/api/support/guide/feedback?workspaceId=${encodeURIComponent(workspaceId)}`,
              {
                method:
                  'POST',
                credentials:
                  'same-origin',
                cache:
                  'no-store',
                headers: {
                  'Content-Type':
                    'application/json'
                },
                body:
                  JSON.stringify({
                    interactionId:
                      latest
                        .interactionId,
                    helpful,
                    reason:
                      helpful
                        ? null
                        : feedbackReason
                  })
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await readFailure(
                response,
                'Shelsea could not record this feedback.'
              )
            );
          }

          setFeedbackState(
            helpful
              ? 'SAVED_HELPFUL'
              : 'SAVED_UNHELPFUL'
          );
        } catch (
          cause
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Shelsea could not record this feedback.'
          );
        } finally {
          setFeedbackBusy(
            false
          );
        }
      },
      [
        feedbackBusy,
        feedbackReason,
        latest,
        workspaceId
      ]
    );

  const handoff =
    useCallback(
      async () => {
        if (
          !workspaceId ||
          handoffBusy
        ) {
          return;
        }

        if (!online) {
          setError(
            'Reconnect before opening a human Support Case.'
          );

          return;
        }

        setHandoffBusy(
          true
        );

        setError(
          null
        );

        try {
          const draft =
            buildSupportGuideHandoffDraft(
              latest,
              pathname
            );

          const response =
            await fetch(
              '/api/support/cases',
              {
                method:
                  'POST',
                credentials:
                  'same-origin',
                cache:
                  'no-store',
                headers: {
                  'Content-Type':
                    'application/json'
                },
                body:
                  JSON.stringify({
                    category:
                      draft.category,
                    priority:
                      draft.priority,
                    subject:
                      draft.subject,
                    description:
                      supportGuideTranscript(
                        messages
                      ),
                    orderId:
                      draft.orderId,
                    deliveryId:
                      draft.deliveryId,
                    vendorProfileId:
                      draft.vendorProfileId,
                    guideInteractionId:
                      draft.interactionId,
                    metadata:
                      draft.metadata
                  })
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await readFailure(
                response,
                'Shelsea could not connect this conversation to a human agent.'
              )
            );
          }

          onCaseCreated(
            (await response.json()) as
              SupportCaseDetail
          );
        } catch (
          cause
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Shelsea could not connect this conversation to a human agent.'
          );
        } finally {
          setHandoffBusy(
            false
          );
        }
      },
      [
        handoffBusy,
        latest,
        messages,
        online,
        onCaseCreated,
        pathname,
        workspaceId
      ]
    );

  const visibleActions =
    useMemo(
      () =>
        latest
          ?.actions ??
        [],
      [
        latest
      ]
    );

  useEffect(
    () => {
      const handleShortcut =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.repeat ||
            !event.shiftKey ||
            !(
              event.ctrlKey ||
              event.metaKey
            ) ||
            event.key !==
              'Backspace'
          ) {
            return;
          }

          event.preventDefault();

          clearConversation();
        };

      document.addEventListener(
        'keydown',
        handleShortcut
      );

      return () => {
        document.removeEventListener(
          'keydown',
          handleShortcut
        );
      };
    },
    [
      clearConversation
    ]
  );

  useEffect(
    () => {
      messagesEndRef.current
        ?.scrollIntoView({
          block:
            'end',
          behavior:
            messages.length >
            1
              ? 'smooth'
              : 'auto'
        });
    },
    [
      busy,
      messages
    ]
  );

  useEffect(
    () => {
      return () => {
        requestRef.current
          ?.abort();

        clearUndoTimer();
      };
    },
    [
      clearUndoTimer
    ]
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-card/70 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-primary">
              AJ Support Intelligence
            </p>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.08] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Active 24/7
            </span>
          </div>

          <p className="mt-1 truncate text-xs font-bold">
            Instant help before human escalation
          </p>
        </div>
      </header>

      {!online ? (
        <div
          role="status"
          className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-800 dark:text-amber-200">
          Reconnect to continue with AJ Support Intelligence.
        </div>
      ) : null}

      {clearedConversation ? (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 border-b border-primary/20 bg-primary/[0.08] px-3 py-2 text-[10px] text-primary">
          <span className="min-w-0 flex-1">
            Current AJ Intelligence chat cleared.
          </span>

          <button
            type="button"
            onClick={undoClear}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25 px-2.5 py-1 font-black">
            <Undo2 className="size-3" />
            Undo
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="shrink-0 border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-[10px] text-destructive">
          {error}
        </div>
      ) : null}

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="AJ Support Intelligence conversation"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-muted/20 p-3 [scrollbar-gutter:stable]">
        {messages.map(
          item => (
            <article
              key={item.id}
              className={cn(
                'flex',
                item.role ===
                  'CUSTOMER'
                  ? 'justify-end'
                  : 'justify-start'
              )}>
              <div
                className={cn(
                  'max-w-[88%] rounded-[1.2rem] border px-3 py-2.5 shadow-sm',
                  item.role ===
                    'CUSTOMER'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-card text-card-foreground'
                )}>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
                  {item.role ===
                  'CUSTOMER' ? (
                    'You'
                  ) : (
                    <>
                      <Bot className="size-3" />
                      AJ Intelligence
                    </>
                  )}
                </div>

                <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5">
                  {item.body}
                </p>
              </div>
            </article>
          )
        )}

        {busy ? (
          <div className="flex justify-start">
            <div className="flex w-fit items-center gap-2 rounded-[1.2rem] border border-border/60 bg-card px-3 py-2.5 text-xs shadow-sm">
              <LoaderCircle className="size-3.5 animate-spin text-primary" />
              AJ Support Intelligence is thinking…
            </div>
          </div>
        ) : null}

        {messages.length ===
        1 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickQuestions.map(
              item => (
                <button
                  key={item}
                  type="button"
                  disabled={
                    busy ||
                    handoffBusy ||
                    !online
                  }
                  onClick={() =>
                    void ask(
                      item
                    )
                  }
                  className="rounded-full border border-border/70 bg-background px-3 py-2 text-[10px] font-bold transition hover:border-primary/35 hover:bg-primary/[0.06] disabled:opacity-40">
                  {item}
                </button>
              )
            )}
          </div>
        ) : null}

        {visibleActions.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {visibleActions.map(
              action =>
                action.kind ===
                  'NAVIGATE' &&
                action.href ? (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-2 text-[10px] font-black text-primary">
                    {action.label}
                    <ArrowRight className="size-3" />
                  </Link>
                ) : action.kind ===
                    'FOLLOW_UP' &&
                  action.prompt ? (
                  <button
                    key={action.id}
                    type="button"
                    disabled={
                      busy ||
                      handoffBusy ||
                      !online
                    }
                    onClick={() =>
                      void ask(
                        action.prompt ??
                        ''
                      )
                    }
                    className="rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-2 text-[10px] font-black text-primary disabled:opacity-40">
                    {action.label}
                  </button>
                ) : (
                  <button
                    key={action.id}
                    type="button"
                    disabled={
                      handoffBusy ||
                      !online
                    }
                    onClick={() =>
                      void handoff()
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[10px] font-black text-primary-foreground disabled:opacity-40">
                    {handoffBusy ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <Headphones className="size-3" />
                    )}

                    {action.label}
                  </button>
                )
            )}
          </div>
        ) : null}

        {latest?.interactionId ? (
          <section className="rounded-[1.2rem] border border-border/60 bg-card/75 p-3 shadow-sm">
            {feedbackState ===
              'SAVED_HELPFUL' ||
            feedbackState ===
              'SAVED_UNHELPFUL' ? (
              <p className="text-[10px] font-bold text-primary">
                Thanks — your feedback was recorded for governed Support Knowledge review.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-auto text-[10px] font-bold text-muted-foreground">
                    Was this answer helpful?
                  </span>

                  <button
                    type="button"
                    disabled={feedbackBusy}
                    onClick={() =>
                      void submitFeedback(
                        true
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1.5 text-[10px] font-black text-emerald-700 disabled:opacity-40">
                    <ThumbsUp className="size-3" />
                    Yes
                  </button>

                  <button
                    type="button"
                    disabled={feedbackBusy}
                    onClick={() =>
                      setFeedbackState(
                        'UNHELPFUL_REASON'
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/[0.07] px-3 py-1.5 text-[10px] font-black text-rose-700 disabled:opacity-40">
                    <ThumbsDown className="size-3" />
                    Not really
                  </button>
                </div>

                {feedbackState ===
                'UNHELPFUL_REASON' ? (
                  <div className="mt-3 flex items-end gap-2">
                    <textarea
                      value={feedbackReason}
                      rows={2}
                      maxLength={500}
                      onChange={
                        event =>
                          setFeedbackReason(
                            event.target
                              .value
                          )
                      }
                      placeholder="What was missing or incorrect? Optional."
                      className="min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-xs"
                    />

                    <button
                      type="button"
                      disabled={feedbackBusy}
                      onClick={() =>
                        void submitFeedback(
                          false
                        )
                      }
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[10px] font-black text-primary-foreground disabled:opacity-40">
                      {feedbackBusy ? (
                        <LoaderCircle className="size-3 animate-spin" />
                      ) : (
                        <Send className="size-3" />
                      )}
                      Submit
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        <div
          ref={messagesEndRef}
          aria-hidden="true"
        />
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-card/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <div className="flex min-h-11 min-w-0 flex-1 items-end rounded-2xl border border-border bg-background focus-within:border-primary/45">
            <textarea
              value={question}
              rows={1}
              maxLength={1000}
              enterKeyHint="send"
              onChange={
                event =>
                  setQuestion(
                    event.target
                      .value
                  )
              }
              onKeyDown={
                event => {
                  if (
                    event.key ===
                      'Enter' &&
                    !event.shiftKey &&
                    !event
                      .nativeEvent
                      .isComposing
                  ) {
                    event.preventDefault();

                    void ask(
                      question
                    );
                  }
                }
              }
              placeholder="Ask Shelsea Support Intelligence…"
              aria-label="Ask Shelsea Support Intelligence"
              className="min-h-11 max-h-28 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 outline-none"
            />

            <button
              type="button"
              title={`Clear current chat · ${shortcutLabel}`}
              aria-label="Clear current AJ Intelligence chat"
              aria-keyshortcuts="Control+Shift+Backspace Meta+Shift+Backspace"
              disabled={!canClear}
              onClick={clearConversation}
              className="mb-1.5 mr-1.5 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 text-[9px] font-black text-muted-foreground transition hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary disabled:opacity-35">
              <Eraser className="size-3" />

              <span className="hidden sm:inline">
                Clear
              </span>

              <kbd className="hidden rounded border border-border/70 bg-background px-1.5 py-0.5 font-mono text-[8px] lg:inline">
                {shortcutLabel}
              </kbd>
            </button>
          </div>

          <button
            type="button"
            aria-label="Send question to AJ Support Intelligence"
            disabled={!canAsk}
            onClick={() =>
              void ask(
                question
              )
            }
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-40">
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          disabled={
            handoffBusy ||
            !online
          }
          onClick={() =>
            void handoff()
          }
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 px-4 py-2 text-[10px] font-black text-muted-foreground transition hover:border-primary/30 hover:bg-primary/[0.05] hover:text-primary disabled:opacity-40">
          {handoffBusy ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Headphones className="size-3.5" />
          )}
          Continue with a human Support agent
        </button>
      </footer>
    </section>
  );
}
