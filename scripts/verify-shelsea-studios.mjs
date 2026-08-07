import fs from 'node:fs';
import path from 'node:path';

const root =
  process.cwd();

const checks = [];

function check(
  name,
  condition,
  detail
) {
  checks.push({
    name,
    pass:
      Boolean(
        condition
      ),
    detail
  });
}

function read(
  relative
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
    return '';
  }

  return fs.readFileSync(
    target,
    'utf8'
  );
}

const builder =
  read(
    'features/feed-experience/builders/buildStoreDiscoveryExperience.ts'
  );

const registry =
  read(
    'features/feed-experience/renderers/feedModuleRegistry.ts'
  );

const reelsModule =
  read(
    'features/feed-experience/modules/StoreReelsModule.tsx'
  );

const storiesModule =
  read(
    'features/feed-experience/modules/CommerceStoriesModule.tsx'
  );

const bannerModule =
  read(
    'features/feed-experience/modules/StoreBannerModule.tsx'
  );

const showcaseModule =
  read(
    'features/feed-experience/modules/StoreShowcaseModule.tsx'
  );

const listingPage =
  read(
    'features/store-listings/StoreListingPage.tsx'
  );

const logo =
  read(
    'components/shared/LogoComponent.tsx'
  );

check(
  'Store Studio builder',
  builder.length > 0,
  'buildStoreDiscoveryExperience.ts exists'
);

check(
  'Banner resolution',
  builder.includes(
    'activeStoreBannerSlides'
  ),
  'active Store banner resolution is present'
);

check(
  'Stories resolution',
  builder.includes(
    'activeCommerceStories'
  ),
  'active Commerce Stories resolution is present'
);

check(
  'Reels resolution',
  builder.includes(
    'activeStoreReels'
  ),
  'active Store Reels resolution is present'
);

check(
  'Independent Studio fallback',
  builder.includes(
    'SHELSEA_STORE_STUDIO_INDEPENDENT_FALLBACK_V1'
  ),
  'Banner, Stories and Reels can each fall back independently'
);

check(
  'Store Showcase renderer',
  registry.includes(
    "'store-showcase'"
  ) &&
  showcaseModule.includes(
    'StoreBanner'
  ) &&
  showcaseModule.includes(
    'CommerceStoryRail'
  ),
  'showcase is registered and renders banner/stories'
);

check(
  'Store Banner renderer',
  registry.includes(
    "'store-banner'"
  ) &&
  bannerModule.includes(
    'StoreBanner'
  ),
  'banner module is registered and has renderer'
);

check(
  'Commerce Stories renderer',
  registry.includes(
    "'commerce-stories'"
  ) &&
  storiesModule.includes(
    'CommerceStoryRail'
  ),
  'Stories module is registered and has rail renderer'
);

check(
  'Store Reels renderer',
  registry.includes(
    "'store-reels'"
  ) &&
  reelsModule.includes(
    'StoreReelsRail'
  ),
  'Reels module is registered and has rail renderer'
);

check(
  'Grid category hero',
  listingPage.includes(
    'SHELSEA_GRID_CATEGORY_COVER_HERO_FINAL_V1'
  ) &&
  listingPage.includes(
    'coverImages'
  ) &&
  listingPage.includes(
    'heroImage'
  ),
  'full listing pages use category cover photography'
);

check(
  'Logo component syntax repair marker',
  logo.includes(
    'SHELSEA_LOGO_SYNTAX_FIX_V1'
  ),
  'logo hover block was repaired by final closure patch'
);

const studioFiles = [
  'features/store-studio/data/storeBannerFallback.ts',
  'features/store-studio/data/storeReelFallback.ts',
  'features/commerce-stories/data/commerceStories.ts',
  'features/feed-experience/builders/buildStoreDiscoveryExperience.ts'
];

const visibleResidues = [];

for (
  const relative of
    studioFiles
) {
  const source =
    read(
      relative
    );

  const patterns = [
    'AJ Logik Store',
    "vendorName: 'AJ Logik'",
    'Featured across AJ Logik',
    'across the AJ Logik experience',
    'SHELSEA COMMERCE'
  ];

  for (
    const pattern of
      patterns
  ) {
    if (
      source.includes(
        pattern
      )
    ) {
      visibleResidues.push(
        `${relative}: ${pattern}`
      );
    }
  }
}

check(
  'Studio visible-brand residue',
  visibleResidues.length ===
    0,
  visibleResidues.length
    ? visibleResidues.join(
        ' | '
      )
    : 'no known customer-facing AJ/Shelsea Commerce Studio residue'
);

console.log('');
console.log(
  '# Shelsea Store Studio verification'
);
console.log('');

for (
  const item of checks
) {
  console.log(
    `${item.pass ? 'PASS' : 'FAIL'}  ${item.name}`
  );

  console.log(
    `      ${item.detail}`
  );
}

const failed =
  checks.filter(
    item =>
      !item.pass
  );

console.log('');

if (
  failed.length ===
  0
) {
  console.log(
    'SOURCE SCAN GREEN: Store Showcase, Banner, Stories, Reels and listing-hero wiring are present.'
  );
  console.log(
    'Final runtime confirmation still requires npm run typecheck + npm run build + browser smoke test.'
  );
  process.exit(0);
}

console.error(
  `${failed.length} source verification check(s) failed.`
);

process.exit(1);
