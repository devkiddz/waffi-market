'use client';

import Link from 'next/link';

import {
  usePathname
} from 'next/navigation';

import {
  MessageCircleQuestion,
  Sparkles
} from 'lucide-react';

import {
  useGlobalOverlay
} from '@/features/global-overlay';

const hiddenPrefixes = [
  '/ai',
  '/admin/assistant',
  '/vendor/assistant',
  '/sign-in',
  '/sign-up',
  '/adminlogin',
  '/offline',
  '/delivery-access'
] as const;

function assistantDestination(
  pathname:
    string
) {
  if (
    pathname.startsWith(
      '/admin'
    )
  ) {
    return {
      href:
        '/admin/assistant',
      label:
        'Ask Shelsea about this workspace'
    };
  }

  if (
    pathname.startsWith(
      '/vendor'
    )
  ) {
    return {
      href:
        '/vendor/assistant',
      label:
        'Ask Shelsea about your Vendor workspace'
    };
  }

  return {
    href:
      '/ai',
    label:
      'Ask Shelsea for shopping help'
  };
}

export function AssistantAccessButton() {
  const pathname =
    usePathname();

  const {
    hasOpenOverlay
  } =
    useGlobalOverlay();

  const operationalWorkspace =
    pathname.startsWith(
      '/admin'
    ) ||
    pathname.startsWith(
      '/vendor'
    );

  if (
    !operationalWorkspace ||
    hasOpenOverlay ||
    hiddenPrefixes.some(
      prefix =>
        pathname ===
          prefix ||
        pathname.startsWith(
          `${prefix}/`
        )
    )
  ) {
    return null;
  }

  const destination =
    assistantDestination(
      pathname
    );

  return (
    <Link
      href={
        destination.href
      }
      aria-label={
        destination.label
      }
      title={
        destination.label
      }
      className="group fixed bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] right-[var(--app-page-gutter)] z-[180] inline-flex h-11 items-center gap-2 rounded-full border border-accent/35 bg-primary px-3.5 text-xs font-black text-primary-foreground shadow-[0_18px_50px_-18px_rgba(0,0,0,0.7)] ring-1 ring-background/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:bottom-5 md:h-12 md:px-4">
      <span className="relative grid size-6 shrink-0 place-items-center">
        <MessageCircleQuestion className="size-5" />

        <Sparkles className="absolute -right-1 -top-1 size-2.5 text-accent transition group-hover:rotate-12" />
      </span>

      <span>
        Ask Shelsea
      </span>
    </Link>
  );
}
