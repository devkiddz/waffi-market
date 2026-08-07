'use client';

/* AJ_MS12_INTELLIGENCE_READABILITY_PASS_V1 */

import {
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FilePenLine,
  ListTodo,
  LoaderCircle,
  Megaphone,
  PackagePlus,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

import type {
  AIAssistantApplicationView,
  AIAssistantAudience,
  AIAssistantBridgeActionType,
  AIAssistantBridgeOptions,
  AIAssistantCampaignType,
  AIAssistantMessageView,
  AIAssistantTodoPriority
} from '../contracts';

type AssistantActionBridgePanelProps = {
  audience:
    AIAssistantAudience;

  workspaceId:
    string;

  vendorProfileId:
    string |
    null;

  message:
    AIAssistantMessageView;

  onApplied: (
    messageId:
      string,
    application:
      AIAssistantApplicationView
  ) => void;
};

type BridgeActionDefinition = {
  type:
    AIAssistantBridgeActionType;

  label:
    string;

  description:
    string;
};

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
      'Shelsea could not complete this action.'
    );
  }

  return payload;
}

function draftField(
  message:
    AIAssistantMessageView,
  label:
    string
) {
  return message.payload?.draftFields.find(
    field =>
      field.label
        .toLowerCase() ===
      label.toLowerCase()
  )?.value ??
    null;
}

function defaultTitle(
  message:
    AIAssistantMessageView
) {
  return (
    draftField(
      message,
      'Campaign title'
    ) ??
    message.payload?.headline ??
    'Shelsea Draft'
  ).slice(
    0,
    180
  );
}

function actionIcon(
  type:
    AIAssistantBridgeActionType
) {
  switch (
    type
  ) {
    case 'SHOPPING_LIST_CREATE':
      return ClipboardList;

    case 'ADMIN_TODO_CREATE':
      return ListTodo;

    case 'PRODUCT_DRAFT_CREATE':
      return PackagePlus;

    case 'PRODUCT_REVISION_SUBMIT':
      return FilePenLine;

    case 'CAMPAIGN_DRAFT_CREATE':
      return Megaphone;
  }
}

function statusLabel(
  application:
    AIAssistantApplicationView
) {
  switch (
    application.status
  ) {
    case 'APPLIED':
      return 'Completed';

    case 'FAILED':
      return 'Needs attention';

    default:
      return 'Working';
  }
}

