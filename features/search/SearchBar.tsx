'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/providers/SearchProvider';

export default function SearchBar() {
  const { query, setQuery, setActiveIndex, setOpen, submitSearch, loading } = useSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ------------------------------ */
  /* Keyboard Shortcut */
  /* ------------------------------ */
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [setOpen]);

  /* ------------------------------ */
  /* Click Outside Safeguard */
  /* ------------------------------ */
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // 🚀 MOBILE SAFEGUARD: If the viewport width is less than 1024px (lg breakpoint),
      // do absolutely nothing! The mobile full-screen view handles its own boundaries.
      if (window.innerWidth < 1280) return;

      const target = event.target as HTMLElement;
      if (!wrapperRef.current) return;

      // Check if the click landed inside the input search bar wrapper
      const clickedInsideBar = wrapperRef.current.contains(target);

      // Check if the click landed inside the dropdown panels or chip targets
      const clickedInsideDropdown = target.closest('[data-search-dropdown="true"]');

      // ONLY close if the click missed BOTH the desktop bar and the desktop dropdown panels
      if (!clickedInsideBar && !clickedInsideDropdown) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setOpen]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        role="search"
        onSubmit={event => {
          event.preventDefault();
          submitSearch();
        }}
        className="flex h-11 items-center rounded-full bg-background shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
        <button
          type="submit"
          aria-label="Search Shelsea products"
          className="ml-2 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          value={query}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search clothing, hair, perfumes..."
          className="flex-1 bg-transparent px-3 text-sm outline-none border-0"
        />

        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}

        {!loading && query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="mr-1 h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        )}

        <kbd className="mr-2 hidden rounded-md border bg-muted px-2 py-1 text-[10px] text-muted-foreground xl:block">
          Ctrl K
        </kbd>
      </form>
    </div>
  );
}
