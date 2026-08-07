import Link from 'next/link';

export default function ProductPageNotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 py-16 text-center">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
          Product unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          This product could not be found.
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          It may have been unpublished, moved or removed from the active Shelsea catalog.
        </p>

        <Link
          href="/store"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground">
          Return to Store
        </Link>
      </div>
    </main>
  );
}
