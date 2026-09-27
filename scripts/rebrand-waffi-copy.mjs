/** Replace platform-facing Shelsea copy while retaining the Shelsea vendor and its data. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'app/layout.tsx', 'app/manifest.ts',
  'providers/SidebarHeaderContent.tsx', 'providers/AppSideBar.tsx',
  'providers/IdentityProvider.tsx',
  'app/(store)/collections/[slug]/page.tsx', 'app/(store)/collections/page.tsx',
  'app/(store)/membership/page.tsx', 'app/(store)/products/[id]/not-found.tsx',
  'app/(store)/products/[id]/page.tsx', 'app/(store)/promos/page.tsx',
  'app/(store)/reels/[reelId]/page.tsx', 'app/(store)/rewards/page.tsx',
  'app/(store)/settings/page.tsx',
  'components/discovery-hub-panel/MobileDiscoverySheet.tsx',
  'components/discovery-hub-panel/components/HubSlider.tsx',
  'components/discovery-hub-panel/page.tsx',
  'components/discovery-hub-panel/runtime/useCustomerCommerceRuntime.ts',
  'components/discovery-hub-panel/widgets/AIIntelligenceWidget.tsx',
  'components/discovery-hub-panel/widgets/CatalogRuntimeWidgets.tsx',
  'components/discovery-hub-panel/widgets/FoundationStatusWidgets.tsx',
  'components/discovery-hub-panel/widgets/HubWishlistWidget.tsx',
  'components/discovery-hub-panel/widgets/RecentlyViewedWidget.tsx',
  'components/discovery-hub-panel/widgets/ShoppingListsWidget.tsx',
  'features/action-feedback/ActionFeedbackProvider.tsx',
  'features/action-feedback/ActionFeedbackViewport.tsx',
  'features/action-feedback/AuthenticationGateDialog.tsx',
  'features/action-feedback/StoreExperienceOnboarding.tsx',
  'features/feed-experience/layout/FeedExperienceWorkspace.tsx',
  'features/feed-experience/layout/StoreGridDestination.tsx',
  'features/feed-experience/providers/FeedExperienceLoader.tsx',
  'features/feed-experience/providers/FeedExperienceProvider.tsx',
  'features/feed-experience/renderers/FeedRenderer.tsx',
  'features/feed-experience/selectors/selectDiscoveryHubWidgets.ts',
  'features/feed-experience/modules/category-product-experience/CategoryProductExperienceSection.tsx',
  'features/feed-experience/modules/product-details/ProductDetailsModule.tsx',
  'features/feed-experience/builders/buildProductExperience.ts',
  'features/feed-experience/builders/buildStoreDiscoveryExperience.ts'
];
let changed = 0;
for (const relative of files) {
  const path = join(root, relative);
  const before = readFileSync(path, 'utf8');
  let after = before.replaceAll('Shelsea', 'Waffi');
  if (relative === 'app/layout.tsx') {
    after = after.replace('Waffi — Fashion, Beauty & Lifestyle', 'Waffi Market — Discover Products and Vendors');
    after = after.replace('Discover clothing, accessories, hair, fragrances and curated style at Waffi.', 'Discover products and independent vendors on Waffi Market.');
  }
  if (after !== before) {
    writeFileSync(path, after);
    console.log(relative);
    changed++;
  }
}
const dataPath = join(root, 'data/discoveryHubData.ts');
const beforeData = readFileSync(dataPath, 'utf8');
let afterData = beforeData;
for (const [from, to] of [
  ['Your Shelsea order', 'Your Waffi order'],
  ['Your latest Shelsea order activity', 'Your latest Waffi order activity'],
  ['Ask Shelsea AI', 'Ask Waffi AI']
]) afterData = afterData.replaceAll(from, to);
if (afterData !== beforeData) { writeFileSync(dataPath, afterData); console.log('data/discoveryHubData.ts'); changed++; }
console.log(`Updated ${changed} files. Shelsea vendor records, slugs, and seeded product descriptions are untouched.`);
