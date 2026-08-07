'use client';

import {
  ArrowLeft,
  ChevronDown,
  History,
  LoaderCircle,
  RotateCcw,
  Trash2,
  Undo2
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  cn
} from '@/lib/utils';

import {
  useExperienceStack
} from './ExperienceStackProvider';

type ExperienceHistoryPresentation =
  | 'navbar'
  | 'account-sheet';

type ExperienceHistoryControlProps = {
  presentation?:
    ExperienceHistoryPresentation;

  onResolved?:
    () => void;
};

function formatVisitedAt(
  value:
    string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleString(
    'en-NG',
    {
      month:
        'short',

      day:
        'numeric',

      hour:
        'numeric',

      minute:
        '2-digit'
    }
  );
}

export function ExperienceBackControl() {
  const {
    canGoBack,
    loading,
    goBack
  } =
    useExperienceStack();

  if (
    !canGoBack
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none px-[var(--app-page-gutter)] pt-3 sm:pt-4">
      <button
        type="button"
        disabled={
          loading
        }
        onClick={() =>
          void goBack()
        }
        aria-label="Return to the previous Shelsea experience"
        className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-background/88 px-3.5 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.13),0_14px_38px_rgba(0,0,0,0.24)] backdrop-blur-[28px] backdrop-saturate-[180%] transition supports-[backdrop-filter]:bg-background/72 hover:border-primary/35 hover:bg-background disabled:cursor-wait disabled:opacity-60">
        {loading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ArrowLeft className="size-4" />
        )}

        <span>
          Back
        </span>
      </button>
    </div>
  );
}

