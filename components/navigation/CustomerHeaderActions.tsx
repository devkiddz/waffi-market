'use client';

import Link from 'next/link';
import { Package, Search } from 'lucide-react';

import UserActionComponent from '@/components/UserActionComponent';
import { CommunicationBell } from '@/features/communication';
import { useSearch } from '@/providers/SearchProvider';

export default function CustomerHeaderActions() {
  const { setOpen } = useSearch();

  return (
    <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 lg:gap-2">
      <button type="button" onClick={() => setOpen(true)} aria-label="Open search"
        className="grid size-10 place-items-center rounded-md transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden">
        <Search className="size-5" />
      </button>
      <Link href="/orders" aria-label="Returns and orders"
        className="hidden h-11 shrink-0 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex">
        <Package className="size-5 2xl:hidden" />
        <span className="hidden leading-tight 2xl:block">
          <span className="block text-xs text-muted-foreground">Returns &</span>
          <span className="block font-semibold">Orders</span>
        </span>
      </Link>
      <CommunicationBell />
      <UserActionComponent />
    </div>
  );
}
