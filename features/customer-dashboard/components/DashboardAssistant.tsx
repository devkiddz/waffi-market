'use client';

import Link from 'next/link';

import {
  ArrowRight,
  Bot,
  ChevronRight,
  MessageCircle,
  Sparkles,
  X
} from 'lucide-react';

import {
  useCustomerDashboard
} from '../providers/CustomerDashboardProvider';

export function DashboardAssistant() {
  const {
    dashboard,
    assistantOpen,
    activeAssistantAction,
    openAssistant,
    closeAssistant,
    selectAssistantAction
  } = useCustomerDashboard();

  const { assistant } =
    dashboard;

  return (
    <>
      {assistantOpen ? (
        <aside className="fixed bottom-20 right-3 z-[90] w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl lg:bottom-6 lg:right-6">
          <div className="relative overflow-hidden bg-slate-950 p-4 text-white">
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/25 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-amber-200">
                  <Bot className="size-5" />
                </span>

                <div>
                  <p className="text-xs text-white/55">
                    Dashboard assistance
                  </p>

                  <h2 className="mt-0.5 text-lg font-bold">
                    AJ Companion
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAssistant}
                className="grid size-9 place-items-center rounded-xl bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
                aria-label="Close AJ Companion">
                <X className="size-4" />
              </button>
            </div>

            <p className="relative mt-3 text-sm leading-5 text-white/65">
              Choose a suggested action. The current workspace and dashboard context are passed with your request.
            </p>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto p-3.5">
            {activeAssistantAction ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <p className="text-xs font-semibold text-primary">
                  Selected action
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {
                    activeAssistantAction.title
                  }
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {
                    activeAssistantAction.prompt
                  }
                </p>

                <Link
                  href={
                    activeAssistantAction.href
                  }
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-foreground px-3.5 text-xs font-semibold text-background">
                  {
                    activeAssistantAction.actionLabel
                  }
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : null}

            <p className="px-1 text-xs font-semibold text-muted-foreground">
              Suggested next steps
            </p>

            {assistant.actions.map(
              action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() =>
                    selectAssistantAction(
                      action
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-3 text-left transition hover:border-primary/30 hover:bg-muted/60">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {action.title}
                    </span>

                    <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>

                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </button>
              )
            )}
          </div>
        </aside>
      ) : null}

      <button
        type="button"
        onClick={() =>
          openAssistant()
        }
        className="fixed bottom-20 right-3 z-40 flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 text-xs font-semibold text-white shadow-xl transition hover:-translate-y-0.5 lg:bottom-6 lg:right-6"
        aria-label="Open AJ Companion">
        <span className="relative">
          <MessageCircle className="size-5" />
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </span>

        <span className="hidden sm:inline">
          Ask Shelsea
        </span>
      </button>
    </>
  );
}
