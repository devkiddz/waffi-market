-- Waffi Market M02 rollout hardening
-- 1) Ensure Waffi workspaces never inherit another RCENTZ product's media root.
UPDATE "workspace"
SET
  "mediaFolderPrefix" = 'waffi-market',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "slug" IN ('waffi-market-live', 'waffi-market-demo', 'waffi-market-practice')
  AND (
    "mediaFolderPrefix" IS NULL
    OR "mediaFolderPrefix" IN ('aj-logik', 'shelsea')
  );

-- 2) Backfill a complete, configured Studio entitlement for every vendor that
-- already exists when this migration is deployed.
--
-- Known Waffi seed vendors receive their intended M02 tier matrix.
-- Any other pre-existing vendor receives the explicit BASIC matrix rather than
-- being locked out or inheriting null/unlimited limits.
INSERT INTO "vendor_studio_entitlement" (
  "id",
  "vendorProfileId",
  "tier",
  "productLimit",
  "mediaAssetLimit",
  "collectionLimit",
  "promotionLimit",
  "bannerCampaignLimit",
  "storyCampaignLimit",
  "reelCampaignLimit",
  "storyAssetLimitPerCampaign",
  "reelAssetLimitPerCampaign",
  "teamMemberLimit",
  "videoAllowed",
  "schedulingAllowed",
  "featuredPlacementEligible",
  "sponsoredPlacementEligible",
  "configured",
  "active",
  "createdAt",
  "updatedAt"
)
SELECT
  'vendor-studio-entitlement-' || vendor."id",
  vendor."id",
  (
    CASE
      WHEN vendor."slug" = 'aj-logik' THEN 'ENTERPRISE'
      WHEN vendor."slug" IN ('shelsea', 'kora-fashion', 'metro-mobile') THEN 'PREMIUM'
      WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 'GROWTH'
      ELSE 'BASIC'
    END
  )::"VendorStudioTier",
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 500
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 300
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 150
    ELSE 75
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 1200
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 700
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 300
    ELSE 150
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 40
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 30
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 15
    ELSE 8
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 40
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 30
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 15
    ELSE 8
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 12
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 10
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 4
    ELSE 2
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 35
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 30
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 12
    ELSE 6
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 25
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 20
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 6
    ELSE 0
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 15
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 12
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 8
    ELSE 6
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 15
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 12
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 6
    ELSE 0
  END,
  CASE
    WHEN vendor."slug" = 'aj-logik' THEN NULL
    WHEN vendor."slug" = 'shelsea' THEN 10
    WHEN vendor."slug" IN ('kora-fashion', 'metro-mobile') THEN 8
    WHEN vendor."slug" IN ('nova-gadgets', 'freshcart-market') THEN 4
    ELSE 2
  END,
  vendor."slug" IN (
    'aj-logik',
    'shelsea',
    'kora-fashion',
    'metro-mobile',
    'nova-gadgets',
    'freshcart-market'
  ),
  vendor."slug" IN ('aj-logik', 'shelsea', 'kora-fashion', 'metro-mobile'),
  vendor."slug" IN ('aj-logik', 'shelsea', 'kora-fashion', 'metro-mobile'),
  vendor."slug" IN ('aj-logik', 'shelsea'),
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "vendor_profile" AS vendor
ON CONFLICT ("vendorProfileId") DO UPDATE
SET
  "tier" = EXCLUDED."tier",
  "productLimit" = EXCLUDED."productLimit",
  "mediaAssetLimit" = EXCLUDED."mediaAssetLimit",
  "collectionLimit" = EXCLUDED."collectionLimit",
  "promotionLimit" = EXCLUDED."promotionLimit",
  "bannerCampaignLimit" = EXCLUDED."bannerCampaignLimit",
  "storyCampaignLimit" = EXCLUDED."storyCampaignLimit",
  "reelCampaignLimit" = EXCLUDED."reelCampaignLimit",
  "storyAssetLimitPerCampaign" = EXCLUDED."storyAssetLimitPerCampaign",
  "reelAssetLimitPerCampaign" = EXCLUDED."reelAssetLimitPerCampaign",
  "teamMemberLimit" = EXCLUDED."teamMemberLimit",
  "videoAllowed" = EXCLUDED."videoAllowed",
  "schedulingAllowed" = EXCLUDED."schedulingAllowed",
  "featuredPlacementEligible" = EXCLUDED."featuredPlacementEligible",
  "sponsoredPlacementEligible" = EXCLUDED."sponsoredPlacementEligible",
  "configured" = true,
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "vendor_studio_entitlement"."configured" = false;
