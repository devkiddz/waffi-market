import fs from 'node:fs';

const checks = [
  {
    file: 'prisma.config.ts',
    marker: 'SHELSEA_PRODUCTION_AUTHORITY_CLEANUP_V1'
  },
  {
    file: 'lib/prisma.ts',
    marker: 'SHELSEA_PRODUCTION_AUTHORITY_CLEANUP_V1'
  },
  {
    file: 'prisma/seeds/seed-utils.ts',
    marker: 'SHELSEA_SEED_AUTHORITY_CLEANUP_V1'
  }
];

let failed = false;

for (const { file, marker } of checks) {
  const text = fs.readFileSync(file, 'utf8');

  if (text.includes('AJLOJIK_DB_')) {
    console.error(`❌ ${file}: legacy AJLOJIK_DB_ database authority remains.`);
    failed = true;
  }

  if (!text.includes(marker)) {
    console.error(`❌ ${file}: expected authority marker ${marker} is missing.`);
    failed = true;
  }
}

const prismaConfig = fs.readFileSync('prisma.config.ts', 'utf8');

if (
  !prismaConfig.includes('process.env.DIRECT_URL') ||
  !prismaConfig.includes('process.env.DATABASE_URL')
) {
  console.error('❌ prisma.config.ts must use DIRECT_URL with DATABASE_URL fallback.');
  failed = true;
}

const runtime = fs.readFileSync('lib/prisma.ts', 'utf8');

if (!runtime.includes('process.env.DATABASE_URL')) {
  console.error('❌ lib/prisma.ts must use DATABASE_URL.');
  failed = true;
}

const seed = fs.readFileSync('prisma/seeds/seed-utils.ts', 'utf8');

if (
  !seed.includes('process.env.DIRECT_URL') ||
  !seed.includes('process.env.DATABASE_URL')
) {
  console.error('❌ seed-utils.ts must use DIRECT_URL with DATABASE_URL fallback.');
  failed = true;
}

if (failed) process.exit(1);

console.log('✅ Shelsea production database authority is clean.');
console.log('   migrations: DIRECT_URL → DATABASE_URL fallback');
console.log('   runtime:    DATABASE_URL only');
console.log('   seed:       DIRECT_URL → DATABASE_URL fallback');
console.log('   AJ aliases: absent');
