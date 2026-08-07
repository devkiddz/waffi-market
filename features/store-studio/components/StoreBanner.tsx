'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import type { StoreStudioBannerSlideProjection } from '../contracts';

type StoreBannerProps = {
  slides: StoreStudioBannerSlideProjection[];
};

const RETRY_FAILED_SOURCE_AFTER_MS = 8000;

function sourceAvailable(
  source: string | null | undefined,
  failedSources: Set<string>
): source is string {
  return Boolean(source?.trim()) && !failedSources.has(source!.trim());
}

function directRemoteMedia(source: string): boolean {
  return /^https?:\/\//i.test(source);
}

export function StoreBanner({ slides }: StoreBannerProps) {
  const orderedSlides = useMemo(
    () => [...slides].sort((firstSlide, secondSlide) => firstSlide.position - secondSlide.position),
    [slides]
  );

  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set());
  const retryTimersRef = useRef<Map<string, number>>(new Map());

  const activeIndex = useMemo(() => {
    if (!activeSlideId) return 0;

    const resolvedIndex = orderedSlides.findIndex(slide => slide.id === activeSlideId);
    return resolvedIndex >= 0 ? resolvedIndex : 0;
  }, [activeSlideId, orderedSlides]);

  const activeSlide = orderedSlides[activeIndex];

  const markSourceFailed = useCallback((source: string | null | undefined) => {
    const normalizedSource = source?.trim();
    if (!normalizedSource) return;

    setFailedSources(current => {
      if (current.has(normalizedSource)) return current;
      const next = new Set(current);
      next.add(normalizedSource);
      return next;
    });

    const existingTimer = retryTimersRef.current.get(normalizedSource);
    if (existingTimer) window.clearTimeout(existingTimer);

    const timer = window.setTimeout(() => {
      retryTimersRef.current.delete(normalizedSource);
      setFailedSources(current => {
        if (!current.has(normalizedSource)) return current;
        const next = new Set(current);
        next.delete(normalizedSource);
        return next;
      });
    }, RETRY_FAILED_SOURCE_AFTER_MS);

    retryTimersRef.current.set(normalizedSource, timer);
  }, []);

  useEffect(() => {
    const timers = retryTimersRef.current;

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!activeSlide || orderedSlides.length < 2 || !activeSlide.autoplay) return;

    const duration = Math.max(activeSlide.durationMs || 0, 3500);
    const timer = window.setTimeout(() => {
      const nextSlide = orderedSlides[(activeIndex + 1) % orderedSlides.length];
      setActiveSlideId(nextSlide?.id ?? null);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeIndex, activeSlide, orderedSlides]);

  useEffect(() => {
    if (!activeSlide || orderedSlides.length < 2) return;

    const nextSlide = orderedSlides[(activeIndex + 1) % orderedSlides.length];
    if (!nextSlide || nextSlide.mediaType === 'video') return;

    const preloadSource =
      nextSlide.mobileMediaUrl?.trim() ||
      nextSlide.posterUrl?.trim() ||
      nextSlide.mediaUrl.trim();

    if (!preloadSource) return;

    const preloadImage = new window.Image();
    preloadImage.decoding = 'async';
    preloadImage.src = preloadSource;
  }, [activeIndex, activeSlide, orderedSlides]);

  if (!activeSlide) return null;

  const desktopSource = activeSlide.mediaUrl.trim();
  const mobileSource = activeSlide.mobileMediaUrl?.trim() ?? '';
  const posterSource = activeSlide.posterUrl?.trim() ?? '';

  const desktopMediaAvailable = sourceAvailable(desktopSource, failedSources);
  const mobileMediaAvailable = sourceAvailable(mobileSource, failedSources);
  const posterAvailable = sourceAvailable(posterSource, failedSources);
  const videoAvailable = desktopMediaAvailable || mobileMediaAvailable;
  const imageAvailable = desktopMediaAvailable || mobileMediaAvailable;

  return (
    <section
      aria-label={activeSlide.title || 'Store banner'}
      aria-live="polite"
      className="relative isolate min-h-44 overflow-hidden rounded-[var(--app-card-radius)] border border-border/50 bg-zinc-950 shadow-sm [contain:paint] sm:min-h-52">
      <div className="relative aspect-[16/8] min-h-44 sm:aspect-[16/5] sm:min-h-52">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-amber-950/80 to-emerald-950"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-72 rounded-full bg-amber-500/25 blur-3xl sm:size-96"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 right-[8%] size-72 rounded-full bg-emerald-500/20 blur-3xl sm:size-[28rem]"
        />

        {activeSlide.mediaType === 'video' && videoAvailable ? (
          <div
            key={`${activeSlide.id}:${mobileSource}:${desktopSource}`}
            className="absolute inset-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            <video
              autoPlay={activeSlide.autoplay}
              muted
              loop={orderedSlides.length === 1}
              playsInline
              preload="metadata"
              poster={posterAvailable ? posterSource : undefined}
              onError={event =>
                markSourceFailed(event.currentTarget.currentSrc || desktopSource || mobileSource)
              }
              style={{ objectPosition: activeSlide.desktopObjectPosition }}
              className="size-full object-cover">
              {mobileMediaAvailable ? (
                <source src={mobileSource} media="(max-width: 639px)" />
              ) : null}
              {desktopMediaAvailable ? <source src={desktopSource} /> : null}
            </video>
          </div>
        ) : activeSlide.mediaType !== 'video' && imageAvailable ? (
          <div
            key={`${activeSlide.id}:${mobileSource || desktopSource}`}
            className="absolute inset-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            {mobileMediaAvailable ? (
              <Image
                src={mobileSource}
                alt=""
                fill
                priority={activeIndex === 0}
                unoptimized={directRemoteMedia(mobileSource)}
                sizes="100vw"
                onError={() => markSourceFailed(mobileSource)}
                style={{ objectPosition: activeSlide.mobileObjectPosition }}
                className="object-cover sm:hidden"
              />
            ) : null}

            {desktopMediaAvailable ? (
              <Image
                src={desktopSource}
                alt=""
                fill
                priority={activeIndex === 0}
                unoptimized={directRemoteMedia(desktopSource)}
                sizes="(max-width: 768px) 100vw, 1200px"
                onError={() => markSourceFailed(desktopSource)}
                style={{ objectPosition: activeSlide.desktopObjectPosition }}
                className={cn('object-cover', mobileMediaAvailable && 'hidden sm:block')}
              />
            ) : null}
          </div>
        ) : posterAvailable ? (
          <Image
            key={`${activeSlide.id}:${posterSource}:poster`}
            src={posterSource}
            alt=""
            fill
            priority={activeIndex === 0}
            unoptimized={directRemoteMedia(posterSource)}
            sizes="100vw"
            onError={() => markSourceFailed(posterSource)}
            style={{ objectPosition: activeSlide.posterObjectPosition }}
            className="object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <div className="absolute inset-0 flex items-center justify-center px-5 pb-14 pt-4 sm:p-8 sm:pb-16">
          <div className="mx-auto max-w-[18rem] -translate-y-3 text-center text-white sm:max-w-xl sm:translate-y-0">
            {activeSlide.eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-xs sm:tracking-[0.2em]">
                {activeSlide.eyebrow}
              </p>
            ) : null}

            <h1 className="mt-1.5 text-xl font-black tracking-tight sm:mt-2 sm:text-4xl">
              {activeSlide.title || 'Discover Shelsea'}
            </h1>

            {activeSlide.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/75 sm:mt-2 sm:text-base sm:leading-6">
                {activeSlide.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-4">
              {activeSlide.primaryAction ? (
                <Link
                  href={activeSlide.primaryAction.href}
                  className="rounded-full bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
                  {activeSlide.primaryAction.label}
                </Link>
              ) : null}

              {activeSlide.secondaryAction ? (
                <Link
                  href={activeSlide.secondaryAction.href}
                  className="rounded-full border border-white/30 bg-black/20 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/35 sm:px-4 sm:text-sm">
                  {activeSlide.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {orderedSlides.length > 1 ? (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {orderedSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveSlideId(slide.id)}
              className={cn(
                'h-1.5 rounded-full bg-white/45 transition-all',
                index === activeIndex ? 'w-6 bg-white' : 'w-1.5'
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
