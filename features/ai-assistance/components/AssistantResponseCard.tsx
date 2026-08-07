'use client';

/* AJ_MS12_INTELLIGENCE_READABILITY_PASS_V1 */

import Link from 'next/link';

import {
  ArrowUpRight,
  Check,
  Clipboard,
  Gauge,
  Lightbulb,
  PackageSearch,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X
} from 'lucide-react';

import type {
  AIAssistantApplicationView,
  AIAssistantAudience,
  AIAssistantFeedbackValue,
  AIAssistantMessageView
} from '../contracts';

import { AssistantActionBridgePanel } from './AssistantActionBridgePanel';

import {
  AssistantPlanFaqs
} from './AssistantPlanFaqs';

import {
  AssistantProductLibraryCard
} from './AssistantProductLibraryCard';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

function toneClass(tone: 'neutral' | 'positive' | 'warning' | 'critical' | undefined) {
  if (tone === 'positive') {
    return 'border-accent/25 bg-accent/10 text-foreground';
  }

  if (tone === 'warning') {
    return 'border-secondary/20 bg-secondary/8 text-foreground';
  }

  if (tone === 'critical') {
    return 'border-destructive/20 bg-destructive/5 text-destructive';
  }

  return 'border-border/60 bg-muted/25';
}

export function AssistantResponseCard({
  audience,
  workspaceId,
  vendorProfileId,
  message,
  onApplied,
  onFeedback
}: {
  audience: AIAssistantAudience;
  workspaceId: string;
  vendorProfileId: string | null;
  message: AIAssistantMessageView;
  onApplied: (messageId: string, application: AIAssistantApplicationView) => void;
  onFeedback: (messageId: string, feedback: AIAssistantFeedbackValue) => void;
}) {
  const payload = message.payload;

  if (!payload) {
    return (
      <article className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm">
        <p className="text-sm leading-6">{message.content}</p>
      </article>
    );
  }

  const isPlanExplanation =
    /why this plan fits your journey/i.test(
      payload.headline
    ) ||
    /explanation reads the active plan/i.test(
      payload.summary
    );

  const visibleExplanationSections =
    isPlanExplanation
      ? payload.sections
      : [];

  const remainingSections =
    isPlanExplanation
      ? []
      : payload.sections;

  async function copyDraft() {
    const currentPayload = message.payload;

    if (!currentPayload) {
      return;
    }

    const text = [
      currentPayload.headline,
      currentPayload.summary,
      ...currentPayload.draftFields.map(field => `${field.label}: ${field.value}`),
      ...currentPayload.sections.flatMap(section => [
        section.title,
        ...section.bullets.map(bullet => `- ${bullet}`)
      ])
    ].join('\n');

    await navigator.clipboard.writeText(text);
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-accent/20 bg-card/90 shadow-lg">
      <header className="border-b border-border/55 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_44%)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-accent">
              <Sparkles className="size-4" />

              {payload.outputType.replaceAll('_', ' ')}
            </p>

            <h3 className="mt-3 text-xl font-black sm:text-2xl">{payload.headline}</h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{payload.summary}</p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-2 text-xs font-black">
            <Gauge className="size-3.5 text-accent" />
            {Math.round(payload.confidence * 100)}% confidence
          </span>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        {payload.metrics.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {payload.metrics.map(metric => (
              <div
                key={`${metric.label}-${metric.value}`}
                className={`rounded-2xl border p-4 ${toneClass(metric.tone)}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">{metric.label}</p>

                <p className="mt-2 text-xl font-black">{metric.value}</p>

                {metric.helper ? <p className="mt-1 text-xs leading-5 opacity-70">{metric.helper}</p> : null}
              </div>
            ))}
          </section>
        ) : null}

                {/* AJ_MS12_VISIBLE_PLAN_EXPLANATION_V3 */}
        {isPlanExplanation &&
        visibleExplanationSections.length ? (
          <section className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-4 tracking-normal sm:p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <h4 className="font-semibold tracking-normal">
                  Plan explanation
                </h4>

                <p className="mt-1 text-sm leading-6 tracking-normal text-muted-foreground">
                  Here is the reasoning behind the active plan. Individual catalogue facts, availability, sources and product-specific FAQs remain inside each Product Library accordion below.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {visibleExplanationSections.map(
                section => (
                  <article
                    key={
                      section.title
                    }
                    className="rounded-2xl border border-border/60 bg-background/65 p-4 tracking-normal">
                    <h5 className="font-semibold tracking-normal">
                      {section.title}
                    </h5>

                    {section.description ? (
                      <p className="mt-1 text-sm leading-6 tracking-normal text-muted-foreground">
                        {section.description}
                      </p>
                    ) : null}

                    <ul className="mt-3 space-y-2.5">
                      {section.bullets.map(
                        bullet => (
                          <li
                            key={
                              bullet
                            }
                            className="flex items-start gap-2.5 text-sm leading-6 tracking-normal text-muted-foreground">
                            <Check className="mt-1 size-3.5 shrink-0 text-primary" />

                            <span>
                              {bullet}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </article>
                )
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/55 bg-background/55 p-3 text-sm leading-6 tracking-normal text-muted-foreground">
              <PackageSearch className="mt-1 size-4 shrink-0 text-primary" />

              <p>
                Open a product below when you need its individual description, selected variant, availability, safety boundaries, source coverage or FAQs.
              </p>
            </div>
          </section>
        ) : null}

{/* AJ_MS12_PRODUCT_LIBRARY_PRESENTATION_V1 */}
        {payload.products.length ? (
          <section className="rounded-3xl border border-border/60 bg-background/50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <PackageSearch className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <h4 className="font-semibold tracking-normal">
                  Live catalogue Product Library
                </h4>

                <p className="mt-1 text-sm leading-6 tracking-normal text-muted-foreground">
                  Open each product to review catalogue facts, Journey relevance, safety boundaries, source coverage and FAQs.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {payload.products.map(
                product => (
                  <AssistantProductLibraryCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>

            <AssistantPlanFaqs
              payload={
                payload
              }
            />
          </section>
        ) : null}

        {payload.draftFields.length ? (
          <section className="rounded-3xl border border-accent/25 bg-accent/8 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-5 text-accent" />

                <h4 className="font-black">Reviewable draft</h4>
              </div>

              <button
                type="button"
                onClick={() => void copyDraft()}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-accent/25 bg-background/55 px-3 text-xs font-black text-foreground transition hover:bg-muted">
                <Clipboard className="size-3.5" />
                Copy draft
              </button>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {payload.draftFields.map(field => (
                <div key={field.label} className="rounded-2xl border border-accent/18 bg-background/65 p-3">
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-accent">
                    {field.label}
                  </dt>

                  <dd className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {remainingSections.length ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {remainingSections.map(section => (
              <article
                key={section.title}
                className="rounded-3xl border border-border/60 bg-background/55 p-5">
                <h4 className="font-black">{section.title}</h4>

                {section.description ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p>
                ) : null}

                <ul className="mt-4 space-y-3">
                  {section.bullets.map(bullet => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />

                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        {payload.warnings.length ? (
          <section className="rounded-3xl border border-secondary/20 bg-secondary/7 p-5">
            <div className="flex items-center gap-2 text-secondary">
              <ShieldAlert className="size-4" />

              <h4 className="text-sm font-black">Boundaries and uncertainty</h4>
            </div>

            <ul className="mt-4 space-y-3">
              {payload.warnings.map(warning => (
                <li key={warning} className="text-sm leading-6 text-muted-foreground">
                  • {warning}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {payload.actions.length ? (
          <div className="flex flex-wrap gap-2">
            {payload.actions.map(action => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={
                  action.kind === 'primary'
                    ? 'inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground'
                    : 'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-black'
                }>
                {action.label}

                <ArrowUpRight className="size-3.5" />
              </Link>
            ))}
          </div>
        ) : null}


        <AssistantActionBridgePanel
          audience={audience}
          workspaceId={workspaceId}
          vendorProfileId={vendorProfileId}
          message={message}
          onApplied={onApplied}
        />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/55 bg-muted/20 px-5 py-3 sm:px-6">
        <p className="text-xs text-muted-foreground">
          {message.provider === 'RCENTZ_LOCAL_V1' ? 'Shelsea local assistant' : message.provider}
          {' · '}
          {new Date(message.createdAt).toLocaleString('en-NG')}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFeedback(message.id, 'HELPFUL')}
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-black ${
              message.feedback === 'HELPFUL' ? 'border-accent/30 bg-accent/12 text-foreground' : ''
            }`}>
            <ThumbsUp className="size-3.5" />
            Helpful
          </button>

          <button
            type="button"
            onClick={() => onFeedback(message.id, 'NOT_HELPFUL')}
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-black ${
              message.feedback === 'NOT_HELPFUL'
                ? 'border-destructive/25 bg-destructive/5 text-destructive'
                : ''
            }`}>
            <ThumbsDown className="size-3.5" />
            Needs work
          </button>

          <button
            type="button"
            onClick={() => onFeedback(message.id, 'DISMISSED')}
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-black ${
              message.feedback === 'DISMISSED' ? 'border-muted-foreground/25 bg-muted text-foreground' : ''
            }`}>
            <X className="size-3.5" />
            Dismiss
          </button>
        </div>
      </footer>
    </article>
  );
}
