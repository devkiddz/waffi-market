import fs from 'node:fs';

const file = 'prisma/seeds/seed-utils.ts';
const text = fs.readFileSync(file, 'utf8');

let failed = false;

if (text.includes('AJLOJIK_DB_')) {
  console.error('❌ Seed authority still contains AJLOJIK_DB_* aliases.');
  failed = true;
}

if (!text.includes('SHELSEA_SEED_AUTHORITY_CLEANUP_V1')) {
  console.error('❌ Shelsea seed authority marker is missing.');
  failed = true;
}

if (!text.includes('process.env.DIRECT_URL') || !text.includes('process.env.DATABASE_URL')) {
  console.error('❌ Seed engine must use DIRECT_URL with DATABASE_URL fallback.');
  failed = true;
}

if (failed) process.exit(1);

console.log('✅ Shelsea seed database authority is clean.');
console.log('   seed: DIRECT_URL → DATABASE_URL fallback');
console.log('   AJ aliases: absent');
