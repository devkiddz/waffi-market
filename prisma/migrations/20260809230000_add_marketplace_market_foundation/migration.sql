-- M03.1A - Marketplace Market foundation
-- Additive only: this migration does not mutate existing categories, products, brands or vendor ownership.

CREATE TABLE "marketplace_market" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iconName" TEXT,
    "image" TEXT,
    "coverImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shortDescription" TEXT,
    "description" TEXT,
    "accentColor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_market_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_market_assignment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_market_assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketplace_market_workspaceId_slug_key"
ON "marketplace_market"("workspaceId", "slug");

CREATE UNIQUE INDEX "marketplace_market_id_workspaceId_key"
ON "marketplace_market"("id", "workspaceId");

CREATE INDEX "marketplace_market_workspaceId_active_position_idx"
ON "marketplace_market"("workspaceId", "active", "position");

CREATE UNIQUE INDEX "vendor_profile_id_workspaceId_key"
ON "vendor_profile"("id", "workspaceId");

CREATE UNIQUE INDEX "vendor_market_assignment_vendorProfileId_marketId_key"
ON "vendor_market_assignment"("vendorProfileId", "marketId");

CREATE INDEX "vendor_market_assignment_workspaceId_active_idx"
ON "vendor_market_assignment"("workspaceId", "active");

CREATE INDEX "vendor_market_assignment_marketId_active_idx"
ON "vendor_market_assignment"("marketId", "active");

CREATE INDEX "vendor_market_assignment_vendorProfileId_active_idx"
ON "vendor_market_assignment"("vendorProfileId", "active");

ALTER TABLE "marketplace_market"
ADD CONSTRAINT "marketplace_market_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_market_assignment"
ADD CONSTRAINT "vendor_market_assignment_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_market_assignment"
ADD CONSTRAINT "vendor_market_assignment_vendorProfileId_workspaceId_fkey"
FOREIGN KEY ("vendorProfileId", "workspaceId") REFERENCES "vendor_profile"("id", "workspaceId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_market_assignment"
ADD CONSTRAINT "vendor_market_assignment_marketId_workspaceId_fkey"
FOREIGN KEY ("marketId", "workspaceId") REFERENCES "marketplace_market"("id", "workspaceId")
ON DELETE CASCADE ON UPDATE CASCADE;
