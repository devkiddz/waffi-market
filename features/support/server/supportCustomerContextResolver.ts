import 'server-only';

import type {
  SupportGuideAction,
  SupportGuideContextReference,
  SupportGuideContextSnapshot,
  SupportGuideIntent
} from '../supportGuideTypes';

import {
  getSupportCustomerIdentityContext,
  getSupportCustomerSavedLocation,
  listSupportCustomerOrderContext,
  listSupportCustomerProductContext
} from './supportCustomerContextRepository';

import {
  extractSupportProductClues,
  selectSupportOrderContext,
  selectSupportProductContext
} from './supportCustomerContextSelection';

import {
  SUPPORT_CUSTOMER_CONTEXT_KEYS
} from './supportCustomerContextTypes';

import type {
  SupportCustomerContextKey,
  SupportCustomerLocationContext,
  SupportCustomerOrderCandidate,
  SupportCustomerProductCandidate
} from './supportCustomerContextTypes';

const SUPPORTED_CONTEXT_KEYS =
  new Set<string>(
    SUPPORT_CUSTOMER_CONTEXT_KEYS
  );

const dateFormatter =
  new Intl.DateTimeFormat(
    'en-NG',
    {
      dateStyle:
        'medium',
      timeStyle:
        'short',
      timeZone:
        'Africa/Lagos'
    }
  );

export type SupportCustomerContextResolution = {
  snapshot: SupportGuideContextSnapshot;
  narrative: string | null;
  followUp: string | null;
  actions: SupportGuideAction[];
  requiresHuman: boolean;
};

function formatStatus(
  value: string
): string {
  return value
    .replaceAll(
      '_',
      ' '
    )
    .toLowerCase();
}

function formatDate(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return dateFormatter.format(
    date
  );
}

function formatMoney(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      'en-NG',
      {
        style:
          'currency',
        currency,
        maximumFractionDigits:
          2
      }
    ).format(
      amount
    );
  } catch {
    return `${currency} ${amount.toFixed(
      2
    )}`;
  }
}

function contextState(
  resolved:
    readonly string[],
  missing:
    readonly string[],
  ambiguous:
    readonly string[]
): SupportGuideContextSnapshot['state'] {
  if (
    ambiguous.length
  ) {
    return 'AMBIGUOUS';
  }

  if (
    missing.length &&
    resolved.length
  ) {
    return 'PARTIAL';
  }

  if (
    missing.length
  ) {
    return 'UNAVAILABLE';
  }

  return 'RESOLVED';
}

function unique(
  values:
    readonly string[]
): string[] {
  return [
    ...new Set(
      values
    )
  ];
}

function uniqueActions(
  values:
    readonly SupportGuideAction[]
): SupportGuideAction[] {
  const seen =
    new Set<string>();

  return values.filter(
    value => {
      if (
        seen.has(
          value.id
        )
      ) {
        return false;
      }

      seen.add(
        value.id
      );

      return true;
    }
  );
}

function orderPrompt(
  intent:
    SupportGuideIntent,
  orderNumber:
    string
): string {
  if (
    intent ===
    'PAYMENT_HELP'
  ) {
    return `I need payment help for order ${orderNumber}`;
  }

  if (
    intent ===
    'DELIVERY_HELP'
  ) {
    return `I need delivery help for order ${orderNumber}`;
  }

  if (
    intent ===
    'RETURNS_AND_REFUNDS'
  ) {
    return `Can I get a refund for order ${orderNumber}?`;
  }

  return `Where is order ${orderNumber}?`;
}

function orderCandidateActions(
  intent:
    SupportGuideIntent,
  orders:
    readonly SupportCustomerOrderCandidate[]
): SupportGuideAction[] {
  return orders
    .slice(
      0,
      4
    )
    .map(
      order => ({
        id:
          `support-context-order-${order.id}`,
        label:
          order.orderNumber,
        kind:
          'FOLLOW_UP' as const,
        prompt:
          orderPrompt(
            intent,
            order.orderNumber
          )
      })
    );
}

function productCandidateActions(
  products:
    readonly SupportCustomerProductCandidate[]
): SupportGuideAction[] {
  return products
    .slice(
      0,
      4
    )
    .map(
      product => ({
        id:
          `support-context-product-${product.id}`,
        label:
          product.name,
        kind:
          'FOLLOW_UP' as const,
        prompt:
          `Is this product available: ${product.name}?`
      })
    );
}

