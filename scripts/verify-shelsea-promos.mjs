import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  [
    '/promos is a grid destination',
    'app/(store)/promos/page.tsx',
    [
      'SHELSEA_PROMOS_GRID_DESTINATION_V1',
      'data-promo-destination-grid',
      '2xl:grid-cols-4'
    ],
    [
      'overflow-x-auto',
      'snap-mandatory'
    ]
  ],
  [
    'campaign products are a grid',
    'features/promotion/PromoCampaignExperience.tsx',
    [
      'SHELSEA_PROMO_CAMPAIGN_GRID_V1',
      'data-promo-product-grid',
      'ProductCard'
    ],
    [
      'CollectionProductRail'
    ]
  ],
  [
    'promo modal uses mature ProductCard grid',
    'components/promos/PromoModal.tsx',
    [
      'SHELSEA_PROMO_MODAL_PRODUCT_GRID_V1',
      'data-promo-modal-product-grid',
      'ProductCard'
    ],
    [
      'PromoProductCard'
    ]
  ],
  [
    'Hub visibility hook exists',
    'features/promotion/useDiscoveryHubOpen.ts',
    [
      'SHELSEA_PROMO_HUB_VISIBILITY_V1',
      'data-discovery-hub-panel'
    ],
    []
  ],
  [
    'Store teaser promo rail remains available',
    'components/promos/PromoSection.tsx',
    [
      'overflow-x-auto'
    ],
    []
  ]
];

let failed = 0;

for (
  const [
    label,
    relative,
    required,
    forbidden
  ] of checks
) {
  const target =
    path.join(
      root,
      relative
    );

  if (
    !fs.existsSync(
      target
    )
  ) {
    console.error(
      `✗ ${label}: missing ${relative}`
    );

    failed += 1;
    continue;
  }

  const source =
    fs.readFileSync(
      target,
      'utf8'
    );

  const missing =
    required.filter(
      signal =>
        !source.includes(
          signal
        )
    );

  const presentForbidden =
    forbidden.filter(
      signal =>
        source.includes(
          signal
        )
    );

  if (
    missing.length ||
    presentForbidden.length
  ) {
    console.error(
      `✗ ${label}`
    );

    if (
      missing.length
    ) {
      console.error(
        `  missing: ${missing.join(', ')}`
      );
    }

    if (
      presentForbidden.length
    ) {
      console.error(
        `  forbidden: ${presentForbidden.join(', ')}`
      );
    }

    failed += 1;
    continue;
  }

  console.log(
    `✓ ${label}`
  );
}

if (failed) {
  console.error('');
  console.error(
    `Shelsea promo verification failed: ${failed} check(s).`
  );
  process.exit(1);
}

console.log('');
console.log(
  '✓ Shelsea Promo Experience static closure passed.'
);
console.log(
  'Browser validation is still required before launch freeze.'
);
