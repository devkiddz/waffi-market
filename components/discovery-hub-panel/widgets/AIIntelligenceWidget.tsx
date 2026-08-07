'use client';

/* AJ_HUB_PRODUCT_DEEP_INSIGHT_WIRING_V1 */

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import Image from 'next/image';

import Link from 'next/link';

import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

import type {
  AIAssistantHubInsight
} from '@/features/ai-assistance';

import {
  useProductDeepInsight
} from '@/features/product-intelligence';

import ProductDeepInsightWidget from './ProductDeepInsightWidget';

import {
  useWorkspace
} from '@/features/workspace';

import {
  useIdentity
} from '@/providers/IdentityProvider';

async function readJson<T>(
  response:
    Response
): Promise<T> {
  const payload =
    (await response.json()) as T & {
      error?:
        string;
    };

  if (!response.ok) {
    throw new Error(
      payload.error ??
      'AJ Assistant could not be loaded.'
    );
  }

  return payload;
}

export default function AIIntelligenceWidget() {
  const {
    activeWorkspace
  } =
    useWorkspace();

  const {
    isAuthenticated,
    isPending
  } =
    useIdentity();

  const productDeepInsight =
    useProductDeepInsight();

  const [
    insight,
    setInsight
  ] =
    useState<
      AIAssistantHubInsight |
      null
    >(
      null
    );

  const [
    loading,
    setLoading
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing
  ] =
    useState(
      false
    );

  const [
    error,
    setError
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const load =
    useCallback(
      async (
        quiet =
          false
      ) => {
        const workspaceId =
          activeWorkspace?.id ??
          '';

        if (
          !workspaceId ||
          !isAuthenticated
        ) {
          setLoading(
            false
          );

          return;
        }

        if (!quiet) {
          setRefreshing(
            true
          );
        }

        try {
          const response =
            await fetch(
              `/api/assistant/hub?workspaceId=${encodeURIComponent(
                workspaceId
              )}`,
              {
                cache:
                  'no-store',
                credentials:
                  'same-origin'
              }
            );

          const data =
            await readJson<{
              insight:
                AIAssistantHubInsight |
                null;
            }>(
              response
            );

          setInsight(
            data.insight
          );

          setError(
            null
          );
        } catch (
          cause
        ) {
          setError(
            cause instanceof
            Error
              ? cause.message
              : 'AJ Assistant could not be loaded.'
          );
        } finally {
          setLoading(
            false
          );

          if (!quiet) {
            setRefreshing(
              false
            );
          }
        }
      },
      [
        activeWorkspace?.id,
        isAuthenticated
      ]
    );

  useEffect(
    () => {
      const task =
        window.setTimeout(
          () =>
            void load(
              true
            ),
          0
        );

      const onFocus =
        () =>
          void load(
            true
          );

      const onIntelligenceUpdated =
        () =>
          void load(
            true
          );

      window.addEventListener(
        'focus',
        onFocus
      );

      window.addEventListener(
        'rcentz:ai-intelligence-updated',
        onIntelligenceUpdated
      );

      return () => {
        window.clearTimeout(
          task
        );

        window.removeEventListener(
          'focus',
          onFocus
        );

        window.removeEventListener(
          'rcentz:ai-intelligence-updated',
          onIntelligenceUpdated
        );
      };
    },
    [
      load
    ]
  );

  const waiting =
    isPending ||
    loading;

  if (
    productDeepInsight
  ) {
    return (
      <ProductDeepInsightWidget
        request={
          productDeepInsight
        }
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-accent/20 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_45%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.22)]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-accent">
            <Sparkles className="size-3.5" />

            Live intelligence
          </p>

          <h3 className="mt-2 text-base font-black tracking-tight">
            Ask Shelsea
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your latest live recommendation and the action you chose.
          </p>
        </div>

        <button
          type="button"
          disabled={
            refreshing ||
            waiting
          }
          onClick={() =>
            void load()
          }
          aria-label="Refresh AJ Intelligence"
          className="grid size-10 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-background/55 text-accent transition hover:bg-muted disabled:opacity-45">
          {refreshing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </button>
      </header>

      {waiting ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-accent/18 bg-background/40 p-4">
          <LoaderCircle className="size-4 animate-spin text-accent" />

          <p className="text-xs text-muted-foreground">
            Loading your latest suggestion
          </p>
        </div>
      ) : !isAuthenticated ? (
        <div className="mt-5 rounded-2xl border border-dashed border-accent/25 bg-background/35 p-5 text-center">
          <BrainCircuit className="mx-auto size-7 text-accent/70" />

          <p className="mt-3 text-sm font-black">
            Sign in to ask AJ
          </p>

          <Link
            href="/sign-in?next=/ai"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[10px] font-black text-background">
            Continue

            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-[10px] leading-5 text-destructive">
            {
              error
            }
          </p>
        </div>
      ) : insight ? (
        <div className="mt-5 space-y-3">
          <article className="rounded-2xl border border-accent/20 bg-background/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent/12 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-foreground">
                {
                  insight.outputType.replaceAll(
                    '_',
                    ' '
                  )
                }
              </span>

              {insight.application?.status ===
              'APPLIED' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/12 px-2 py-1 text-[8px] font-black uppercase text-foreground">
                  <CheckCircle2 className="size-3" />

                  Applied
                </span>
              ) : null}
            </div>

            <h4 className="mt-3 text-sm font-black leading-5">
              {
                insight.headline
              }
            </h4>

            <p className="mt-2 line-clamp-3 text-[10px] leading-5 text-muted-foreground">
              {
                insight.summary
              }
            </p>
          </article>

          {insight.products.length ? (
            <div className="grid grid-cols-3 gap-2">
              {insight.products
                .slice(
                  0,
                  3
                )
                .map(
                  product => (
                    <Link
                      key={
                        product.id
                      }
                      href={
                        product.href
                      }
                      className="min-w-0 rounded-2xl border border-border/60 bg-background/45 p-2 transition hover:border-accent/25">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        {product.image ? (
                          <Image
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            fill
                            unoptimized
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <p className="mt-2 truncate text-[9px] font-black">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-0.5 text-[8px] text-muted-foreground">
                        {
                          product.available
                        }{' '}
                        available
                      </p>
                    </Link>
                  )
                )}
            </div>
          ) : null}

          {insight.application?.status ===
            'APPLIED' &&
          insight.application.href ? (
            <Link
              href={
                insight.application.href
              }
              className="flex items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/12 px-3 py-3 text-[10px] font-black text-foreground">
              <span className="min-w-0 truncate">
                {
                  insight.application.label
                }
              </span>

              <ArrowRight className="size-3.5 shrink-0" />
            </Link>
          ) : null}

          <Link
            href="/ai"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground transition hover:opacity-90">
            Continue with AJ

            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-accent/25 bg-background/35 p-5 text-center">
          <BrainCircuit className="mx-auto size-7 text-accent/70" />

          <p className="mt-3 text-sm font-black">
            Start your first
            intelligence session
          </p>

          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            Ask for recommendations,
            comparisons, pairings or
            a Shopping List plan.
          </p>

          <Link
            href="/ai"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[10px] font-black text-primary-foreground">
            Ask Shelsea

            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
