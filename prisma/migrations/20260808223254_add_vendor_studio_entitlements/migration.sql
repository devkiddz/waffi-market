-- CreateEnum
CREATE TYPE "VendorStudioTier" AS ENUM ('BASIC', 'GROWTH', 'PREMIUM', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "vendor_studio_entitlement" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "tier" "VendorStudioTier" NOT NULL DEFAULT 'BASIC',
    "productLimit" INTEGER,
    "mediaAssetLimit" INTEGER,
    "collectionLimit" INTEGER,
    "promotionLimit" INTEGER,
    "bannerCampaignLimit" INTEGER,
    "storyCampaignLimit" INTEGER,
    "reelCampaignLimit" INTEGER,
    "storyAssetLimitPerCampaign" INTEGER,
    "reelAssetLimitPerCampaign" INTEGER,
    "teamMemberLimit" INTEGER,
    "videoAllowed" BOOLEAN NOT NULL DEFAULT false,
    "schedulingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "featuredPlacementEligible" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredPlacementEligible" BOOLEAN NOT NULL DEFAULT false,
    "configured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_studio_entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_studio_entitlement_vendorProfileId_key"
ON "vendor_studio_entitlement"("vendorProfileId");

-- CreateIndex
CREATE INDEX "vendor_studio_entitlement_tier_active_idx"
ON "vendor_studio_entitlement"("tier", "active");

-- AddForeignKey
ALTER TABLE "vendor_studio_entitlement"
ADD CONSTRAINT "vendor_studio_entitlement_vendorProfileId_fkey"
FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
