'use client';

import {
  Menu,
  PanelLeftClose
} from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';

export default function SidebarToggle() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title={open ? 'Collapse navigation' : 'Open navigation'}
      aria-label={open ? 'Collapse navigation' : 'Open navigation'}
      className="grid size-10 shrink-0 place-items-center rounded-md text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {open ? <PanelLeftClose className="size-[1.15rem]" /> : <Menu className="size-[1.15rem]" />}
    </button>
  );
}
