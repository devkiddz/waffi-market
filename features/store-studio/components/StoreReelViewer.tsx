'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import Link from 'next/link';

import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  ExternalLink,
  Pause,
  Play,
  ShoppingBag,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import type { FeedActions } from '@/features/feed-experience/contracts';
import { cn } from '@/lib/utils';

import type { StoreStudioReelProjection } from '../contracts';

type StoreReelViewerProps = {
  reels: StoreStudioReelProjection[];
  activeReelId: string | null;
  actions: FeedActions;
  onActiveReelChange: (reelId: string) => void;
  onClose: () => void;
};

type ReelPreviewTileProps = {
  reel: StoreStudioReelProjection;
  active: boolean;
  onSelect: (reelId: string) => void;
};

function formatDuration(durationMs: number | null): string | null {
  if (!durationMs || durationMs <= 0) {
    return null;
  }

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function ReelPreviewTile({
  reel,
  active,
  onSelect
}: ReelPreviewTileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(reel.id)}
      aria-label={`Open ${reel.title}`}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'group relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-xl border bg-zinc-900 text-left transition sm:w-24',
        active
          ? 'border-amber-400/80 ring-2 ring-amber-400/20'
          : 'border-white/10 opacity-65 hover:border-white/25 hover:opacity-100'
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-amber-950 to-emerald-950"
      />

      {reel.posterUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${JSON.stringify(reel.posterUrl)})`,
            backgroundPosition: reel.posterObjectPosition
          }}
        />
      ) : (
        <Clapperboard className="absolute inset-0 m-auto size-7 text-white/25" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/15" />

      <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-2 text-[9px] font-bold leading-3 text-white">
        {reel.title}
      </p>
    </button>
  );
}

export function StoreReelViewer({
  reels,
  activeReelId,
  actions,
  onActiveReelChange,
  onClose
}: StoreReelViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeIndex = useMemo(
    () => reels.findIndex(reel => reel.id === activeReelId),
    [activeReelId, reels]
  );

  const activeReel =
    activeIndex >= 0 ? reels[activeIndex] : null;

  const canMovePrevious = activeIndex > 0;
  const canMoveNext =
    activeIndex >= 0 && activeIndex < reels.length - 1;

  const movePrevious = useCallback(() => {
    const previous = reels[activeIndex - 1];

    if (previous) {
      onActiveReelChange(previous.id);
    }
  }, [activeIndex, onActiveReelChange, reels]);

  const moveNext = useCallback(() => {
    const next = reels[activeIndex + 1];

    if (next) {
      onActiveReelChange(next.id);
      return;
    }

    onClose();
  }, [activeIndex, onActiveReelChange, onClose, reels]);

  useEffect(() => {
    setMediaFailed(false);
    setPlaying(true);
    setProgress(0);
  }, [activeReelId]);

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }

      return;
    }

    video.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeReel) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        movePrevious();
      }

      if (event.key === 'ArrowRight') {
        moveNext();
      }

      if (event.key === ' ') {
        event.preventDefault();
        void togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeReel, moveNext, movePrevious, togglePlayback]);

  const openFeedTarget = useCallback(() => {
    if (!activeReel) {
      return;
    }

    if (activeReel.productId) {
      actions.openExperience({
        type: 'product',
        productId: activeReel.productId
      });
      onClose();
      return;
    }

    if (activeReel.collectionId) {
      actions.openExperience({
        type: 'collection',
        collectionId: activeReel.collectionId
      });
      onClose();
      return;
    }

    if (activeReel.promotionId) {
      if (actions.previewPromotion) {
        actions.previewPromotion(activeReel.promotionId);
        onClose();
        return;
      }

      actions.openExperience({
        type: 'promotion',
        promotionId: activeReel.promotionId
      });
      onClose();
    }
  }, [actions, activeReel, onClose]);

  const hasFeedTarget = Boolean(
    activeReel?.productId ||
      activeReel?.collectionId ||
      activeReel?.promotionId
  );

  const primaryActionLabel = activeReel?.productId
    ? 'Shop this Reel'
    : activeReel?.action?.label ?? 'Explore Reel';

  const destinationTitle = activeReel?.productId
    ? 'Product linked to this Reel'
    : activeReel?.collectionId
      ? 'Collection featured in this Reel'
      : activeReel?.promotionId
        ? 'Promotion featured in this Reel'
        : 'Explore this Reel';

  const destinationDescription = activeReel?.productId
    ? 'Open the Reel destination to review the product, choose a variant, and purchase without losing the experience.'
    : activeReel?.collectionId
      ? 'Continue into the featured collection and browse the products assembled for this Reel.'
      : activeReel?.promotionId
        ? 'Open the linked promotion and continue shopping from the campaign.'
        : 'Continue to the destination connected to this Store Reel.';

  const formattedDuration = formatDuration(
    activeReel?.durationMs ?? null
  );

  return (
    <Dialog
      open={Boolean(activeReel)}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="left-0 top-[var(--pwa-safe-top)] bottom-0 h-auto max-h-none w-[100vw] max-w-[100vw] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-zinc-950 p-0 text-white shadow-[0_0_70px_rgba(0,0,0,0.42)] ring-0 md:left-1/2 md:top-1/2 md:bottom-auto md:h-[min(92dvh,54rem)] md:w-[min(94vw,78rem)] md:max-w-[78rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:border-white/10"
      >
        <DialogTitle className="sr-only">
          {activeReel?.title ?? 'Store Reel'}
        </DialogTitle>

        <DialogDescription className="sr-only">
          Store Reel viewer with a dedicated media stage and commerce details panel.
        </DialogDescription>

        {activeReel ? (
          <div className="relative grid size-full min-h-0 grid-rows-[minmax(0,62%)_minmax(0,38%)] overflow-hidden md:grid-cols-[minmax(20rem,0.92fr)_minmax(24rem,1.08fr)] md:grid-rows-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Reel viewer"
              className="absolute right-3 top-3 z-50 grid size-10 place-items-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-md transition hover:bg-white/10 md:right-5 md:top-5"
            >
              <X className="size-5" />
            </button>

            <section className="relative min-h-0 overflow-hidden bg-black">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950"
              />

              {activeReel.posterUrl ? (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-3xl"
                  style={{
                    backgroundImage: `url(${JSON.stringify(activeReel.posterUrl)})`,
                    backgroundPosition: activeReel.posterObjectPosition
                  }}
                />
              ) : null}

              {!mediaFailed ? (
                <video
                  key={activeReel.id}
                  ref={videoRef}
                  src={activeReel.videoUrl}
                  poster={activeReel.posterUrl ?? undefined}
                  style={{ objectPosition: activeReel.posterObjectPosition }}
                  autoPlay
                  playsInline
                  muted={muted}
                  onClick={() => void togglePlayback()}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={event => {
                    const video = event.currentTarget;

                    if (
                      Number.isFinite(video.duration) &&
                      video.duration > 0
                    ) {
                      setProgress(
                        Math.min(
                          100,
                          (video.currentTime / video.duration) * 100
                        )
                      );
                    }
                  }}
                  onEnded={moveNext}
                  onError={() => setMediaFailed(true)}
                  className="relative z-10 size-full cursor-pointer object-cover"
                />
              ) : (
                <div className="relative z-10 grid size-full place-items-center px-8 text-center">
                  <div>
                    <Clapperboard className="mx-auto size-10 text-white/30" />
                    <p className="mt-4 text-sm font-bold">
                      Reel media unavailable
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      The Reel details and commerce destination remain available.
                    </p>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/55 via-transparent to-black/45" />

              <div
                aria-hidden="true"
                className="absolute inset-x-3 top-3 z-30 flex gap-1 pr-12 md:pr-3"
              >
                {reels.map((reel, index) => (
                  <span
                    key={reel.id}
                    className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
                  >
                    <span
                      className="block h-full bg-white transition-all duration-150"
                      style={{
                        width:
                          index < activeIndex
                            ? '100%'
                            : index === activeIndex
                              ? `${progress}%`
                              : '0%'
                      }}
                    />
                  </span>
                ))}
              </div>

              <div className="absolute left-4 top-7 z-30 min-w-0 pr-16 md:left-5">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                  {activeReel.vendorName ?? 'Shelsea'}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/70">
                  Reel {activeIndex + 1} of {reels.length}
                </p>
              </div>

              {!playing && !mediaFailed ? (
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  aria-label="Play Reel"
                  className="absolute inset-0 z-30 m-auto grid size-16 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md"
                >
                  <Play className="ml-1 size-6 fill-current" />
                </button>
              ) : null}

              <div className="absolute bottom-4 right-3 z-40 flex flex-col gap-2 md:bottom-5 md:right-5">
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  disabled={mediaFailed}
                  aria-label={playing ? 'Pause Reel' : 'Play Reel'}
                  className="grid size-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 disabled:opacity-35"
                >
                  {playing ? (
                    <Pause className="size-4 fill-current" />
                  ) : (
                    <Play className="ml-0.5 size-4 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMuted(current => !current)}
                  disabled={mediaFailed}
                  aria-label={muted ? 'Unmute Reel' : 'Mute Reel'}
                  className="grid size-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 disabled:opacity-35"
                >
                  {muted ? (
                    <VolumeX className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={movePrevious}
                disabled={!canMovePrevious}
                aria-label="Previous Reel"
                className="absolute left-2 top-1/2 z-40 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 md:left-4"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                type="button"
                onClick={moveNext}
                disabled={!canMoveNext}
                aria-label="Next Reel"
                className="absolute right-2 top-1/2 z-40 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 md:right-4"
              >
                <ChevronRight className="size-5" />
              </button>
            </section>

            <aside className="flex min-h-0 flex-col border-t border-white/10 bg-zinc-950 md:border-l md:border-t-0">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8">
                <div className="pr-12">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                    Shelsea · Store Reels
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-4xl md:leading-tight">
                    {activeReel.title}
                  </h2>

                  {activeReel.caption ? (
                    <p className="mt-3 text-sm leading-6 text-white/65 md:text-base md:leading-7">
                      {activeReel.caption}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/60">
                    Reel {activeIndex + 1} of {reels.length}
                  </span>

                  {formattedDuration ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/60">
                      {formattedDuration}
                    </span>
                  ) : null}

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/60">
                    {activeReel.vendorName ?? 'Shelsea'}
                  </span>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-black">
                      <ShoppingBag className="size-4" />
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white md:text-base">
                        {destinationTitle}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-white/50 md:text-sm md:leading-6">
                        {destinationDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                    {activeReel.detailHref ? (
                      <Link
                        href={activeReel.detailHref}
                        onClick={onClose}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-black text-black transition hover:bg-white/90"
                      >
                        <ShoppingBag className="size-4" />
                        <span className="truncate">
                          {primaryActionLabel}
                        </span>
                      </Link>
                    ) : hasFeedTarget ? (
                      <button
                        type="button"
                        onClick={openFeedTarget}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-black text-black transition hover:bg-white/90"
                      >
                        <ShoppingBag className="size-4" />
                        <span className="truncate">
                          {primaryActionLabel}
                        </span>
                      </button>
                    ) : activeReel.action ? (
                      <Link
                        href={activeReel.action.href}
                        onClick={onClose}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-black text-black transition hover:bg-white/90"
                      >
                        <ExternalLink className="size-4" />
                        <span className="truncate">
                          {activeReel.action.label}
                        </span>
                      </Link>
                    ) : null}

                    {activeReel.detailHref && hasFeedTarget ? (
                      <button
                        type="button"
                        onClick={openFeedTarget}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-black text-white transition hover:bg-white/10"
                      >
                        <ExternalLink className="size-4" />
                        Quick preview
                      </button>
                    ) : null}
                  </div>
                </div>

                {reels.length > 1 ? (
                  <div className="mt-7">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">
                          More Store Reels
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          Select another Reel without leaving the viewer.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {reels.map(reel => (
                        <ReelPreviewTile
                          key={reel.id}
                          reel={reel}
                          active={reel.id === activeReel.id}
                          onSelect={onActiveReelChange}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-4 md:p-5">
                <button
                  type="button"
                  onClick={movePrevious}
                  disabled={!canMovePrevious}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={moveNext}
                  disabled={!canMoveNext}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
