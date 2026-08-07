import 'dotenv/config';

import { defineConfig } from 'prisma/config';

// SHELSEA_PRODUCTION_AUTHORITY_CLEANUP_V1
const migrationConnectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (
  migrationConnectionString &&
  !migrationConnectionString.startsWith('postgres://') &&
  !migrationConnectionString.startsWith('postgresql://')
) {
  throw new Error(
    'Shelsea migration database URL must be a PostgreSQL TCP connection string.'
  );
}

if (!migrationConnectionString) {
  throw new Error(
    'Shelsea migration database URL is missing. Set DIRECT_URL (preferred) or DATABASE_URL.'
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },

  datasource: {
    url: migrationConnectionString
  }
});