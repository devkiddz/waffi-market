import 'server-only';

import type {
  SupportKnowledgeStudioEntry,
  SupportKnowledgeStudioSnapshot
} from '../supportKnowledgeManagementTypes';
import { parseSupportKnowledgeMutation } from './supportKnowledgeManagementValidation';
import {
  getSupportKnowledgeStudioSnapshot,
  saveSupportKnowledgeEntry
} from './supportKnowledgeManagementRepository';

export class SupportKnowledgeManagementError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'SupportKnowledgeManagementError';
  }
}

function managementError(cause: unknown): SupportKnowledgeManagementError {
  if (cause instanceof SupportKnowledgeManagementError) return cause;
  if (cause instanceof Error) {
    const normalized = cause.message.toLowerCase();
    if (normalized.includes('could not be found')) {
      return new SupportKnowledgeManagementError(cause.message, 'NOT_FOUND');
    }
    if (normalized.includes('unique') || normalized.includes('already')) {
      return new SupportKnowledgeManagementError(
        'A Support Knowledge entry already uses that slug.',
        'CONFLICT'
      );
    }
    return new SupportKnowledgeManagementError(cause.message, 'INVALID_INPUT');
  }
  return new SupportKnowledgeManagementError(
    'Shelsea could not update Support Knowledge.',
    'INVALID_INPUT'
  );
}

export async function resolveSupportKnowledgeStudio(
  workspaceId: string
): Promise<SupportKnowledgeStudioSnapshot> {
  return getSupportKnowledgeStudioSnapshot(workspaceId);
}

export async function mutateSupportKnowledgeEntry(input: {
  workspaceId: string;
  actorId: string;
  entryId?: string | null;
  payload: unknown;
}): Promise<SupportKnowledgeStudioEntry> {
  try {
    return await saveSupportKnowledgeEntry({
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      entryId: input.entryId ?? null,
      mutation: parseSupportKnowledgeMutation(input.payload)
    });
  } catch (cause) {
    throw managementError(cause);
  }
}
