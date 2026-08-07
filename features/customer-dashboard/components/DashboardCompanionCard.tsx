'use client';

import {
  ArrowRight,
  Bot,
  Sparkles
} from 'lucide-react';

import {
  useCustomerDashboard
} from '../providers/CustomerDashboardProvider';

export function DashboardCompanionCard() {
  const {
    dashboard,
    openAssistant,
    selectAssistantAction
  } = useCustomerDashboard();

  const actions =
    dashboard.assistant.actions.slice(
      0,
      3
    );

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />

      <header className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-200">
            Companion
          </p>

          <h3 className="mt-1 text-lg font-bold">
            Ask Shelsea
          </h3>

          <p className="mt-1 text-sm leading-5 text-white/60">
            Practical assistance grounded in your current workspace.
          </p>
        </div>

        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-200">
          <Bot className="size-4.5" />
        </span>
      </header>

      <div className="relative mt-4 grid gap-2">
        {actions.map(
          action => (
            <button
              key={action.id}
              type="button"
              onClick={() =>
                selectAssistantAction(
                  action
                )
              }
              className="group flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-violet-200">
                <Sparkles className="size-3.5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 break-words text-sm font-semibold leading-5">
                  {action.title}
                </span>

                <span className="mt-1 block line-clamp-2 break-words text-xs leading-4 text-white/55">
                  {action.description}
                </span>
              </span>

              <ArrowRight className="mt-1 size-4 shrink-0 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          openAssistant()
        }
        className="relative mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-slate-950 transition hover:bg-white/90">
        Open AJ Companion
        <ArrowRight className="size-4" />
      </button>
    </article>
  );
}
