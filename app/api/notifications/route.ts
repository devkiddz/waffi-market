import { NextRequest, NextResponse } from 'next/server';

import {
  archiveNotification,
  clearNotificationScopeMute,
  getNotificationCenter,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationScopeMute,
  updateNotificationPreferences
} from '@/features/notifications/server/notificationRepository';
import type {
  AdminTargetType,
  NotificationTopic
} from '@/lib/generated/prisma/client';
import { getUserWorkspaces } from '@/features/workspace/services/get-user-workspaces';
import { ACTIVE_WORKSPACE_COOKIE } from '@/features/workspace/workspaceConstants';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TOPICS: NotificationTopic[] = [
  'ORDER',
  'DELIVERY',
  'SHOPPING_LIST',
  'SUPPORT',
  'COMMUNICATION',
  'SYSTEM',
  'PROMOTION'
];

const TARGET_TYPES: AdminTargetType[] = [
  'PRODUCT',
  'PROMOTION',
  'MEDIA',
  'COLLECTION',
  'CAMPAIGN',
  'VENDOR',
  'INVENTORY',
  'WORKSPACE',
  'EXPERIENCE',
  'FEATURED_LAYOUT',
  'ORDER',
  'DELIVERY',
  'TRACKING_EVENT',
  'USER',
  'STAFF',
  'SHOPPING_LIST',
  'OTHER'
];

async function resolveContext(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user?.id) {
    return null;
  }

  const requestedWorkspaceId =
    request.nextUrl.searchParams.get('workspaceId')?.trim() ||
    request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value ||
    null;

  const runtime = await getUserWorkspaces(
    session.user.id,
    requestedWorkspaceId
  );

  if (!runtime.activeWorkspace) {
    return null;
  }

  return {
    userId: session.user.id,
    workspaceId: runtime.activeWorkspace.id
  };
}

function limitFrom(request: NextRequest) {
  const value = Number.parseInt(
    request.nextUrl.searchParams.get('limit') ?? '50',
    10
  );

  return Number.isFinite(value)
    ? Math.min(100, Math.max(1, value))
    : 50;
}

async function readPatchBody(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0'
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveContext(request);

    if (!context) {
      return response(
        {
          error: 'Authentication and an active workspace are required.'
        },
        401
      );
    }

    return response(
      await getNotificationCenter(
        context.userId,
        context.workspaceId,
        limitFrom(request)
      )
    );
  } catch (error) {
    console.error('Notification centre GET failed.', error);

    return response(
      {
        error: 'Shelsea could not load notifications.'
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await resolveContext(request);

    if (!context) {
      return response(
        {
          error: 'Authentication and an active workspace are required.'
        },
        401
      );
    }

    const body = await readPatchBody(request);

    if (!body) {
      return response({ error: 'A valid JSON request body is required.' }, 400);
    }

    const action = String(body.action ?? '');

    if (action === 'mark-read') {
      const notificationId = String(body.notificationId ?? '').trim();

      if (!notificationId) {
        return response({ error: 'A notification is required.' }, 400);
      }

      await markNotificationRead(
        context.userId,
        context.workspaceId,
        notificationId
      );
    } else if (action === 'mark-all-read') {
      await markAllNotificationsRead(
        context.userId,
        context.workspaceId
      );
    } else if (action === 'archive') {
      const notificationId = String(body.notificationId ?? '').trim();

      if (!notificationId) {
        return response({ error: 'A notification is required.' }, 400);
      }

      await archiveNotification(
        context.userId,
        context.workspaceId,
        notificationId
      );
    } else if (action === 'update-preferences') {
      const supplied =
        body.preferences &&
        typeof body.preferences === 'object' &&
        !Array.isArray(body.preferences)
          ? (body.preferences as Record<string, unknown>)
          : {};

      const patch: Parameters<typeof updateNotificationPreferences>[2] = {};
      const booleanKeys = [
        'inAppEnabled',
        'orderUpdates',
        'deliveryUpdates',
        'shoppingListUpdates',
        'supportUpdates',
        'communicationUpdates',
        'systemUpdates',
        'promotionUpdates'
      ] as const;

      for (const key of booleanKeys) {
        if (typeof supplied[key] === 'boolean') {
          patch[key] = supplied[key];
        }
      }

      if ('mutedUntil' in supplied) {
        if (supplied.mutedUntil === null || supplied.mutedUntil === '') {
          patch.mutedUntil = null;
        } else {
          const mutedUntil = new Date(String(supplied.mutedUntil));

          if (Number.isNaN(mutedUntil.getTime())) {
            return response({ error: 'The mute date is invalid.' }, 400);
          }

          patch.mutedUntil = mutedUntil;
        }
      }

      await updateNotificationPreferences(
        context.userId,
        context.workspaceId,
        patch
      );
    } else if (action === 'mute-scope') {
      const scopeKey = String(body.scopeKey ?? '').trim();
      const topic = String(body.topic ?? '').trim() as NotificationTopic;

      if (
        !scopeKey ||
        scopeKey.length > 240 ||
        !TOPICS.includes(topic)
      ) {
        return response({ error: 'A valid notification scope is required.' }, 400);
      }

      const mutedUntil = body.mutedUntil
        ? new Date(String(body.mutedUntil))
        : null;

      if (mutedUntil && Number.isNaN(mutedUntil.getTime())) {
        return response({ error: 'The mute date is invalid.' }, 400);
      }

      const requestedTargetType = body.targetType
        ? String(body.targetType)
        : null;
      const targetType = requestedTargetType &&
        TARGET_TYPES.includes(requestedTargetType as AdminTargetType)
        ? (requestedTargetType as AdminTargetType)
        : null;

      if (requestedTargetType && !targetType) {
        return response({ error: 'The notification target is invalid.' }, 400);
      }

      const targetId = body.targetId
        ? String(body.targetId).trim()
        : null;
      const reason = body.reason
        ? String(body.reason).trim()
        : null;

      if (
        (targetId && targetId.length > 240) ||
        (reason && reason.length > 500)
      ) {
        return response(
          { error: 'Notification mute details are too long.' },
          400
        );
      }

      await setNotificationScopeMute({
        userId: context.userId,
        workspaceId: context.workspaceId,
        scopeKey,
        topic,
        targetType,
        targetId,
        mutedUntil,
        reason
      });
    } else if (action === 'unmute-scope') {
      const scopeKey = String(body.scopeKey ?? '').trim();

      if (!scopeKey || scopeKey.length > 240) {
        return response({ error: 'A notification scope is required.' }, 400);
      }

      await clearNotificationScopeMute(
        context.userId,
        context.workspaceId,
        scopeKey
      );
    } else {
      return response({ error: 'Unsupported notification action.' }, 400);
    }

    return response(
      await getNotificationCenter(
        context.userId,
        context.workspaceId,
        limitFrom(request)
      )
    );
  } catch (error) {
    console.error('Notification centre PATCH failed.', error);

    return response(
      {
        error: 'Shelsea could not update notifications.'
      },
      500
    );
  }
}
