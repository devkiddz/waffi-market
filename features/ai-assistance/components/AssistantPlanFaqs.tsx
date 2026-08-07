'use client';

/* AJ_MS12_PRODUCT_LIBRARY_PRESENTATION_V1 */
/* AJ_MS12_PRODUCT_LIBRARY_NESTED_ACCORDION_V2 */

import {
  ChevronDown,
  CircleHelp
} from 'lucide-react';

import type {
  AIAssistantResponsePayload
} from '../contracts';

function metricValue(
  payload:
    AIAssistantResponsePayload,
  label:
    string
) {
  return payload.metrics.find(
    metric =>
      metric.label
        .toLowerCase()
        .includes(
          label.toLowerCase()
        )
  )?.value ??
  null;
}

export function AssistantPlanFaqs({
  payload
}: {
  payload:
    AIAssistantResponsePayload;
}) {
  const budget =
    metricValue(
      payload,
      'budget limit'
    );

  const estimatedTotal =
    metricValue(
      payload,
      'estimated total'
    );

  const remainingBudget =
    metricValue(
      payload,
      'remaining budget'
    );

  const nonAlcoholic =
    metricValue(
      payload,
      'non-alcoholic'
    );

  const faqs = [
    {
      question:
        'Why were these products selected?',
      answer:
        `AJ composed this result from the active Journey and the currently available catalogue. Each product accordion preserves its own selection reason. ${payload.summary}`
    },
    {
      question:
        'Is this plan still within the active budget?',
      answer:
        budget &&
        estimatedTotal
          ? `The active budget is ${budget}, the estimated plan total is ${estimatedTotal}${
              remainingBudget
                ? `, and ${remainingBudget} remains.`
                : '.'
            }`
          : 'This result does not expose enough numeric budget metrics to confirm the budget relationship. AJ should not invent one.'
    },
    {
      question:
        'How were non-alcoholic preferences handled?',
      answer:
        nonAlcoholic
          ? `The active result reports ${nonAlcoholic}. Product-level reasons and facts remain available inside each accordion.`
          : 'This result does not expose a non-alcoholic metric. Ask Shelsea to apply a minimum or alcohol-free constraint when that distinction matters.'
    },
    {
      question:
        'Are price and stock guaranteed?',
      answer:
        'They reflect the catalogue values attached to this response. Vendors may update price or inventory, so the marketplace must confirm both again before checkout or any governed purchase action.'
    },
    {
      question:
        'Where does the product information come from?',
      answer:
        'Current facts come from the RCENTZ marketplace catalogue. Verified vendor, manufacturer, Wikipedia or Wikidata enrichment will appear as separately labelled sources and must never overwrite live price, stock, variant or vendor authority.'
    },
    {
      question:
        'Can I replace or remove a product?',
      answer:
        'Yes. Continue the same Journey with a precise instruction such as “replace this product”, “show a cheaper alternative” or “remove alcohol”. A meaningful composition change becomes a new Plan version while the earlier Plan remains in History.'
    }
  ];

  return (
    <section className="mt-5 rounded-3xl border border-border/60 bg-card/55 p-4 tracking-normal sm:p-5">
      <div className="flex items-center gap-2">
        <CircleHelp className="size-5 text-primary" />

        <div>
          <h4 className="font-semibold tracking-normal">
            Plan FAQs
          </h4>

          <p className="mt-1 text-sm leading-6 tracking-normal text-muted-foreground">
            Answers are grounded in this saved result and its current Product Library coverage.
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border/55 overflow-hidden rounded-2xl border border-border/55 bg-background/55">
        {faqs.map(
          faq => (
            <details
              key={
                faq.question
              }
              className="group/faq">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium tracking-normal marker:content-none">
                {faq.question}

                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open/faq:rotate-180" />
              </summary>

              <p className="px-4 pb-4 text-sm leading-6 tracking-normal text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          )
        )}
      </div>
    </section>
  );
}
