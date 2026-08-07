'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import DiscoverExperienceShell from './DiscoverExperienceShell';

type MobileDiscoverySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileDiscoverySheet({ open, onOpenChange }: MobileDiscoverySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          '!fixed !inset-y-0 !right-0 !h-dvh !w-screen !max-w-none',
          'overflow-hidden border-0 bg-background p-0 lg:hidden',
          '[&_[data-slot=sheet-close]]:hidden'
        )}>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close Discovery Hub"
          className={cn(
            'fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[100]',
            'grid size-10 place-items-center rounded-full border border-border/70',
            'bg-background/90 text-foreground shadow-lg backdrop-blur-xl',
            'transition hover:bg-card'
          )}>
          <X className="size-5" />
        </button>

        <SheetHeader className="sr-only">
          <SheetTitle>Discovery Hub</SheetTitle>
          <SheetDescription>Explore your personalized Shelsea workspace.</SheetDescription>
        </SheetHeader>

        <div className="h-full min-h-0 w-full overflow-hidden">
          <DiscoverExperienceShell />
        </div>
      </SheetContent>
    </Sheet>
  );
}