function asLocation(
  value: unknown
): SupportCustomerLocationContext | null {
  if (
    typeof value !==
      'object' ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }

  const record =
    value as
      Record<
        string,
        unknown
      >;

  const city =
    typeof record.city ===
      'string'
      ? record.city
      : null;

  const state =
    typeof record.state ===
      'string'
      ? record.state
      : null;

  const country =
    typeof record.country ===
      'string'
      ? record.country
      : null;

  if (
    !city &&
    !state &&
    !country
  ) {
    return null;
  }

  return {
    source:
      'ORDER_ADDRESS',
    city,
    state,
    country
  };
}

function locationLabel(
  location:
    SupportCustomerLocationContext
): string {
  return [
    location.city,
    location.state,
    location.country
  ]
    .filter(
      Boolean
    )
    .join(
      ', '
    );
}

function orderReference(
  order:
    SupportCustomerOrderCandidate
): SupportGuideContextReference {
  return {
    kind:
      'ORDER',
    id:
      order.id,
    label:
      order.orderNumber,
    status:
      order.status,
    detail:
      formatDate(
        order.createdAt
      )
  };
}

function paymentReference(
  order:
    SupportCustomerOrderCandidate
): SupportGuideContextReference {
  return {
    kind:
      'PAYMENT',
    id:
      order.id,
    label:
      `Payment for ${order.orderNumber}`,
    status:
      order.paymentStatus,
    detail:
      order.payments[0]
        ? `Latest recorded attempt: ${formatStatus(
            order.payments[0]
              .status
          )}`
        : 'No separate payment attempt is recorded.'
  };
}

function deliveryReference(
  order:
    SupportCustomerOrderCandidate
): SupportGuideContextReference | null {
  if (
    !order.delivery
  ) {
    return null;
  }

  return {
    kind:
      'DELIVERY',
    id:
      order.delivery
        .id,
    label:
      order.delivery
        .trackingCode,
    status:
      order.delivery
        .status,
    detail:
      `Order ${order.orderNumber}`
  };
}

function productReference(
  product:
    SupportCustomerProductCandidate
): SupportGuideContextReference {
  return {
    kind:
      'PRODUCT',
    id:
      product.id,
    label:
      product.name,
    status:
      product.active
        ? product.status
        : 'INACTIVE',
    detail:
      product.estimatedDelivery
  };
}

function humanAction():
  SupportGuideAction {
  return {
    id:
      'support-context-human',
    label:
      'Talk to an agent',
    kind:
      'HUMAN_HANDOFF'
  };
}

function ordersAction():
  SupportGuideAction {
  return {
    id:
      'support-context-orders',
    label:
      'Open Orders',
    href:
      '/account/orders',
    kind:
      'NAVIGATE'
  };
}

function storeAction():
  SupportGuideAction {
  return {
    id:
      'support-context-store',
    label:
      'Open Store',
    href:
      '/store',
    kind:
      'NAVIGATE'
  };
}

