import {
  Bell,
  CircleDashed,
  PackageCheck,
  ShieldCheck
} from 'lucide-react';

export default function NotificationSettingsPage() {
  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-200">
              <Bell className="size-5" />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                Notification foundation
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Alerts will be controlled from one trusted centre.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                The Notification Engine is not active yet, so Shelsea does not claim that push, deals or unread-alert delivery is enabled.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
            <PackageCheck className="size-5 text-primary" />

            <h2 className="mt-4 text-sm font-black">
              Commerce events
            </h2>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Orders, deliveries, Shopping List preparation and support updates will become verified notification sources.
            </p>
          </article>

          <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
            <ShieldCheck className="size-5 text-primary" />

            <h2 className="mt-4 text-sm font-black">
              Customer control
            </h2>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Channel preferences, muting and per-list notification control will be persisted rather than simulated locally.
            </p>
          </article>

          <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
            <CircleDashed className="size-5 text-primary" />

            <h2 className="mt-4 text-sm font-black">
              Current state
            </h2>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No unread count or subscription state is available until the dedicated Notification Engine is implemented.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
