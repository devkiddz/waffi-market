import Link from 'next/link';
import {
  ArrowUpRight,
  Bot,
  Sparkles
} from 'lucide-react';

import { cn } from '@/lib/utils';

type DashboardAIControlProps = {
  compact?: boolean;
};

export function DashboardAIControl({
  compact = false
}: DashboardAIControlProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card shadow-sm',
        compact && 'sm:hidden'
      )}>
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
          <Bot className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">
              Ask Shelsea
            </h2>
            <Sparkles className="size-3.5 text-violet-500" />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            Continue with your dashboard context.
          </p>
        </div>

        <Link
          href="/ai?source=customer-dashboard"
          aria-label="Open AJ Companion"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background">
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