export function ExperienceHistoryControl({
  presentation =
    'navbar',

  onResolved
}: ExperienceHistoryControlProps) {
  const {
    entries,
    canGoBack,
    loading,
    error,
    goBack,
    jumpTo,
    clearHistory,
    startFresh
  } =
    useExperienceStack();

  const [
    historyOpen,
    setHistoryOpen
  ] =
    useState(
      false
    );

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const accountSheet =
    presentation ===
    'account-sheet';

  useEffect(() => {
    if (
      !historyOpen ||
      accountSheet
    ) {
      return;
    }

    const closeOnOutsidePointer =
      (
        event:
          PointerEvent
      ) => {
        if (
          !containerRef.current?.contains(
            event.target as Node
          )
        ) {
          setHistoryOpen(
            false
          );
        }
      };

    const closeOnEscape =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          'Escape'
        ) {
          setHistoryOpen(
            false
          );
        }
      };

    document.addEventListener(
      'pointerdown',
      closeOnOutsidePointer
    );

    document.addEventListener(
      'keydown',
      closeOnEscape
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        closeOnOutsidePointer
      );

      document.removeEventListener(
        'keydown',
        closeOnEscape
      );
    };
  }, [
    accountSheet,
    historyOpen
  ]);

  const closeAfterResolve =
    () => {
      setHistoryOpen(
        false
      );

      onResolved?.();
    };

  const previousExperience =
    () => {
      closeAfterResolve();

      void goBack();
    };

  const openEntry =
    (
      entryId:
        string
    ) => {
      closeAfterResolve();

      void jumpTo(
        entryId
      );
    };

  const resetExperience =
    () => {
      closeAfterResolve();

      void startFresh();
    };

  const removeHistory =
    () => {
      closeAfterResolve();

      void clearHistory();
    };

  const resetActions = (
    <div className="grid grid-cols-2 gap-2 border-t border-border/60 p-2">
      <button
        type="button"
        disabled={
          entries.length ===
            0 ||
          loading
        }
        onClick={
          resetExperience
        }
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-muted/45 px-3 py-2 text-[11px] font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
        <RotateCcw className="size-3.5" />

        Start fresh
      </button>

      <button
        type="button"
        disabled={
          entries.length ===
            0 ||
          loading
        }
        onClick={
          removeHistory
        }
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-destructive/5 px-3 py-2 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40">
        <Trash2 className="size-3.5" />

        Clear history
      </button>
    </div>
  );

  const historyEntries = (
    <>
      <div className="border-b border-border/60 p-2">
        <button
          type="button"
          disabled={
            !canGoBack ||
            loading
          }
          onClick={
            previousExperience
          }
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Undo2 className="size-4" />
          )}

          Previous experience
        </button>
      </div>

      <div
        className={cn(
          'overflow-y-auto overscroll-contain p-2',
          accountSheet
            ? 'max-h-[34dvh]'
            : 'max-h-[min(22rem,55dvh)]'
        )}>
        {entries.length >
        0 ? (
          <div className="space-y-1">
            {entries
              .slice(
                0,
                12
              )
              .map(
                (
                  entry,
                  index
                ) => (
                  <button
                    key={
                      entry.id
                    }
                    type="button"
                    aria-current={
                      index ===
                      0
                        ? 'page'
                        : undefined
                    }
                    onClick={() =>
                      openEntry(
                        entry.id
                      )
                    }
                    className={cn(
                      'flex w-full min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted',
                      index ===
                        0 &&
                        'bg-muted/60'
                    )}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-black text-primary">
                      {
                        index +
                        1
                      }
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                          {
                            entry.label
                          }
                        </span>

                        {index ===
                        0 ? (
                          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-primary">
                            Current
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {entry.subtitle ??
                          entry.categorySlug.replaceAll(
                            '-',
                            ' '
                          )}
                      </span>
                    </span>

                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {
                        formatVisitedAt(
                          entry.visitedAt
                        )
                      }
                    </span>
                  </button>
                )
              )}
          </div>
        ) : (
          <div className="p-5 text-center">
            <History className="mx-auto size-5 text-muted-foreground" />

            <p className="mt-2 text-xs font-semibold">
              No experience history yet
            </p>

            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Meaningful pages and Store experiences will appear here as you move around Shelsea.
            </p>
          </div>
        )}
      </div>

      {error ? (
        <p className="px-3 pb-2 text-[11px] text-destructive">
          {
            error
          }
        </p>
      ) : null}
    </>
  );

  if (
    accountSheet
  ) {
    return (
      <section
        ref={
          containerRef
        }
        className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
        <button
          type="button"
          aria-expanded={
            historyOpen
          }
          onClick={() =>
            setHistoryOpen(
              current =>
                !current
            )
          }
          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-muted/60">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <History className="size-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              Experience History
            </span>

            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {entries.length ===
              1
                ? '1 preserved experience'
                : `${entries.length} preserved experiences`}
            </span>
          </span>

          {entries.length >
          0 ? (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[9px] font-black leading-6 text-primary-foreground">
              {Math.min(
                entries.length,
                99
              )}
            </span>
          ) : null}

          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition',
              historyOpen &&
                'rotate-180'
            )}
          />
        </button>

        {historyOpen ? (
          <div className="border-t border-border/60 bg-background/45">
            {
              historyEntries
            }
          </div>
        ) : null}

        {
          resetActions
        }
      </section>
    );
  }

  return (
    <div
      ref={
        containerRef
      }
      className="relative">
      <button
        type="button"
        data-history-presentation="navbar-stacked"
        aria-expanded={
          historyOpen
        }
        aria-haspopup="dialog"
        aria-label="Open experience history"
        title="Experience history"
        onClick={() =>
          setHistoryOpen(
            current =>
              !current
          )
        }
        className="group flex flex-col items-center gap-1 rounded-full text-muted-foreground outline-none transition hover:text-foreground">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground transition group-hover:bg-muted/80 group-focus-visible:ring-2 group-focus-visible:ring-ring/50">
          <History className="size-4" />

          {entries.length >
          0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground shadow-sm">
              {Math.min(
                entries.length,
                99
              )}
            </span>
          ) : null}
        </span>

        <span className="hidden text-xs lg:inline">
          History
        </span>
      </button>

      {historyOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.7rem)] z-[180] w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-3xl border border-border/70 bg-background/96 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-bold">
                Experience History
              </p>

              <p className="text-[11px] text-muted-foreground">
                Return or jump without losing context.
              </p>
            </div>

            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition',
                historyOpen &&
                  'rotate-180'
              )}
            />
          </div>

          {
            historyEntries
          }

          {
            resetActions
          }
        </div>
      ) : null}
    </div>
  );
}
