import 'server-only';

import {
  getAgentSupportCase
} from './supportRepository';
import {
  getSupportOperationsSnapshot
} from './supportOperationsRepository';

import type {
  SupportIntelligenceRisk,
  SupportIntelligenceSnapshot
} from '../supportIntelligenceTypes';
import type {
  SupportCommerceActionTypeValue
} from '../supportOperationsTypes';
import type {
  SupportCaseStatusValue
} from '../supportTypes';

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ??
    'there';
}

function recommendedActions(
  category: string,
  hasOrder: boolean,
  hasDelivery: boolean,
  hasVendor: boolean
): SupportCommerceActionTypeValue[] {
  const actions:
    SupportCommerceActionTypeValue[] = [];

  if (
    category === 'PAYMENT' &&
    hasOrder
  ) {
    actions.push(
      'PAYMENT_REVIEW',
      'REFUND_REQUEST'
    );
  }

  if (
    category === 'ORDER' &&
    hasOrder
  ) {
    actions.push(
      'PAYMENT_REVIEW',
      'ORDER_CANCELLATION'
    );
  }

  if (
    category === 'DELIVERY' &&
    hasDelivery
  ) {
    actions.push('DELIVERY_RETRY');
  }

  if (
    category === 'PRODUCT'
  ) {
    actions.push('INVENTORY_REVIEW');
  }

  if (
    category === 'VENDOR' &&
    hasVendor
  ) {
    actions.push('VENDOR_FOLLOWUP');
  }

  return Array.from(new Set(actions));
}

function recommendedStatus(
  current: SupportCaseStatusValue,
  lastSenderRole: string | null
): SupportCaseStatusValue | null {
  if (
    current === 'NEW' ||
    current === 'TRIAGED' ||
    current === 'ASSIGNED'
  ) {
    return 'IN_PROGRESS';
  }

  if (
    lastSenderRole === 'CUSTOMER' &&
    current === 'WAITING_CUSTOMER'
  ) {
    return 'IN_PROGRESS';
  }

  if (
    lastSenderRole ===
      'SUPPORT_AGENT' &&
    current === 'IN_PROGRESS'
  ) {
    return 'WAITING_CUSTOMER';
  }

  return null;
}

