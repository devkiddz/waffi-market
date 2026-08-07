'use client';

import {
  CheckCircle2,
  Download,
  RefreshCcw,
  Share,
  WifiOff,
  X
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  usePWARuntime
} from './PWARuntimeProvider';

export function PWAGlobalStatus() {
  const {
    platform,
    isOnline,
    updateReady,
    updateNoticeVisible,
    installGuideOpen,
    announcement,
    applyUpdate,
    dismissUpdateNotice,
    closeInstallGuide
  } =
    usePWARuntime();

  return (
    <>
      {!isOnline ? (
        <div
          role="status"
          className="
            fixed inset-x-3
            bottom-[max(0.75rem,env(safe-area-inset-bottom))]
            z-[220]
            mx-auto flex
            max-w-xl items-center
            gap-3 rounded-2xl
            border border-amber-500/25
            bg-slate-950/95
            px-4 py-3
            text-white shadow-2xl
            backdrop-blur-xl
          ">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
            <WifiOff className="size-4" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-bold">
              You are offline
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-white/60">
              Live prices, stock, Cart, orders and account data will resume when the connection returns.
            </p>
          </div>
        </div>
      ) : null}

      {updateReady &&
      updateNoticeVisible ? (
        <div
          role="status"
          className="
            fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))]
            left-3 right-3 z-[215]
            mx-auto flex max-w-xl
            items-center gap-3
            rounded-2xl border
            border-border/70
            bg-card/95 px-4 py-3
            shadow-2xl
            backdrop-blur-xl
          ">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <RefreshCcw className="size-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold">
              Shelsea update ready
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
              Refresh when convenient. Your current experience will not be interrupted automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void applyUpdate()
            }
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-3 text-[10px] font-bold text-primary-foreground">
            Update
          </button>

          <button
            type="button"
            title="Dismiss update notice"
            aria-label="Dismiss update notice"
            onClick={
              dismissUpdateNotice
            }
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {announcement ? (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed left-1/2
            top-[calc(var(--app-navbar-height)+max(0.75rem,env(safe-area-inset-top)))]
            z-[230]
            flex max-w-[calc(100vw-1.5rem)]
            -translate-x-1/2
            items-center gap-2
            rounded-full border
            border-emerald-500/20
            bg-card/95 px-4 py-2.5
            text-xs font-semibold
            shadow-xl backdrop-blur-xl
          ">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />

          <span className="truncate">
            {
              announcement
            }
          </span>
        </div>
      ) : null}

      {installGuideOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-[240] grid place-items-end bg-black/65 p-3 backdrop-blur-sm sm:place-items-center">
          <section className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-background shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  Early Access App
                </p>

                <h2
                  id="pwa-install-guide-title"
                  className="mt-1 text-xl font-black tracking-tight">
                  Install Shelsea
                </h2>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {platform ===
                  'ios'
                    ? 'Safari uses the iPhone or iPad Share menu for installation.'
                    : 'Use your browser installation control to add Shelsea as an app.'}
                </p>
              </div>

              <button
                type="button"
                title="Close installation guide"
                aria-label="Close installation guide"
                onClick={
                  closeInstallGuide
                }
                className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </header>

            <div className="space-y-3 p-5 sm:p-6">
              {platform ===
              'ios' ? (
                <>
                  <InstallStep
                    number="1"
                    icon={
                      <Share className="size-4" />
                    }
                    title="Open the Share menu"
                    description="Tap Safari’s Share button while Shelsea is open."
                  />

                  <InstallStep
                    number="2"
                    icon={
                      <Download className="size-4" />
                    }
                    title="Choose Add to Home Screen"
                    description="Scroll through the Share actions and select Add to Home Screen."
                  />

                  <InstallStep
                    number="3"
                    icon={
                      <CheckCircle2 className="size-4" />
                    }
                    title="Confirm Add"
                    description="Keep the Shelsea name and icon, then tap Add."
                  />
                </>
              ) : (
                <>
                  <InstallStep
                    number="1"
                    icon={
                      <Download className="size-4" />
                    }
                    title="Open the browser menu"
                    description="Look for Install app, Apps, or Add to Home Screen."
                  />

                  <InstallStep
                    number="2"
                    icon={
                      <CheckCircle2 className="size-4" />
                    }
                    title="Confirm installation"
                    description="Shelsea will open in its own app window after installation."
                  />
                </>
              )}

              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-primary">
                  Beta update policy
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  New versions wait for your approval. Shelsea will show an Update button instead of refreshing the installed app while you are using it.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function InstallStep({
  number,
  icon,
  title,
  description
}: {
  number:
    string;

  icon:
    ReactNode;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card/70 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {
          icon
        }
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
          Step{' '}
          {
            number
          }
        </p>

        <p className="mt-1 text-sm font-bold">
          {
            title
          }
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}
