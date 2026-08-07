'use client';

import {
  RefreshCcw,
  Store,
  WifiOff
} from 'lucide-react';

import {
  useEffect,
  useState
} from 'react';

export function OfflineRecovery() {
  const [
    online,
    setOnline
  ] = useState(
    false
  );

  useEffect(() => {
    const sync =
      () => {
        setOnline(
          navigator.onLine
        );
      };

    sync();

    window.addEventListener(
      'online',
      sync
    );

    window.addEventListener(
      'offline',
      sync
    );

    return () => {
      window.removeEventListener(
        'online',
        sync
      );

      window.removeEventListener(
        'offline',
        sync
      );
    };
  }, []);

  return (
    <main className="grid min-h-[70dvh] place-items-center px-[var(--app-page-gutter)] py-12">
      <section className="w-full max-w-lg rounded-[2rem] border border-border/60 bg-card/85 p-7 text-center shadow-xl sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff className="size-6" />
        </span>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          Installed-app recovery
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight">
          You are currently offline
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Shelsea keeps the offline shell available, but live prices, stock, Cart, orders, payments and personalized commerce data are never treated as offline truth.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={
              !online
            }
            onClick={() =>
              window.location.reload()
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-45">
            <RefreshCcw className="size-4" />

            {online
              ? 'Try again'
              : 'Waiting for network'}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                '/store';
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border bg-background/60 px-5 text-sm font-bold">
            <Store className="size-4" />

            Open Store
          </button>
        </div>
      </section>
    </main>
  );
}
