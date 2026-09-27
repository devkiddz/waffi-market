'use server';

import { revalidatePath } from 'next/cache';

import type {
  AdminApprovalAction,
  AdminApprovalPriority,
  AdminApprovalSource,
  AdminTargetType,
  Prisma
} from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/features/admin/auth/adminPermissions';

import {
  approvalSourceFromTarget,
  operateApprovalLifecycle
} from './approvalLifecycleEngine';
import { createOrResubmitApprovalRequest } from './approvalRequestRepository';
import type { ApprovalLifecycleOperation } from './approvalTypes';

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error('Enter a valid date and time.');
  return parsed;
}

function parsePriority(value: FormDataEntryValue | null): AdminApprovalPriority | null {
  const raw = String(value ?? '').trim();
  return ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(raw)
    ? (raw as AdminApprovalPriority)
    : null;
}

function parseOperation(value: FormDataEntryValue | null): ApprovalLifecycleOperation {
  const raw = String(value ?? '').trim();
  const supported: ApprovalLifecycleOperation[] = [
    'inspect',
    'assign',
    'update-administration',
    'hold',
    'reactivate',
    'request-changes',
    'approve',
    'reject',
    'pause',
    'revert',
    'cancel'
  ];
  if (!supported.includes(raw as ApprovalLifecycleOperation)) {
    throw new Error('Choose a valid approval operation.');
  }
  return raw as ApprovalLifecycleOperation;
}

export async function requestAdminApproval(input: {
  action: AdminApprovalAction;
  targetType: AdminTargetType;
  targetId: string;
  reason: string;
  payload?: Prisma.InputJsonValue;
  source?: AdminApprovalSource;
  priority?: AdminApprovalPriority;
  dueAt?: Date | null;
}) {
  const access = await requireAdminPermission(
    input.action === 'DELIVERY_STATUS_UPDATE'
      ? 'delivery:update:request'
      : 'deletion:request'
  );
  const priority = input.priority ?? (input.action === 'DELETE' ? 'HIGH' : 'NORMAL');
  const source = approvalSourceFromTarget({
    explicitSource: input.source,
    targetType: input.targetType
  });

  const request = await prisma.$transaction(async transaction => {
    const created = await createOrResubmitApprovalRequest(transaction, {
      workspaceId: access.membership.workspaceId,
      requestedById: access.session.user.id,
      source,
      priority,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      payload: input.payload,
      dueAt: input.dueAt
    });

    await transaction.adminAuditEvent.create({
      data: {
        workspaceId: access.membership.workspaceId,
        actorId: access.session.user.id,
        action: 'APPROVAL_REQUESTED',
        targetType: input.targetType,
        targetId: input.targetId,
        summary: input.reason,
        metadata: {
          requestId: created.id,
          source,
          priority,
          revision: created.revision
        }
      }
    });

    return created;
  });

  revalidateApprovalSurfaces();
  return request;
}

export async function operateAdminApproval(formData: FormData) {
  const access = await requireAdminPermission('approval:review');
  const requestId = String(formData.get('id') ?? '').trim();
  if (!requestId) throw new Error('An approval request is required.');

  const operation = parseOperation(formData.get('operation'));
  const assignedReviewerRaw = formData.get('assignedReviewerId');
  const assignedReviewerId =
    assignedReviewerRaw === null
      ? undefined
      : String(assignedReviewerRaw).trim() || null;

  await operateApprovalLifecycle({
    workspaceId: access.membership.workspaceId,
    actorId: access.session.user.id,
    requestId,
    operation,
    note: String(formData.get('note') ?? '').trim() || null,
    assignedReviewerId,
    priority: parsePriority(formData.get('priority')),
    dueAt: parseDate(formData.get('dueAt')),
    holdUntil: parseDate(formData.get('holdUntil')),
    allowSelfReview: access.isDeveloperAdmin
  });

  revalidateApprovalSurfaces();
}

export async function reviewAdminApproval(formData: FormData) {
  const decision = String(formData.get('decision') ?? '').trim();
  const normalized = new FormData();
  normalized.set('id', String(formData.get('id') ?? ''));
  normalized.set(
    'operation',
    decision === 'APPROVED' ? 'approve' : decision === 'REJECTED' ? 'reject' : ''
  );
  normalized.set('note', String(formData.get('reviewNote') ?? ''));
  return operateAdminApproval(normalized);
}

function revalidateApprovalSurfaces() {
  revalidatePath('/admin');
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/todos');
  revalidatePath('/admin/store-studio');
  revalidatePath('/store');
  revalidatePath('/vendors');
  revalidatePath('/notifications');
}
