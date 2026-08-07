'use client';

import {
  BellRing,
  Headphones,
  HelpCircle,
  MessageCircleQuestion,
  MessagesSquare,
  Sparkles,
  X
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGlobalOverlay } from '@/features/global-overlay';

import { cn } from '@/lib/utils';

import { useQuickSupportAttentionStream } from '../client/useQuickSupportAttentionStream';

import { useQuickSupportPanelState } from '../client/useQuickSupportPanelState';

import { useQuickSupportSummary } from '../client/useQuickSupportSummary';

import { useQuickSupportViewport } from '../client/useQuickSupportViewport';

import { QuickSupportChatWorkspace } from './QuickSupportChatWorkspace';

const QUICK_SUPPORT_OVERLAY_ID = 'quick-support-chat';

const hiddenPrefixes = [
  '/ai',
  '/admin',
  '/vendor',
  '/support',
  '/sign-in',
  '/sign-up',
  '/adminlogin',
  '/offline',
  '/delivery-access'
] as const;

export function QuickSupportChatLauncher() {
  const pathname = usePathname();

  const router = useRouter();

  const { activeOverlay, closeOverlay, hasOpenOverlay, openOverlay } = useGlobalOverlay();

  const { summary, loading, refresh, authenticationRequired } = useQuickSupportSummary();

  const { workspaceId, mode, markOpen, markMinimized } = useQuickSupportPanelState();

  const overlayOpen = activeOverlay?.id === QUICK_SUPPORT_OVERLAY_ID;

  useQuickSupportViewport(overlayOpen);

  const [showAttention, setShowAttention] = useState(false);

  const [launcherOpen, setLauncherOpen] = useState(false);

  const previousUnreadRef = useRef<number | null>(null);

  const previousOverlayOpenRef = useRef(false);

  const hidden = hiddenPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

  const hasActiveCase = Boolean(summary?.activeCase);

  const hasRestorableCase = Boolean(summary?.recentCases.length);

  const unreadCount = summary?.unreadCount ?? 0;

  const attentionCaseIds = useMemo(
    () => summary?.recentCases.slice(0, 5).map(item => item.id) ?? [],
    [summary?.recentCases]
  );

  const openSupport = useCallback((): void => {
    markOpen();

    setLauncherOpen(false);

    setShowAttention(false);

    openOverlay({
      id: QUICK_SUPPORT_OVERLAY_ID,

      eyebrow: (
        <span className="inline-flex items-center gap-2">
          <Headphones className="size-3.5" />
          Shelsea Support
        </span>
      ),

      title: hasActiveCase || hasRestorableCase ? 'Continue with Support' : 'Chat with Support',

      description:
        hasActiveCase || hasRestorableCase
          ? 'Your Support conversations are ready and connected to the live workspace.'
          : 'Start a live Support conversation without leaving your current experience.',

      content: <QuickSupportChatWorkspace />,

      variant: 'panel',

      size: 'sm',

      closeLabel: 'Minimize Support chat',

      surfaceClassName:
        'h-[var(--quick-support-viewport-height,100dvh)] max-h-[var(--quick-support-viewport-height,100dvh)] overscroll-none sm:h-dvh sm:max-h-none',

      bodyClassName: '!overflow-hidden !p-0'
    });
  }, [hasActiveCase, hasRestorableCase, markOpen, openOverlay]);

  useQuickSupportAttentionStream({
    workspaceId: summary?.workspaceId ?? workspaceId,

    caseIds: attentionCaseIds,

    enabled: Boolean(attentionCaseIds.length && !authenticationRequired && !overlayOpen && !hidden),

    onEvent: refresh
  });

  useEffect(() => {
    if (previousOverlayOpenRef.current && !overlayOpen) {
      markMinimized();
    }

    previousOverlayOpenRef.current = overlayOpen;
  }, [markMinimized, overlayOpen]);

  useEffect(() => {
    if (hidden && overlayOpen) {
      closeOverlay(QUICK_SUPPORT_OVERLAY_ID);

      markMinimized();
    }
  }, [closeOverlay, hidden, markMinimized, overlayOpen]);

  /* eslint-disable react-hooks/set-state-in-effect -- Attention visibility is derived from unread-count transitions received from the Support summary stream. */
  useEffect(() => {
    const previous = previousUnreadRef.current;

    if (previous === null) {
      previousUnreadRef.current = unreadCount;

      if (unreadCount > 0 && !overlayOpen && summary?.latestAgentReply) {
        setShowAttention(true);
      }

      return;
    }

    if (unreadCount > previous && !overlayOpen) {
      setShowAttention(true);
    }

    if (unreadCount === 0) {
      setShowAttention(false);
    }

    previousUnreadRef.current = unreadCount;
  }, [overlayOpen, summary?.latestAgentReply, unreadCount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!showAttention) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowAttention(false);
    }, 8_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showAttention]);

  if (hidden || hasOpenOverlay) {
    return null;
  }

  const label = hasActiveCase || hasRestorableCase ? 'Continue Support' : 'Support';

  const accessibleLabel =
    unreadCount > 0
      ? `${unreadCount} unread Support ${unreadCount === 1 ? 'message' : 'messages'}. Open Shelsea Support.`
      : hasActiveCase
        ? `Continue Shelsea Support Case ${summary?.activeCase?.caseNumber ?? ''}`
        : hasRestorableCase
          ? 'Continue Shelsea Support conversations'
          : 'Chat with Shelsea Support';

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  const launcherLabel =
    unreadCount > 0
      ? unreadCount +
        ' unread Support ' +
        (unreadCount === 1 ? 'message' : 'messages') +
        '. Open AJ assistance.'
      : 'Open AJ assistance';

  return (
    <>
      {showAttention && summary?.latestAgentReply ? (
        <aside
          aria-live="polite"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+11.75rem)] right-[var(--app-page-gutter)] z-[179] w-[min(88vw,20rem)] rounded-[1.35rem] border border-primary/25 bg-card/95 p-3 shadow-2xl backdrop-blur-xl md:bottom-[4.65rem] md:right-[calc(var(--app-page-gutter)+7.5rem)]">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BellRing className="size-4" />
            </span>

            <button type="button" onClick={openSupport} className="min-w-0 flex-1 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-primary">
                New Support reply
              </p>

              <p className="mt-1 truncate text-xs font-black">
                {summary.latestAgentReply.sender?.name ?? 'Shelsea Support'}
              </p>

              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
                {summary.latestAgentReply.bodyPreview}
              </p>
            </button>

            <button
              type="button"
              aria-label="Dismiss Support reply preview"
              onClick={() => setShowAttention(false)}
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        </aside>
      ) : null}

      {launcherOpen ? (
        <div
          role="menu"
          aria-label="AJ assistance options"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+8.35rem)] right-[var(--app-page-gutter)] z-[180] w-[min(86vw,18rem)] overflow-hidden rounded-[1.35rem] border border-primary/20 bg-card/95 p-2 shadow-2xl backdrop-blur-xl md:bottom-[4.75rem]">
          <button
            type="button"
            role="menuitem"
            aria-label={accessibleLabel}
            title={accessibleLabel}
            onClick={openSupport}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessagesSquare className="size-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-card bg-primary px-1 text-[8px] font-black leading-none text-primary-foreground">
                  {badgeLabel}
                </span>
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-foreground">
                {loading ? 'Support' : label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                {hasActiveCase || hasRestorableCase
                  ? 'Resume your connected Support conversation.'
                  : 'Open Quick Support only when you need a human.'}
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLauncherOpen(false);
              router.push('/ai');
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/12 text-primary">
              <MessageCircleQuestion className="size-5" />
              <Sparkles className="absolute right-1.5 top-1.5 size-2.5 text-accent" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-foreground">Ask Shelsea</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                Open AJ Intelligence for shopping and workspace guidance.
              </span>
            </span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={launcherLabel}
        title={launcherLabel}
        aria-haspopup="menu"
        aria-expanded={launcherOpen}
        data-support-workspace={summary?.workspaceId ?? workspaceId ?? undefined}
        data-support-panel-state={mode}
        data-support-unread={unreadCount}
        onClick={() => setLauncherOpen(current => !current)}
        className={cn(
          'group fixed bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] right-[var(--app-page-gutter)] z-[180] grid size-12 touch-manipulation place-items-center rounded-full border bg-background/95 text-foreground shadow-[0_18px_50px_-18px_rgba(0,0,0,0.7)] ring-1 ring-background/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:bottom-5',
          unreadCount > 0
            ? 'border-primary/60 shadow-xl shadow-primary/20'
            : launcherOpen
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-primary/30 hover:border-primary/50'
        )}>
        <span className="relative grid size-7 place-items-center">
          <HelpCircle className="size-5" />
          {unreadCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-2.5 -top-2.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[8px] font-black leading-none text-primary-foreground shadow-lg">
              {badgeLabel}
            </span>
          ) : (
            <Sparkles
              aria-hidden="true"
              className="absolute -right-1 -top-1 size-2.5 text-accent transition group-hover:rotate-12"
            />
          )}
        </span>
      </button>
    </>
  );
}
