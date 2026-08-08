import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../lib/generated/prisma/client';

const connectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (
  connectionString &&
  !connectionString.startsWith('postgres://') &&
  !connectionString.startsWith('postgresql://')
) {
  throw new Error(
    'Waffi Market seed database URL must be a PostgreSQL TCP connection string.'
  );
}

if (!connectionString) {
  throw new Error(
    'Waffi Market seed database URL is missing. Set DIRECT_URL (preferred) or DATABASE_URL.'
  );
}

const adapter = new PrismaPg({
  connectionString,
  max: 2,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 10_000
});

export const prisma = new PrismaClient({
  adapter,

  transactionOptions: {
    maxWait: 20_000,
    timeout: 120_000
  }
});