export async function resolveSupportCustomerContext(
  input: {
    workspaceId: string;
    customerId: string;
    question: string;
    pathname?: string | null;
    intent: SupportGuideIntent;
    requiredContext:
      readonly string[];
  }
): Promise<SupportCustomerContextResolution> {
  const requested =
    unique(
      input.requiredContext
        .map(
          value =>
            value
              .trim()
              .toLowerCase()
        )
        .filter(
          Boolean
        )
    );

  if (
    !requested.length
  ) {
    return {
      snapshot: {
        state:
          'NOT_REQUIRED',
        resolved:
          [],
        missing:
          [],
        ambiguous:
          [],
        summary:
          [],
        references:
          []
      },
      narrative:
        null,
      followUp:
        null,
      actions:
        [],
      requiresHuman:
        false
    };
  }

  const resolved:
    string[] = [];

  const missing:
    string[] = [];

  const ambiguous:
    string[] = [];

  const summary:
    string[] = [];

  const references:
    SupportGuideContextReference[] =
      [];

  const actions:
    SupportGuideAction[] =
      [];

  let followUp:
    string | null =
      null;

  let requiresHuman =
    false;

  const identity =
    await getSupportCustomerIdentityContext(
      input.workspaceId,
      input.customerId
    );

  if (!identity) {
    return {
      snapshot: {
        state:
          'UNAVAILABLE',
        resolved:
          [],
        missing:
          requested,
        ambiguous:
          [],
        summary: [
          'The signed-in customer could not be verified inside the active workspace.'
        ],
        references:
          []
      },
      narrative:
        'I could not verify your customer workspace safely, so I will not use order, payment, delivery or account records.',
      followUp:
        'Please reconnect your account or continue with a human Support agent.',
      actions: [
        humanAction()
      ],
      requiresHuman:
        true
    };
  }

  if (
    requested.includes(
      'customer'
    )
  ) {
    resolved.push(
      'customer'
    );

    summary.push(
      identity.accountState ===
        'ACTIVE'
        ? 'The signed-in customer account is active.'
        : `The signed-in customer account is ${formatStatus(
            identity.accountState
          )}.`
    );

    references.push({
      kind:
        'CUSTOMER',
      id:
        identity.customerId,
      label:
        identity.name,
      status:
        identity.accountState,
      detail:
        identity.emailVerified
          ? 'Email verified'
          : 'Email not verified'
    });

    if (
      identity.accountState !==
      'ACTIVE'
    ) {
      requiresHuman =
        true;
    }
  }

  const needsOrderContext =
    requested.some(
      value =>
        value ===
          'order' ||
        value ===
          'payment' ||
        value ===
          'delivery'
    );

  let selectedOrder:
    SupportCustomerOrderCandidate | null =
      null;

  let orders:
    SupportCustomerOrderCandidate[] =
      [];

  if (
    needsOrderContext
  ) {
    orders =
      await listSupportCustomerOrderContext(
        input.workspaceId,
        input.customerId
      );

    const selection =
      selectSupportOrderContext({
        question:
          input.question,
        pathname:
          input.pathname,
        intent:
          input.intent,
        orders
      });

    if (
      selection.state ===
      'SELECTED' &&
      selection.selected
    ) {
      selectedOrder =
        selection.selected;

      actions.push(
        ordersAction()
      );

      references.push(
        orderReference(
          selectedOrder
        )
      );

      if (
        requested.includes(
          'order'
        )
      ) {
        resolved.push(
          'order'
        );

        const itemSummary =
          selectedOrder.items
            .slice(
              0,
              3
            )
            .map(
              item =>
                `${item.quantity}× ${item.productName} (${item.variantLabel})`
            )
            .join(
              ', '
            );

        summary.push(
          `Order ${selectedOrder.orderNumber} is ${formatStatus(
            selectedOrder.status
          )}; it was created ${formatDate(
            selectedOrder.createdAt
          ) ?? 'at an unavailable time'} and totals ${formatMoney(
            selectedOrder.total,
            identity.currency
          )}${itemSummary ? `. Items: ${itemSummary}.` : '.'}`
        );
      }

      if (
        requested.includes(
          'payment'
        )
      ) {
        resolved.push(
          'payment'
        );

        references.push(
          paymentReference(
            selectedOrder
          )
        );

        const latestPayment =
          selectedOrder
            .payments[0] ??
          null;

        summary.push(
          latestPayment
            ? `The verified order payment state is ${formatStatus(
                selectedOrder.paymentStatus
              )}; the latest recorded payment attempt is ${formatStatus(
                latestPayment.status
              )}${latestPayment.paidAt ? ` with a paid time of ${formatDate(latestPayment.paidAt)}` : ''}.`
            : `The verified order payment state is ${formatStatus(
                selectedOrder.paymentStatus
              )}; no separate payment attempt is recorded.`
        );

        if (
          latestPayment &&
          latestPayment.status !==
            selectedOrder.paymentStatus
        ) {
          summary.push(
            'The order-level and latest payment-attempt states are different, so an authorised human should review the payment before another charge is attempted.'
          );

          requiresHuman =
            true;
        }
      }

      if (
        requested.includes(
          'delivery'
        )
      ) {
        if (
          selectedOrder.delivery
        ) {
          resolved.push(
            'delivery'
          );

          const delivery =
            selectedOrder.delivery;

          const reference =
            deliveryReference(
              selectedOrder
            );

          if (reference) {
            references.push(
              reference
            );
          }

          const estimate =
            formatDate(
              delivery.estimatedArrival
            );

          const lastUpdate =
            formatDate(
              delivery.lastLocationAt ??
              delivery.updatedAt
            );

          summary.push(
            `Delivery ${delivery.trackingCode} for order ${selectedOrder.orderNumber} is ${formatStatus(
              delivery.status
            )}${estimate ? ` with an estimated arrival of ${estimate}` : ''}${lastUpdate ? `. Last confirmed delivery update: ${lastUpdate}.` : '.'}`
          );

          if (
            delivery.estimatedArrival &&
            new Date(
              delivery.estimatedArrival
            ).getTime() <
              Date.now() &&
            ![
              'DELIVERED',
              'FAILED',
              'CANCELLED'
            ].includes(
              delivery.status
            )
          ) {
            summary.push(
              'The recorded estimated arrival has passed without a terminal delivery state.'
            );

            requiresHuman =
              true;
          }

          if (
            (
              delivery.status ===
                'DELIVERED'
            ) !==
            (
              selectedOrder.status ===
                'DELIVERED'
            )
          ) {
            summary.push(
              'The order and delivery completion states do not agree, so a human review is appropriate.'
            );

            requiresHuman =
              true;
          }
        } else {
          missing.push(
            'delivery'
          );

          summary.push(
            `Order ${selectedOrder.orderNumber} does not currently have a delivery record.`
          );

          requiresHuman =
            input.intent ===
              'DELIVERY_HELP';
        }
      }

      followUp =
        requiresHuman
          ? 'Would you like a human Support agent to review these verified records?'
          : `Would you like more help with order ${selectedOrder.orderNumber}?`;
    } else if (
      selection.state ===
      'AMBIGUOUS'
    ) {
      const orderKeys =
        requested.filter(
          value =>
            value ===
              'order' ||
            value ===
              'payment' ||
            value ===
              'delivery'
        );

      ambiguous.push(
        ...orderKeys
      );

      actions.push(
        ...orderCandidateActions(
          input.intent,
          selection.candidates
        ),
        ordersAction()
      );

      summary.push(
        `I found ${selection.candidates.length} possible recent orders and will not choose one without confirmation.`
      );

      references.push(
        ...selection.candidates.map(
          orderReference
        )
      );

      followUp =
        'Which order should I use? Select an order number or include it in your message.';
    } else {
      const orderKeys =
        requested.filter(
          value =>
            value ===
              'order' ||
            value ===
              'payment' ||
            value ===
              'delivery'
        );

      missing.push(
        ...orderKeys
      );

      actions.push(
        ordersAction()
      );

      summary.push(
        'No customer-owned order matching this request was found in the active workspace.'
      );

      followUp =
        'Provide the order number, or open Orders and choose the relevant order.';
    }
  }

  if (
    requested.includes(
      'product'
    )
  ) {
    const clues =
      extractSupportProductClues(
        input.question,
        input.pathname
      );

    const products =
      await listSupportCustomerProductContext(
        input.workspaceId,
        clues
      );

    const selection =
      selectSupportProductContext({
        question:
          input.question,
        pathname:
          input.pathname,
        products
      });

    if (
      selection.state ===
        'SELECTED' &&
      selection.selected
    ) {
      const product =
        selection.selected;

      references.push(
        productReference(
          product
        )
      );

      const activeVariants =
        product.variants.filter(
          variant =>
            variant.active
        );

      const knownInventory =
        activeVariants.filter(
          variant =>
            variant.availableQuantity !==
            null
        );

      const available =
        knownInventory.filter(
          variant =>
            (
              variant.availableQuantity ??
              0
            ) >
            0
        );

      if (
        !product.active ||
        product.status !==
          'PUBLISHED'
      ) {
        resolved.push(
          'product'
        );

        summary.push(
          `${product.name} is currently ${product.active ? formatStatus(product.status) : 'inactive'} and is not available for a new purchase.`
        );
      } else if (
        knownInventory.length
      ) {
        resolved.push(
          'product'
        );

        summary.push(
          available.length
            ? `${product.name} is published. In-stock variants: ${available
                .slice(
                  0,
                  5
                )
                .map(
                  variant =>
                    `${variant.label} (${variant.availableQuantity} available)`
                )
                .join(
                  ', '
                )}.`
            : `${product.name} is published, but every active variant with a confirmed inventory record is currently out of stock.`
        );
      } else {
        missing.push(
          'product'
        );

        summary.push(
          `${product.name} was identified, but its active variants do not have a confirmed inventory record.`
        );

        requiresHuman =
          true;
      }

      actions.push(
        storeAction()
      );

      followUp =
        available.length >
        1
          ? 'Which available variant do you want?'
          : followUp;
    } else if (
      selection.state ===
      'AMBIGUOUS'
    ) {
      ambiguous.push(
        'product'
      );

      actions.push(
        ...productCandidateActions(
          selection.candidates
        ),
        storeAction()
      );

      references.push(
        ...selection.candidates.map(
          productReference
        )
      );

      summary.push(
        `I found ${selection.candidates.length} possible products and will not choose one without confirmation.`
      );

      followUp =
        'Which product do you mean?';
    } else {
      missing.push(
        'product'
      );

      actions.push(
        storeAction()
      );

      summary.push(
        clues.length
          ? 'No published or historical product record matched the supplied product clues.'
          : 'The question does not identify a specific product or variant.'
      );

      followUp =
        'Tell me the product name or open the relevant product before asking about availability.';
    }
  }

  if (
    requested.includes(
      'location'
    )
  ) {
    const savedLocation =
      await getSupportCustomerSavedLocation(
        input.customerId
      );

    const orderLocation =
      selectedOrder
        ? asLocation(
            selectedOrder
              .deliveryAddress
          )
        : null;

    const location =
      orderLocation ??
      savedLocation;

    if (location) {
      resolved.push(
        'location'
      );

      const label =
        locationLabel(
          location
        );

      references.push({
        kind:
          'LOCATION',
        id:
          null,
        label:
          label ||
          'Saved delivery area',
        status:
          'CONFIRMED',
        detail:
          location.source ===
            'SAVED_ADDRESS'
            ? 'Saved customer address'
            : 'Selected order address'
      });

      summary.push(
        `The verified delivery area is ${label || 'recorded without a readable city or state'}. The exact street address is intentionally omitted from this Support reply.`
      );
    } else {
      missing.push(
        'location'
      );

      summary.push(
        'No saved delivery area could be verified for this request.'
      );

      requiresHuman =
        true;
    }
  }

  if (
    requested.includes(
      'verification'
    )
  ) {
    missing.push(
      'verification'
    );

    references.push({
      kind:
        'VERIFICATION',
      id:
        identity.customerId,
      label:
        'Customer eligibility verification',
      status:
        'NOT_CONFIRMED',
      detail:
        identity.emailVerified
          ? 'Email is verified; age or identity eligibility is not recorded.'
          : 'Email, age and identity eligibility are not fully verified.'
    });

    summary.push(
      identity.emailVerified
        ? 'The account email is verified, but the current schema does not contain a confirmed age or identity eligibility record for alcohol delivery.'
        : 'The available account record does not confirm the verification required for alcohol delivery.'
    );

    requiresHuman =
      true;

    followUp =
      'A human agent must confirm eligibility before Shelsea promises alcohol delivery.';
  }

  for (
    const value of
    requested
  ) {
    if (
      !SUPPORTED_CONTEXT_KEYS.has(
        value
      )
    ) {
      missing.push(
        value
      );

      summary.push(
        `The required context "${value}" is not connected to the Support resolver.`
      );

      requiresHuman =
        true;
    }
  }

  const finalResolved =
    unique(
      resolved
    );

  const finalMissing =
    unique(
      missing.filter(
        value =>
          !finalResolved.includes(
            value
          )
      )
    );

  const finalAmbiguous =
    unique(
      ambiguous.filter(
        value =>
          !finalResolved.includes(
            value
          )
      )
    );

  if (
    requiresHuman
  ) {
    actions.push(
      humanAction()
    );
  }

  const snapshot:
    SupportGuideContextSnapshot = {
      state:
        contextState(
          finalResolved,
          finalMissing,
          finalAmbiguous
        ),
      resolved:
        finalResolved,
      missing:
        finalMissing,
      ambiguous:
        finalAmbiguous,
      summary:
        unique(
          summary
        ),
      references
  };

  return {
    snapshot,
    narrative:
      snapshot.summary.length
        ? [
            'Verified account context:',
            ...snapshot.summary.map(
              value =>
                `• ${value}`
            )
          ].join(
            '\n'
          )
        : null,
    followUp,
    actions:
      uniqueActions(
        actions
      ),
    requiresHuman:
      requiresHuman ||
      snapshot.state ===
        'UNAVAILABLE'
  };
}
