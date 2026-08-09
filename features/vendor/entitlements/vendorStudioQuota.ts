import 'server-only';

import type { Prisma } from '@/lib/generated/prisma/client';

const VENDOR_STUDIO_QUOTA_LOCK_NAMESPACE = 'waffi:vendor-studio-quota';
const VENDOR_STUDIO_MEMBER_LOCK_NAMESPACE = 'waffi:vendor-studio-member';

export class VendorStudioQuotaExceededError extends Error {
  readonly code = 'VENDOR_STUDIO_QUOTA_EXCEEDED';

  constructor(message: string) {
    super(message);
    this.name = 'VendorStudioQuotaExceededError';
  }
}

async function lockVendorStudioKey(
  transaction: Prisma.TransactionClient,
  lockKey: string
): Promise<void> {
  await transaction.$queryRaw<Array<{ locked: number }>>`
    SELECT 1::int AS "locked"
    FROM pg_advisory_xact_lock(
      hashtextextended(${lockKey}::text, 0::bigint)
    )
  `;
}

export async function lockVendorStudioQuota(
  transaction: Prisma.TransactionClient,
  vendorProfileId: string
): Promise<void> {
  await lockVendorStudioKey(
    transaction,
    `${VENDOR_STUDIO_QUOTA_LOCK_NAMESPACE}:${vendorProfileId}`
  );
}

export async function lockVendorStudioMember(
  transaction: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  await lockVendorStudioKey(
    transaction,
    `${VENDOR_STUDIO_MEMBER_LOCK_NAMESPACE}:${userId}`
  );
}

export function assertVendorStudioQuotaAvailable({
  current,
  limit,
  message
}: {
  current: number;
  limit: number | null;
  message: string;
}): void {
  if (limit !== null && current >= limit) {
    throw new VendorStudioQuotaExceededError(message);
  }
}
