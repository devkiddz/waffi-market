'use client';

/* AJ_MS12_PRODUCT_LIBRARY_PRESENTATION_V1 */
/* AJ_MS12_PRODUCT_LIBRARY_NESTED_ACCORDION_V2 */

import Image from 'next/image';
import Link from 'next/link';

import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
  Tag
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import type {
  AIAssistantProduct
} from '../contracts';

const currency =
  new Intl.NumberFormat(
    'en-NG',
    {
      style:
        'currency',
      currency:
        'NGN',
      maximumFractionDigits:
        0
    }
  );

function LibraryAccordion({
  icon,
  title,
  children
}: {
  icon:
    ReactNode;
  title:
    string;
  children:
    ReactNode;
}) {
  return (
    <details className="group/detail border-t border-border/55 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium tracking-normal marker:content-none">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-primary">
            {icon}
          </span>

          {title}
        </span>

        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open/detail:rotate-180" />
      </summary>

      <div className="px-4 pb-4 text-sm leading-6 tracking-normal text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function AssistantProductLibraryCard({
  product
}: {
  product:
    AIAssistantProduct;
}) {
  const library =
    product.library ??
    null;

  const overview =
    library?.overview ??
    library?.description ??
    null;

  const specifications =
    library?.specifications ??
    [];

  const sources =
    library?.sources ??
    [];

  const missingInformation =
    library?.missingInformation ??
    [
      'A detailed Product Library record has not yet been attached to this catalogue result.'
    ];

  return (
    <details className="group/product min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card/75 shadow-sm transition open:border-primary/20 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 marker:content-none sm:p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted sm:size-18">
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
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <BookOpen className="size-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 tracking-normal">
          <p className="text-[15px] font-semibold leading-5 tracking-normal">
            {product.name}
          </p>

          <p className="mt-1 text-xs leading-5 tracking-normal text-muted-foreground">
            {product.category}
            {product.brand
              ? ` · ${product.brand}`
              : ''}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-normal">
            {product.price !==
            null ? (
              <span className="font-semibold text-foreground">
                {currency.format(
                  product.price
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Price unavailable
              </span>
            )}

            <span className="text-muted-foreground">
              {product.available}{' '}
              available
            </span>

            {library ? (
              <span className="text-primary">
                {library.status ===
                'ENRICHED'
                  ? 'Enriched knowledge'
                  : 'Catalogue knowledge'}
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition group-open/product:rotate-180" />
      </summary>

      <div className="border-t border-border/55 bg-background/35">
        <div className="px-4 py-3 text-xs leading-5 tracking-normal text-muted-foreground">
          Open the sections below for verified catalogue information and Journey context.
        </div>

        <LibraryAccordion
          icon={
            <BookOpen className="size-4" />
          }
          title="About this product">
          {overview ? (
            <div className="space-y-3">
              <p>
                {overview}
              </p>

              {library?.description &&
              library.description !==
                overview ? (
                <p>
                  {library.description}
                </p>
              ) : null}
            </div>
          ) : (
            <p>
              A detailed overview has not yet been provided in the Product Library.
            </p>
          )}
        </LibraryAccordion>

        <LibraryAccordion
          icon={
            <PackageCheck className="size-4" />
          }
          title="Product facts and availability">
          {specifications.length ? (
            <dl className="grid gap-2 sm:grid-cols-2">
              {specifications.map(
                specification => (
                  <div
                    key={
                      `${specification.label}-${specification.value}`
                    }
                    className="rounded-2xl border border-border/55 bg-card/65 p-3 tracking-normal">
                    <dt className="text-xs font-medium tracking-normal text-muted-foreground">
                      {specification.label}
                    </dt>

                    <dd className="mt-1 font-medium tracking-normal text-foreground">
                      {specification.value}
                    </dd>
                  </div>
                )
              )}
            </dl>
          ) : (
            <p>
              Only the visible price, selected variant and current availability are verified for this result.
            </p>
          )}

          {library?.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag className="mt-1 size-4 shrink-0 text-primary" />

              {library.tags.map(
                tag => (
                  <span
                    key={
                      tag
                    }
                    className="rounded-full border border-border/60 bg-card/65 px-2.5 py-1 text-xs font-medium tracking-normal text-foreground">
                    {tag}
                  </span>
                )
              )}
            </div>
          ) : null}
        </LibraryAccordion>

        <LibraryAccordion
          icon={
            <CircleHelp className="size-4" />
          }
          title="Why AJ selected it">
          <p className="font-medium tracking-normal text-foreground">
            {product.reason}
          </p>

          <p className="mt-2">
            This explanation belongs to the active Journey and may change when the customer changes budget, audience size, preferences or purpose.
          </p>
        </LibraryAccordion>

        <LibraryAccordion
          icon={
            <ShieldCheck className="size-4" />
          }
          title="Safety, sources and missing information">
          {library?.safetyNotes.length ? (
            <ul className="space-y-2">
              {library.safetyNotes.map(
                note => (
                  <li
                    key={
                      note
                    }>
                    • {note}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>
              No verified product-specific safety guidance is currently attached. AJ must not invent allergen, medical, pregnancy, alcohol-interaction or suitability claims.
            </p>
          )}

          <div className="mt-4 rounded-2xl border border-border/55 bg-card/65 p-3 tracking-normal">
            <p className="text-xs font-medium tracking-normal text-foreground">
              Information sources
            </p>

            {sources.length ? (
              <ul className="mt-2 space-y-2">
                {sources.map(
                  source => (
                    <li
                      key={
                        `${source.type}-${source.title}`
                      }
                      className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                      <span>
                        {source.href ? (
                          <a
                            href={
                              source.href
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium tracking-normal text-foreground underline-offset-4 hover:underline">
                            {source.title}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="font-medium tracking-normal text-foreground">
                            {source.title}
                          </span>
                        )}
                        {' · '}
                        {source.verified
                          ? 'verified source'
                          : 'unverified source'}
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-2">
                No structured source record is attached to this older result.
              </p>
            )}
          </div>

          {missingInformation.length ? (
            <div className="mt-4">
              <p className="text-xs font-medium tracking-normal text-foreground">
                Still required for full Product Library coverage
              </p>

              <ul className="mt-2 space-y-1.5">
                {missingInformation.map(
                  item => (
                    <li
                      key={
                        item
                      }>
                      • {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          ) : null}
        </LibraryAccordion>

        <LibraryAccordion
          icon={
            <CircleHelp className="size-4" />
          }
          title="Product FAQs">
          <dl className="space-y-4">
            <div>
              <dt className="font-medium tracking-normal text-foreground">
                Which product identity is AJ using?
              </dt>
              <dd className="mt-1">
                The canonical marketplace Product ID is {product.id} and the selected listing slug is {product.slug}.
              </dd>
            </div>

            <div>
              <dt className="font-medium tracking-normal text-foreground">
                Which variant is included?
              </dt>
              <dd className="mt-1">
                {product.variantLabel ??
                  'No specific active variant was resolved for this result.'}
              </dd>
            </div>

            <div>
              <dt className="font-medium tracking-normal text-foreground">
                Can this product be replaced?
              </dt>
              <dd className="mt-1">
                Yes. Ask Shelsea to replace it, show alternatives or rebuild the plan with a new constraint. A meaningful replacement becomes an intentional Journey refinement.
              </dd>
            </div>
          </dl>
        </LibraryAccordion>

        <div className="border-t border-border/55 p-4">
          <Link
            href={
              product.href
            }
            className="inline-flex items-center gap-2 text-sm font-medium tracking-normal text-primary transition hover:underline">
            Open product page
            <ExternalLink className="size-4" />
          </Link>
        </div>
      </div>
    </details>
  );
}
