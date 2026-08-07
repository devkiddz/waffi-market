'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  ListPlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useShoppingLists } from '../client';
import type { ShoppingList } from '../shoppingListTypes';
import { ShoppingListCard } from './ShoppingListCard';
import { ShoppingListFormDialog } from './ShoppingListFormDialog';

export function ShoppingListsWorkspace() {
  const searchParams = useSearchParams();
  const { lists, loading, mutating, error, refresh, createList, updateList, archiveList } =
    useShoppingLists();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ShoppingList | null>(null);

  useEffect(() => {
    if (searchParams.get('create') !== 'true') return;

    queueMicrotask(() => setFormOpen(true));
  }, [searchParams]);

  const filteredLists = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return lists;
    return lists.filter(list =>
      `${list.name} ${list.description ?? ''}`.toLowerCase().includes(clean)
    );
  }, [lists, query]);

  const pendingCount = lists.filter(list => list.publicationStatus === 'PENDING_REVIEW').length;
  const publicCount = lists.filter(list => list.publicationStatus === 'APPROVED').length;

  async function saveList(input: { name: string; description?: string }) {
    if (editingList) {
      await updateList(editingList.id, {
        name: input.name,
        description: input.description ?? null
      });
    } else {
      await createList(input);
    }

    setFormOpen(false);
    setEditingList(null);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="mt-6 overflow-hidden rounded-[2rem] border bg-card">
        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="size-3.5" />
                Personal planning space
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
                Shopping Lists
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Keep every list inside your private dashboard. When a plan is ready to inspire other shoppers,
                submit it for review; Shelsea publishes it to the Store only after administrator approval.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingList(null);
                setFormOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">
              <Plus className="size-4" />
              Create list
            </button>
          </div>
        </div>

        <div className="grid border-t sm:grid-cols-2 xl:grid-cols-4">
          <Metric value={lists.length} label="Active lists" icon={ListPlus} />
          <Metric
            value={lists.reduce((sum, list) => sum + list.itemCount, 0)}
            label="Unique products"
            icon={Sparkles}
          />
          <Metric value={pendingCount} label="Awaiting approval" icon={ShieldCheck} />
          <Metric value={publicCount} label="Approved public lists" icon={Eye} last />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Your collections
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Continue a plan</h2>
          </div>
          <div className="flex gap-2">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border bg-background px-3 sm:w-72">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search lists"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="grid size-10 place-items-center rounded-xl border hover:bg-muted disabled:opacity-50"
              aria-label="Refresh lists">
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[28rem] animate-pulse rounded-3xl border bg-muted/40" />
            ))}
          </div>
        ) : filteredLists.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredLists.map(list => (
              <ShoppingListCard
                key={list.id}
                list={list}
                onEdit={selectedList => {
                  setEditingList(selectedList);
                  setFormOpen(true);
                }}
                onArchive={setArchiveTarget}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid min-h-80 place-items-center rounded-3xl border border-dashed bg-muted/10 p-8 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-background shadow-sm">
                <ListPlus className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {query ? 'No matching lists' : 'Your first list starts here'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {query
                  ? 'Try another search phrase.'
                  : 'Create a private list for weekly essentials, a celebration, gifting, restocking or any shopping purpose.'}
              </p>
              {!query ? (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background">
                  <Plus className="size-4" />
                  Create first list
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <ShoppingListFormDialog
        open={formOpen}
        list={editingList}
        busy={mutating}
        onClose={() => {
          if (!mutating) {
            setFormOpen(false);
            setEditingList(null);
          }
        }}
        onSubmit={saveList}
      />

      {archiveTarget ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-3xl border bg-background p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">Archive “{archiveTarget.name}”?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The list will leave your active workspace. Any pending public request will be cancelled.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={mutating}
                className="h-10 rounded-xl border px-4 text-sm font-medium">
                Cancel
              </button>
              <button
                type="button"
                disabled={mutating}
                onClick={async () => {
                  await archiveList(archiveTarget.id);
                  setArchiveTarget(null);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground">
                {mutating ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Archive
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Metric({
  value,
  label,
  icon: Icon,
  last = false
}: {
  value: number;
  label: string;
  icon: typeof ListPlus;
  last?: boolean;
}) {
  return (
    <div className={`p-5 ${last ? '' : 'border-b sm:border-r xl:border-b-0'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}
