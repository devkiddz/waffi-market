'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useWorkspace } from '@/features/workspace';
import { cn } from '@/lib/utils';

type MarketplaceLinkProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

export function MarketplaceLink({
  children,
  className,
  href = '/vendors'
}: MarketplaceLinkProps) {
  const { activeWorkspace, loading } = useWorkspace();

  if (
    loading ||
    !activeWorkspace?.commerceCapabilities.vendorDirectoryVisible
  ) {
    return null;
  }

  return (
    <Link href={href} className={cn(className)}>
      {children}
    </Link>
  );
}