export function AssistantActionBridgePanel({
  audience,
  workspaceId,
  vendorProfileId,
  message,
  onApplied
}: AssistantActionBridgePanelProps) {
  const payload =
    message.payload;

  const actions =
    useMemo<
      BridgeActionDefinition[]
    >(
      () => {
        if (!payload) {
          return [];
        }

        if (
          audience ===
          'customer'
        ) {
          return payload.products.length
            ? [
                {
                  type:
                    'SHOPPING_LIST_CREATE',
                  label:
                    'Create Shopping List',
                  description:
                    'Save the selected live products as a new private shopping plan.'
                }
              ]
            : [];
        }

        const result:
          BridgeActionDefinition[] = [];

        if (
          payload.productDraft
        ) {
          result.push({
            type:
              'PRODUCT_DRAFT_CREATE',
            label:
              'Create Product Draft',
            description:
              'Create an inactive Product Studio record from the recognised details.'
          });
        }

        if (
          audience ===
          'admin'
        ) {
          result.push({
            type:
              'ADMIN_TODO_CREATE',
            label:
              'Create Admin Todo',
            description:
              'Turn this response into a real item on the Admin work queue.'
          });
        }

        if (
          payload.products.length
        ) {
          result.push({
            type:
              'PRODUCT_REVISION_SUBMIT',
            label:
              'Submit for Review',
            description:
              'Prepare a Product improvement request without changing the live Product.'
          });
        }

        if (
          payload.outputType ===
            'CAMPAIGN_DRAFT' ||
          payload.products.length
        ) {
          result.push({
            type:
              'CAMPAIGN_DRAFT_CREATE',
            label:
              'Create Campaign Draft',
            description:
              'Create an unpublished Banner, Story or Reel draft for completion.'
          });
        }

        return result;
      },
      [
        audience,
        payload
      ]
    );

  const [
    selectedAction,
    setSelectedAction
  ] =
    useState<
      AIAssistantBridgeActionType |
      null
    >(
      actions[0]?.type ??
      null
    );

  const [
    title,
    setTitle
  ] =
    useState(
      defaultTitle(
        message
      )
    );

  const [
    description,
    setDescription
  ] =
    useState(
      payload?.summary ??
      ''
    );

  const [
    selectedProductIds,
    setSelectedProductIds
  ] =
    useState<
      string[]
    >(
      payload?.products.map(
        product =>
          product.id
      ) ??
      []
    );

  const [
    productId,
    setProductId
  ] =
    useState(
      payload?.products[0]?.id ??
      ''
    );

  const [
    reason,
    setReason
  ] =
    useState(
      payload
        ? `Review the Shelsea suggestions for ${payload.headline}.`
        : ''
    );

  const [
    priority,
    setPriority
  ] =
    useState<
      AIAssistantTodoPriority
    >(
      'MEDIUM'
    );

  const [
    campaignType,
    setCampaignType
  ] =
    useState<
      AIAssistantCampaignType
    >(
      payload?.outputType ===
      'CAMPAIGN_DRAFT'
        ? 'STORY'
        : 'BANNER'
    );

  const [
    draftName,
    setDraftName
  ] =
    useState(
      payload?.productDraft?.name ??
      ''
    );

  const [
    draftShortDescription,
    setDraftShortDescription
  ] =
    useState(
      payload?.productDraft
        ?.shortDescription ??
      ''
    );

  const [
    draftLongDescription,
    setDraftLongDescription
  ] =
    useState(
      payload?.productDraft
        ?.longDescription ??
      ''
    );

  const [
    draftEstimatedDelivery,
    setDraftEstimatedDelivery
  ] =
    useState(
      payload?.productDraft
        ?.estimatedDelivery ??
      ''
    );

  const [
    draftTags,
    setDraftTags
  ] =
    useState(
      payload?.productDraft?.tags.join(
        ', '
      ) ??
      ''
    );

  const [
    submitting,
    setSubmitting
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

  const [
    latestApplication,
    setLatestApplication
  ] =
    useState<
      AIAssistantApplicationView |
      null
    >(
      message.applications[0] ??
      null
    );

  const selectedDefinition =
    actions.find(
      action =>
        action.type ===
        selectedAction
    ) ??
    null;

  if (
    !payload ||
    !actions.length
  ) {
    return null;
  }

  function toggleProduct(
    id:
      string
  ) {
    setSelectedProductIds(
      current =>
        current.includes(
          id
        )
          ? current.filter(
              item =>
                item !==
                id
            )
          : [
              ...current,
              id
            ]
    );
  }

  function optionsForAction():
    AIAssistantBridgeOptions {
    switch (
      selectedAction
    ) {
      case 'SHOPPING_LIST_CREATE':
        return {
          title,
          description,
          productIds:
            selectedProductIds
        };

      case 'ADMIN_TODO_CREATE':
        return {
          title,
          description,
          priority
        };

      case 'PRODUCT_DRAFT_CREATE':
        return {
          name:
            draftName,
          shortDescription:
            draftShortDescription,
          longDescription:
            draftLongDescription,
          estimatedDelivery:
            draftEstimatedDelivery ||
            null,
          tags:
            draftTags
              .split(
                ','
              )
              .map(
                value =>
                  value.trim()
              )
              .filter(
                Boolean
              )
        };

      case 'PRODUCT_REVISION_SUBMIT':
        return {
          productId,
          reason
        };

      case 'CAMPAIGN_DRAFT_CREATE':
        return {
          title,
          description,
          campaignType,
          productIds:
            selectedProductIds
        };

      default:
        throw new Error(
          'Choose an action first.'
        );
    }
  }

  async function applyAction() {
    if (
      !selectedAction ||
      submitting
    ) {
      return;
    }

    setSubmitting(
      true
    );

    setError(
      null
    );

    try {
      const response =
        await fetch(
          `/api/assistant/messages/${encodeURIComponent(
            message.id
          )}/apply`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                audience,
                workspaceId,
                vendorProfileId,
                actionType:
                  selectedAction,
                options:
                  optionsForAction()
              })
          }
        );

      const data =
        await readJson<{
          application:
            AIAssistantApplicationView;
        }>(
          response
        );

      setLatestApplication(
        data.application
      );

      onApplied(
        message.id,
        data.application
      );

      window.dispatchEvent(
        new CustomEvent(
          'rcentz:ai-intelligence-updated',
          {
            detail: {
              messageId:
                message.id,

              applicationId:
                data.application.id
            }
          }
        )
      );
    } catch (
      cause
    ) {
      setError(
        cause instanceof
        Error
          ? cause.message
          : 'Shelsea could not complete this action.'
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  const disabled =
    submitting ||
    !selectedAction ||
    (
      selectedAction ===
        'SHOPPING_LIST_CREATE' &&
      !selectedProductIds.length
    ) ||
    (
      selectedAction ===
        'PRODUCT_DRAFT_CREATE' &&
      draftName.trim().length <
        2
    ) ||
    (
      selectedAction ===
        'PRODUCT_REVISION_SUBMIT' &&
      !productId
    );

  return (
    <section className="overflow-hidden rounded-3xl border border-accent/25 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--accent)_8%,transparent),transparent_55%)]">
      <header className="flex flex-col gap-4 border-b border-border/55 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/12 text-accent">
            <ShieldCheck className="size-4" />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
              Ready to continue
            </p>

            <h4 className="mt-1 text-sm font-black">
              Choose what Shelsea
              should prepare
            </h4>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Review the details first.
              Shelsea will verify your
              access and continue through
              the normal workflow.
            </p>
          </div>
        </div>

        {latestApplication ? (
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${
              latestApplication.status ===
              'FAILED'
                ? 'border-destructive/20 bg-destructive/5 text-destructive'
                : latestApplication.status ===
                  'APPLIED'
                  ? 'border-accent/30 bg-accent/12 text-foreground'
                  : 'border-border/70 bg-muted/40 text-muted-foreground'
            }`}>
            {latestApplication.status ===
            'APPLIED' ? (
              <CheckCircle2 className="size-3.5 text-accent" />
            ) : (
              <Sparkles className="size-3.5" />
            )}

            {
              statusLabel(
                latestApplication
              )
            }
          </span>
        ) : null}
      </header>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(
            action => {
              const Icon =
                actionIcon(
                  action.type
                );

              const selected =
                selectedAction ===
                action.type;

              return (
                <button
                  key={
                    action.type
                  }
                  type="button"
                  onClick={() =>
                    setSelectedAction(
                      action.type
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-accent/35 bg-accent/12 shadow-sm'
                      : 'border-border/60 bg-background/55 hover:border-accent/25 hover:bg-muted/35'
                  }`}>
                  <Icon className="size-4 text-accent" />

                  <p className="mt-3 text-sm font-semibold">
                    {
                      action.label
                    }
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {
                      action.description
                    }
                  </p>
                </button>
              );
            }
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-background/65 p-4">
          {selectedAction ===
          'SHOPPING_LIST_CREATE' ? (
            <div className="space-y-4">
              <TextField
                label="Shopping List name"
                value={
                  title
                }
                onChange={
                  setTitle
                }
                maximum={
                  90
                }
              />

              <TextAreaField
                label="Description"
                value={
                  description
                }
                onChange={
                  setDescription
                }
                rows={
                  3
                }
                maximum={
                  500
                }
              />

              <ProductSelection
                message={
                  message
                }
                selectedIds={
                  selectedProductIds
                }
                onToggle={
                  toggleProduct
                }
              />
            </div>
          ) : null}

          {selectedAction ===
          'ADMIN_TODO_CREATE' ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="space-y-4">
                <TextField
                  label="Todo title"
                  value={
                    title
                  }
                  onChange={
                    setTitle
                  }
                  maximum={
                    180
                  }
                />

                <TextAreaField
                  label="Operational context"
                  value={
                    description
                  }
                  onChange={
                    setDescription
                  }
                  rows={
                    4
                  }
                  maximum={
                    1800
                  }
                />
              </div>

              <label className="block">
                <FieldLabel>
                  Priority
                </FieldLabel>

                <select
                  value={
                    priority
                  }
                  onChange={
                    (event: ChangeEvent<HTMLSelectElement>) =>
                      setPriority(
                        event.target
                          .value as
                          AIAssistantTodoPriority
                      )
                  }
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none focus:border-accent/50">
                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>
                </select>
              </label>
            </div>
          ) : null}

          {selectedAction ===
          'PRODUCT_DRAFT_CREATE' &&
          payload.productDraft ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ReadOnlyFact
                  label="Matched category"
                  value={
                    payload.productDraft
                      .categoryLabel
                  }
                />

                <ReadOnlyFact
                  label="Matched subcategory"
                  value={
                    payload.productDraft
                      .subcategoryLabel ??
                    'None'
                  }
                />

                <ReadOnlyFact
                  label="Matched brand"
                  value={
                    payload.productDraft
                      .brandName ??
                    'None'
                  }
                />
              </div>

              <TextField
                label="Product name"
                value={
                  draftName
                }
                onChange={
                  setDraftName
                }
                maximum={
                  160
                }
              />

              <TextField
                label="Short description"
                value={
                  draftShortDescription
                }
                onChange={
                  setDraftShortDescription
                }
                maximum={
                  500
                }
              />

              <TextAreaField
                label="Long description"
                value={
                  draftLongDescription
                }
                onChange={
                  setDraftLongDescription
                }
                rows={
                  4
                }
                maximum={
                  4000
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Estimated delivery"
                  value={
                    draftEstimatedDelivery
                  }
                  onChange={
                    setDraftEstimatedDelivery
                  }
                  maximum={
                    180
                  }
                  placeholder="Optional"
                />

                <TextField
                  label="Tags"
                  value={
                    draftTags
                  }
                  onChange={
                    setDraftTags
                  }
                  maximum={
                    600
                  }
                  placeholder="Comma separated"
                />
              </div>

              <p className="rounded-xl border border-accent/20 bg-accent/8 px-3 py-2 text-xs leading-5 text-muted-foreground">
                This creates an inactive
                Draft only. Complete
                media, variants, price
                and stock in Product
                Studio before submission.
              </p>
            </div>
          ) : null}

          {selectedAction ===
          'PRODUCT_REVISION_SUBMIT' ? (
            <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <label className="block">
                <FieldLabel>
                  Product
                </FieldLabel>

                <select
                  value={
                    productId
                  }
                  onChange={
                    (event: ChangeEvent<HTMLSelectElement>) =>
                      setProductId(
                        event.target
                          .value
                      )
                  }
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none focus:border-accent/50">
                  {payload.products.map(
                    product => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }>
                        {
                          product.name
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <TextAreaField
                label="Review note"
                value={
                  reason
                }
                onChange={
                  setReason
                }
                rows={
                  4
                }
                maximum={
                  1000
                }
              />
            </div>
          ) : null}

          {selectedAction ===
          'CAMPAIGN_DRAFT_CREATE' ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
                <TextField
                  label="Campaign title"
                  value={
                    title
                  }
                  onChange={
                    setTitle
                  }
                  maximum={
                    180
                  }
                />

                <label className="block">
                  <FieldLabel>
                    Format
                  </FieldLabel>

                  <select
                    value={
                      campaignType
                    }
                    onChange={
                      (event: ChangeEvent<HTMLSelectElement>) =>
                        setCampaignType(
                          event.target
                            .value as
                            AIAssistantCampaignType
                        )
                    }
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none focus:border-accent/50">
                    <option value="BANNER">
                      Banner
                    </option>

                    <option value="STORY">
                      Story
                    </option>

                    <option value="REEL">
                      Reel
                    </option>
                  </select>
                </label>
              </div>

              <TextAreaField
                label="Description"
                value={
                  description
                }
                onChange={
                  setDescription
                }
                rows={
                  3
                }
                maximum={
                  1200
                }
              />

              {payload.products.length ? (
                <ProductSelection
                  message={
                    message
                  }
                  selectedIds={
                    selectedProductIds
                  }
                  onToggle={
                    toggleProduct
                  }
                />
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
              {
                error
              }
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/55 pt-4">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              Your access, ownership and
              approval rules still
              apply. Shelsea will not
              publish, place an Order or
              change stock automatically.
            </p>

            <button
              type="button"
              disabled={
                disabled
              }
              onClick={() =>
                void applyAction()
              }
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}

              {
                selectedDefinition?.label ??
                'Continue'
              }
            </button>
          </div>
        </div>

        {latestApplication?.status ===
          'APPLIED' &&
        latestApplication.href ? (
          <Link
            href={
              latestApplication.href
            }
            className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/12 px-4 py-3 text-xs font-black text-foreground transition hover:bg-accent/18">
            <span className="min-w-0 truncate">
              {
                latestApplication.label
              }
            </span>

            <ArrowRight className="size-4 shrink-0 text-accent" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function FieldLabel({
  children
}: {
  children:
    ReactNode;
}) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
      {
        children
      }
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  maximum,
  placeholder
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value: string
  ) => void;

  maximum:
    number;

  placeholder?:
    string;
}) {
  return (
    <label className="block">
      <FieldLabel>
        {
          label
        }
      </FieldLabel>

      <input
        value={
          value
        }
        onChange={
          (event: ChangeEvent<HTMLInputElement>) =>
            onChange(
              event.target.value
            )
        }
        maxLength={
          maximum
        }
        placeholder={
          placeholder
        }
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  maximum
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value: string
  ) => void;

  rows:
    number;

  maximum:
    number;
}) {
  return (
    <label className="block">
      <FieldLabel>
        {
          label
        }
      </FieldLabel>

      <textarea
        value={
          value
        }
        onChange={
          (event: ChangeEvent<HTMLTextAreaElement>) =>
            onChange(
              event.target.value
            )
        }
        rows={
          rows
        }
        maxLength={
          maximum
        }
        className="mt-2 w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
      />
    </label>
  );
}

function ReadOnlyFact({
  label,
  value
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-xs font-black">
        {
          value
        }
      </p>
    </div>
  );
}

function ProductSelection({
  message,
  selectedIds,
  onToggle
}: {
  message:
    AIAssistantMessageView;

  selectedIds:
    string[];

  onToggle: (
    id:
      string
  ) => void;
}) {
  const products =
    message.payload?.products ??
    [];

  return (
    <fieldset>
      <legend className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        Included products
      </legend>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map(
          product => {
            const checked =
              selectedIds.includes(
                product.id
              );

            return (
              <label
                key={
                  product.id
                }
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  checked
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-border/60 bg-background/55'
                }`}>
                <input
                  type="checkbox"
                  checked={
                    checked
                  }
                  onChange={() =>
                    onToggle(
                      product.id
                    )
                  }
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                />

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {
                      product.name
                    }
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    {
                      product.available
                    }{' '}
                    available
                  </span>
                </span>
              </label>
            );
          }
        )}
      </div>
    </fieldset>
  );
}