export async function getSupportIntelligenceSnapshot(
  caseId: string,
  workspaceId: string
): Promise<SupportIntelligenceSnapshot | null> {
  const [
    supportCase,
    operations
  ] = await Promise.all([
    getAgentSupportCase(
      caseId,
      workspaceId
    ),
    getSupportOperationsSnapshot(
      caseId,
      workspaceId
    )
  ]);

  if (!supportCase || !operations) {
    return null;
  }

  const now = new Date();
  const dueAt =
    supportCase.dueAt
      ? new Date(supportCase.dueAt)
      : null;
  const overdue =
    Boolean(
      dueAt &&
      dueAt < now &&
      ![
        'RESOLVED',
        'CUSTOMER_CONFIRMED',
        'CLOSED'
      ].includes(supportCase.status)
    );
  const openEscalation =
    supportCase.escalations.some(
      item =>
        item.status === 'OPEN' ||
        item.status === 'ACKNOWLEDGED'
    );
  const unresolvedPreparedAction =
    operations.actions.some(
      item =>
        item.status === 'PREPARED'
    );

  let risk:
    SupportIntelligenceRisk = 'LOW';
  const riskReasons: string[] = [];

  if (
    supportCase.priority === 'URGENT'
  ) {
    risk = 'CRITICAL';
    riskReasons.push(
      'The case is marked urgent.'
    );
  } else if (
    overdue ||
    openEscalation
  ) {
    risk = 'HIGH';
  } else if (
    supportCase.priority === 'HIGH' ||
    unresolvedPreparedAction ||
    supportCase.status.startsWith(
      'WAITING_'
    )
  ) {
    risk = 'MEDIUM';
  }

  if (overdue) {
    riskReasons.push(
      'The resolution target has passed.'
    );
  }

  if (openEscalation) {
    riskReasons.push(
      'An escalation remains open.'
    );
  }

  if (unresolvedPreparedAction) {
    riskReasons.push(
      'A prepared commerce action still requires review.'
    );
  }

  if (!riskReasons.length) {
    riskReasons.push(
      'No urgent operational risk was detected from verified case data.'
    );
  }

  const facts = [
    `Case ${supportCase.caseNumber} is ${supportCase.status.replaceAll('_', ' ').toLowerCase()} with ${supportCase.priority.toLowerCase()} priority.`,
    `Customer: ${supportCase.customer.name}.`,
    supportCase.order
      ? `Order ${supportCase.order.orderNumber} is ${supportCase.order.status.toLowerCase()}.`
      : null,
    supportCase.delivery
      ? `Delivery ${supportCase.delivery.trackingCode} is ${supportCase.delivery.status.toLowerCase()}.`
      : null,
    supportCase.vendor
      ? `Vendor context: ${supportCase.vendor.name}.`
      : null,
    supportCase.assignedAgent
      ? `Assigned agent: ${supportCase.assignedAgent.name}.`
      : 'No agent is currently assigned.'
  ].filter(
    (value): value is string =>
      Boolean(value)
  );

  const missingEvidence: string[] = [];

  if (
    [
      'ORDER',
      'PAYMENT',
      'DELIVERY'
    ].includes(supportCase.category) &&
    !supportCase.order
  ) {
    missingEvidence.push(
      'No order is linked to this commerce-related case.'
    );
  }

  if (
    supportCase.category ===
      'DELIVERY' &&
    !supportCase.delivery
  ) {
    missingEvidence.push(
      'No delivery record is linked.'
    );
  }

  if (
    !supportCase.conversation
      .messages.length
  ) {
    missingEvidence.push(
      'The conversation has no visible messages.'
    );
  }

  const lastMessage =
    supportCase.conversation.messages.at(
      -1
    ) ?? null;

  const actionSuggestions =
    recommendedActions(
      supportCase.category,
      Boolean(supportCase.order),
      Boolean(supportCase.delivery),
      Boolean(supportCase.vendor)
    );

  const replyDetails = [
    supportCase.order
      ? `We are reviewing order ${supportCase.order.orderNumber}.`
      : null,
    supportCase.delivery
      ? `The current delivery state is ${supportCase.delivery.status.replaceAll('_', ' ').toLowerCase()}.`
      : null,
    unresolvedPreparedAction
      ? 'A proposed commerce action is awaiting governed review; it has not been executed.'
      : null
  ]
    .filter(Boolean)
    .join(' ');

  return {
    caseId,
    generatedAt: now.toISOString(),
    provider:
      'RCENTZ_SUPPORT_DETERMINISTIC_V1',
    executiveSummary:
      `${supportCase.subject} — ${supportCase.description.slice(0, 280)}${supportCase.description.length > 280 ? '…' : ''}`,
    risk: {
      level: risk,
      reasons: riskReasons
    },
    verifiedFacts: facts,
    missingEvidence,
    recommendedStatus:
      recommendedStatus(
        supportCase.status,
        lastMessage?.senderRole ?? null
      ),
    recommendedActions:
      actionSuggestions,
    draftReply:
      `Hello ${firstName(supportCase.customer.name)}, thank you for contacting Shelsea about “${supportCase.subject}”. ${replyDetails || 'We are reviewing the verified details attached to your Support Case.'} We will keep this case updated with confirmed information and will not apply any irreversible action without the required approval.`,
    guardrails: [
      'This assistance uses only the current workspace and case context.',
      'The draft must be reviewed by an authorised agent before sending.',
      'Suggested commerce actions are not executed automatically.',
      'Missing evidence must not be replaced with assumptions.'
    ]
  };
}
