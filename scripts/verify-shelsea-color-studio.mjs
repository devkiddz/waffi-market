import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['Prisma variant color authority', 'prisma/schema.prisma', ['model ProductVariant {', 'color    String?', 'colorHex String?']],
  ['Shared Product Studio color editor', 'features/admin/products/ProductStudioFields.tsx', ['SHELSEA_PRODUCT_STUDIO_COLOR_AUTHORITY_V1', 'Colour name (optional)', 'Colour code']],
  ['Admin product writes', 'features/admin/products/actions.ts', ['SHELSEA_ADMIN_PRODUCT_COLOR_AUTHORITY_V1', 'color: variant.color || null', 'colorHex: variant.colorHex || null']],
  ['Vendor product writes', 'features/vendor/products/actions.ts', ['SHELSEA_VENDOR_PRODUCT_COLOR_AUTHORITY_V1', 'color: variant.color || null', 'colorHex: variant.colorHex || null']],
  ['Admin edit projection', 'app/admin/products/[id]/page.tsx', ['SHELSEA_ADMIN_EDIT_VARIANT_COLOR_V1', 'color: true', "color: variant.color ?? ''"]],
  ['Vendor edit projection', 'app/vendor/products/[id]/page.tsx', ['SHELSEA_VENDOR_EDIT_VARIANT_COLOR_V1', "color:variant.color??''"]],
  ['Catalog color projection', 'features/catalog/mappers/map-database-product.ts', ['SHELSEA_CATALOG_VARIANT_COLOR_V1', 'color: variant.color', 'colorHex: variant.colorHex']],
  ['Store Studio projection route', 'app/api/store-studio/projection/route.ts', ['SHELSEA_STORE_STUDIO_PROJECTION_RESILIENCE_V1']],
  ['Store Studio client', 'features/store-studio/client/useStoreStudioProjection.ts', ['StoreStudioProjection']],
  ['Media Studio route', 'app/admin/media/page.tsx', []],
  ['Product Studio route', 'app/admin/products/page.tsx', []],
  ['Category Studio route', 'app/admin/categories/page.tsx', []],
  ['Brand Studio route', 'app/admin/brands/page.tsx', []],
  ['Collection Studio route', 'app/admin/collections/page.tsx', []],
  ['Promotion Studio route', 'app/admin/promotions/page.tsx', []],
  ['Store Studio route', 'app/admin/store-studio/page.tsx', []],
  ['Inventory management route', 'app/admin/inventory/page.tsx', ['SHELSEA_INVENTORY_VARIANT_COLOR_LABEL_V1']],
  ['Vendor Product Studio', 'features/vendor/products/VendorProductEditor.tsx', ['ProductStudioFields']],
  ['Vendor products route', 'app/vendor/products/page.tsx', []]
];

let failed = 0;

for (const [label, relative, signals] of checks) {
  const target = path.join(root, relative);

  if (!fs.existsSync(target)) {
    console.error(`✗ ${label}: missing ${relative}`);
    failed += 1;
    continue;
  }

  const source = fs.readFileSync(target, 'utf8');
  const missing = signals.filter(signal => !source.includes(signal));

  if (missing.length) {
    console.error(
      `✗ ${label}: missing signal(s): ${missing.join(', ')}`
    );
    failed += 1;
    continue;
  }

  console.log(`✓ ${label}`);
}

if (failed) {
  console.error('');
  console.error(`Shelsea Studio baseline verification failed: ${failed} check(s).`);
  process.exit(1);
}

console.log('');
console.log('✓ Shelsea Studio static baseline is complete.');
console.log('Runtime CRUD/browser validation is still required before freeze/tag.');
