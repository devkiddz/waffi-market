import 'server-only';

import type {
  AdminTargetType,
  DeliveryStatus,
  OrderStatus,
  Prisma
} from '@/lib/generated/prisma/client';

import { createCustomerNotification } from './notificationRepository';

function sentenceCase(value: string) {
  const normalized = value.replaceAll('_', ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export async function notifyOrderStatusChanged(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
  }
) {
  const delivered = input.status === 'DELIVERED';
  const cancelled = input.status === 'CANCELLED';
  const refunded = input.status === 'REFUNDED';

  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'ORDER',
    priority: cancelled || refunded ? 'HIGH' : delivered ? 'NORMAL' : 'NORMAL',
    title: `Order ${sentenceCase(input.status)}`,
    message: `${input.orderNumber} is now ${sentenceCase(input.status).toLowerCase()}.`,
    href: '/orders',
    targetType: 'ORDER',
    targetId: input.orderId,
    dedupeKey: `order:${input.orderId}:status:${input.status}`,
    scopeKey: `order:${input.orderId}`,
    metadata: {
      orderNumber: input.orderNumber,
      status: input.status
    }
  });
}

export async function notifyDeliveryStatusChanged(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    deliveryId: string;
    trackingCode: string;
    status: DeliveryStatus;
  }
) {
  const urgent = input.status === 'FAILED' || input.status === 'CANCELLED';

  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'DELIVERY',
    priority: urgent ? 'URGENT' : 'NORMAL',
    title: `Delivery ${sentenceCase(input.status)}`,
    message: `Tracking ${input.trackingCode} is now ${sentenceCase(input.status).toLowerCase()}.`,
    href: '/orders',
    targetType: 'DELIVERY',
    targetId: input.deliveryId,
    dedupeKey: `delivery:${input.deliveryId}:status:${input.status}`,
    scopeKey: `delivery:${input.deliveryId}`,
    metadata: {
      trackingCode: input.trackingCode,
      status: input.status
    }
  });
}

export async function notifyShoppingListPublicationSubmitted(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    listId: string;
    listName: string;
    revision?: boolean;
    eventKey: string;
  }
) {
  const event = input.revision ? 'revision-submitted' : 'submitted';

  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SHOPPING_LIST',
    title: input.revision
      ? 'Shopping List revision submitted'
      : 'Shopping List submitted',
    message: `${input.listName} is waiting for Shelsea review.`,
    href: `/account/lists/${input.listId}`,
    targetType: 'SHOPPING_LIST',
    targetId: input.listId,
    dedupeKey: `shopping-list:${input.listId}:publication:${event}:${input.eventKey}`,
    scopeKey: `shopping-list:${input.listId}`,
    metadata: {
      listName: input.listName,
      revision: Boolean(input.revision)
    }
  });
}

export async function notifyShoppingListPublicationReviewed(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    listId: string;
    listName: string;
    decision: 'APPROVED' | 'REJECTED';
    reviewNote?: string | null;
    eventKey: string;
  }
) {
  const approved = input.decision === 'APPROVED';

  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SHOPPING_LIST',
    priority: approved ? 'NORMAL' : 'HIGH',
    title: approved
      ? 'Shopping List approved'
      : 'Shopping List needs attention',
    message:
      input.reviewNote?.trim() ||
      (approved
        ? `${input.listName} is now available in the public Store experience.`
        : `${input.listName} was not approved for public Store placement.`),
    href: `/account/lists/${input.listId}`,
    targetType: 'SHOPPING_LIST',
    targetId: input.listId,
    dedupeKey: `shopping-list:${input.listId}:publication:${input.decision.toLowerCase()}:${input.eventKey}`,
    scopeKey: `shopping-list:${input.listId}`,
    metadata: {
      listName: input.listName,
      decision: input.decision
    }
  });
}

export async function notifyShoppingListPublicationWithdrawn(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    listId: string;
    listName: string;
    eventKey: string;
  }
) {
  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SHOPPING_LIST',
    priority: 'LOW',
    title: 'Shopping List returned to private',
    message: `${input.listName} is no longer awaiting or using public Store placement.`,
    href: `/account/lists/${input.listId}`,
    targetType: 'SHOPPING_LIST',
    targetId: input.listId,
    dedupeKey: `shopping-list:${input.listId}:publication:withdrawn:${input.eventKey}`,
    scopeKey: `shopping-list:${input.listId}`,
    metadata: {
      listName: input.listName
    }
  });
}

export async function notifyShoppingListPreparationUpdated(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    requestId: string;
    listId: string;
    listName: string;
    status: string;
    message: string;
    urgent?: boolean;
  }
) {
  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SHOPPING_LIST',
    priority: input.urgent ? 'URGENT' : 'NORMAL',
    title: `${input.listName}: ${sentenceCase(input.status)}`,
    message: input.message,
    href: `/account/lists/${input.listId}`,
    targetType: 'SHOPPING_LIST',
    targetId: input.listId,
    dedupeKey: `shopping-list-preparation:${input.requestId}:status:${input.status}`,
    scopeKey: `shopping-list:${input.listId}`,
    metadata: {
      requestId: input.requestId,
      status: input.status
    }
  });
}

export async function notifySupportUpdated(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    supportId: string;
    title: string;
    message: string;
    eventKey: string;
    urgent?: boolean;
  }
) {
  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SUPPORT',
    priority: input.urgent ? 'URGENT' : 'NORMAL',
    title: input.title,
    message: input.message,
    href: '/support',
    targetType: 'OTHER',
    targetId: input.supportId,
    dedupeKey: `support:${input.supportId}:${input.eventKey}`,
    scopeKey: `support:${input.supportId}`
  });
}

export async function notifySystemUpdate(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    title: string;
    message: string;
    eventKey: string;
    href?: string | null;
    targetType?: AdminTargetType | null;
    targetId?: string | null;
    scopeKey?: string | null;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }
) {
  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'SYSTEM',
    priority: input.priority ?? 'NORMAL',
    title: input.title,
    message: input.message,
    href: input.href ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    dedupeKey: `system:${input.eventKey}`,
    scopeKey: input.scopeKey ?? null
  });
}

export async function notifyPromotionUpdate(
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    userId: string;
    promotionId: string;
    title: string;
    message: string;
    eventKey: string;
    href?: string | null;
  }
) {
  return createCustomerNotification(transaction, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    topic: 'PROMOTION',
    priority: 'LOW',
    title: input.title,
    message: input.message,
    href: input.href ?? '/store?category=deals',
    targetType: 'PROMOTION',
    targetId: input.promotionId,
    dedupeKey: `promotion:${input.promotionId}:${input.eventKey}`,
    scopeKey: `promotion:${input.promotionId}`
  });
}

