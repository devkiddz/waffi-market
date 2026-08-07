import Link from 'next/link';

import {
  ArrowRight
} from 'lucide-react';

import {
  cn
} from '@/lib/utils';

type ListingViewAllLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export function ListingViewAllLink({
  href,
  label = 'View all',
  className
}: ListingViewAllLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        `
          inline-flex h-9 shrink-0
          items-center gap-1.5
          rounded-full
          border border-[#C8A45D]/30
          bg-background/75
          px-3
          text-[0.68rem]
          font-bold
          text-foreground
          shadow-sm
          backdrop-blur-md
          transition
          hover:-translate-y-px
          hover:border-[#F43F5E]/40
          hover:bg-[#BE123C]/5
          hover:text-[#BE123C]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#C8A45D]/55
          dark:hover:text-[#F3E2BA]
          sm:px-4 sm:text-xs
        `,
        className
      )}>
      <span>
        {label}
      </span>

      <ArrowRight className="size-3.5" />
    </Link>
  );
}
