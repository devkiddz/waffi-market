-- Bring the deployed database in line with the catalog vocabulary schema.
BEGIN;
-- CreateEnum
CREATE TYPE "CatalogAttributeValueMode" AS ENUM ('CONTROLLED', 'TEXT', 'NUMBER', 'BOOLEAN', 'MEASUREMENT');

-- CreateEnum
CREATE TYPE "VendorCategoryAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CatalogVocabularyRequestType" AS ENUM ('CATEGORY', 'SUBCATEGORY', 'BRAND', 'TAG', 'ATTRIBUTE', 'ATTRIBUTE_VALUE');

-- CreateEnum
CREATE TYPE "CatalogVocabularyRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MERGED');

-- AlterTable
ALTER TABLE "brand" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parentBrandId" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "marketId" TEXT,
ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "support_assignment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_case" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_escalation" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_feedback" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_note" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_resolution" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "support_sla" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "category_brand_eligibility" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_brand_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_tag" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_tag_eligibility" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_tag_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_attribute" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valueMode" "CatalogAttributeValueMode" NOT NULL DEFAULT 'CONTROLLED',
    "unitFamily" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_attribute_value" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "numericValue" DECIMAL(18,6),
    "unit" TEXT,
    "colorHex" TEXT,
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_attribute_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute_guide" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "variantAxis" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "customerVisible" BOOLEAN NOT NULL DEFAULT true,
    "vendorEditable" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomValue" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attribute_guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute_allowed_value" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attribute_allowed_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_category_access" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "status" "VendorCategoryAccessStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_category_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_vocabulary_request" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "requestType" "CatalogVocabularyRequestType" NOT NULL,
    "status" "CatalogVocabularyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedLabel" TEXT NOT NULL,
    "requestedDescription" TEXT,
    "reason" TEXT,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "context" JSONB,
    "reviewNote" TEXT,
    "resolvedEntityId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_vocabulary_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_brand_eligibility_workspaceId_categoryId_active_po_idx" ON "category_brand_eligibility"("workspaceId", "categoryId", "active", "position");

-- CreateIndex
CREATE INDEX "category_brand_eligibility_workspaceId_brandId_active_idx" ON "category_brand_eligibility"("workspaceId", "brandId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "category_brand_eligibility_categoryId_brandId_key" ON "category_brand_eligibility"("categoryId", "brandId");

-- CreateIndex
CREATE INDEX "catalog_tag_workspaceId_active_position_idx" ON "catalog_tag"("workspaceId", "active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_tag_workspaceId_slug_key" ON "catalog_tag"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_tag_id_workspaceId_key" ON "catalog_tag"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "category_tag_eligibility_workspaceId_categoryId_active_posi_idx" ON "category_tag_eligibility"("workspaceId", "categoryId", "active", "position");

-- CreateIndex
CREATE INDEX "category_tag_eligibility_workspaceId_tagId_active_idx" ON "category_tag_eligibility"("workspaceId", "tagId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "category_tag_eligibility_categoryId_tagId_key" ON "category_tag_eligibility"("categoryId", "tagId");

-- CreateIndex
CREATE INDEX "catalog_attribute_workspaceId_active_position_idx" ON "catalog_attribute"("workspaceId", "active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_attribute_workspaceId_slug_key" ON "catalog_attribute"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_attribute_id_workspaceId_key" ON "catalog_attribute"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "catalog_attribute_value_workspaceId_attributeId_active_posi_idx" ON "catalog_attribute_value"("workspaceId", "attributeId", "active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_attribute_value_attributeId_slug_key" ON "catalog_attribute_value"("attributeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_attribute_value_id_attributeId_workspaceId_key" ON "catalog_attribute_value"("id", "attributeId", "workspaceId");

-- CreateIndex
CREATE INDEX "category_attribute_guide_workspaceId_categoryId_position_idx" ON "category_attribute_guide"("workspaceId", "categoryId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_guide_categoryId_attributeId_key" ON "category_attribute_guide"("categoryId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_guide_categoryId_attributeId_workspaceId_key" ON "category_attribute_guide"("categoryId", "attributeId", "workspaceId");

-- CreateIndex
CREATE INDEX "category_attribute_allowed_value_workspaceId_categoryId_att_idx" ON "category_attribute_allowed_value"("workspaceId", "categoryId", "attributeId", "active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_allowed_value_categoryId_attributeValueI_key" ON "category_attribute_allowed_value"("categoryId", "attributeValueId");

-- CreateIndex
CREATE INDEX "vendor_category_access_workspaceId_vendorProfileId_status_idx" ON "vendor_category_access"("workspaceId", "vendorProfileId", "status");

-- CreateIndex
CREATE INDEX "vendor_category_access_workspaceId_categoryId_status_idx" ON "vendor_category_access"("workspaceId", "categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_category_access_vendorProfileId_categoryId_key" ON "vendor_category_access"("vendorProfileId", "categoryId");

-- CreateIndex
CREATE INDEX "catalog_vocabulary_request_workspaceId_vendorProfileId_stat_idx" ON "catalog_vocabulary_request"("workspaceId", "vendorProfileId", "status");

-- CreateIndex
CREATE INDEX "catalog_vocabulary_request_workspaceId_requestType_status_s_idx" ON "catalog_vocabulary_request"("workspaceId", "requestType", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "brand_workspaceId_active_position_idx" ON "brand"("workspaceId", "active", "position");

-- CreateIndex
CREATE INDEX "brand_parentBrandId_idx" ON "brand"("parentBrandId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_id_workspaceId_key" ON "brand"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "category_workspaceId_marketId_active_position_idx" ON "category"("workspaceId", "marketId", "active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "category_id_workspaceId_key" ON "category"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "category_id_marketId_workspaceId_key" ON "category"("id", "marketId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_market_assignment_vendorProfileId_marketId_workspace_key" ON "vendor_market_assignment"("vendorProfileId", "marketId", "workspaceId");

-- AddForeignKey
ALTER TABLE "category_brand_eligibility" ADD CONSTRAINT "category_brand_eligibility_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_brand_eligibility" ADD CONSTRAINT "category_brand_eligibility_categoryId_workspaceId_fkey" FOREIGN KEY ("categoryId", "workspaceId") REFERENCES "category"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_brand_eligibility" ADD CONSTRAINT "category_brand_eligibility_brandId_workspaceId_fkey" FOREIGN KEY ("brandId", "workspaceId") REFERENCES "brand"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_tag" ADD CONSTRAINT "catalog_tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_tag_eligibility" ADD CONSTRAINT "category_tag_eligibility_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_tag_eligibility" ADD CONSTRAINT "category_tag_eligibility_categoryId_workspaceId_fkey" FOREIGN KEY ("categoryId", "workspaceId") REFERENCES "category"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_tag_eligibility" ADD CONSTRAINT "category_tag_eligibility_tagId_workspaceId_fkey" FOREIGN KEY ("tagId", "workspaceId") REFERENCES "catalog_tag"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_attribute" ADD CONSTRAINT "catalog_attribute_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_attribute_value" ADD CONSTRAINT "catalog_attribute_value_attributeId_workspaceId_fkey" FOREIGN KEY ("attributeId", "workspaceId") REFERENCES "catalog_attribute"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_guide" ADD CONSTRAINT "category_attribute_guide_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_guide" ADD CONSTRAINT "category_attribute_guide_categoryId_workspaceId_fkey" FOREIGN KEY ("categoryId", "workspaceId") REFERENCES "category"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_guide" ADD CONSTRAINT "category_attribute_guide_attributeId_workspaceId_fkey" FOREIGN KEY ("attributeId", "workspaceId") REFERENCES "catalog_attribute"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_allowed_value" ADD CONSTRAINT "category_attribute_allowed_value_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_allowed_value" ADD CONSTRAINT "category_attribute_allowed_value_categoryId_attributeId_wo_fkey" FOREIGN KEY ("categoryId", "attributeId", "workspaceId") REFERENCES "category_attribute_guide"("categoryId", "attributeId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_allowed_value" ADD CONSTRAINT "category_attribute_allowed_value_attributeValueId_attribut_fkey" FOREIGN KEY ("attributeValueId", "attributeId", "workspaceId") REFERENCES "catalog_attribute_value"("id", "attributeId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_vendorProfileId_workspaceId_fkey" FOREIGN KEY ("vendorProfileId", "workspaceId") REFERENCES "vendor_profile"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_vendorProfileId_marketId_workspaceI_fkey" FOREIGN KEY ("vendorProfileId", "marketId", "workspaceId") REFERENCES "vendor_market_assignment"("vendorProfileId", "marketId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_categoryId_marketId_workspaceId_fkey" FOREIGN KEY ("categoryId", "marketId", "workspaceId") REFERENCES "category"("id", "marketId", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_access" ADD CONSTRAINT "vendor_category_access_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_vocabulary_request" ADD CONSTRAINT "catalog_vocabulary_request_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_vocabulary_request" ADD CONSTRAINT "catalog_vocabulary_request_vendorProfileId_workspaceId_fkey" FOREIGN KEY ("vendorProfileId", "workspaceId") REFERENCES "vendor_profile"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_vocabulary_request" ADD CONSTRAINT "catalog_vocabulary_request_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_vocabulary_request" ADD CONSTRAINT "catalog_vocabulary_request_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_marketId_workspaceId_fkey" FOREIGN KEY ("marketId", "workspaceId") REFERENCES "marketplace_market"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand" ADD CONSTRAINT "brand_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand" ADD CONSTRAINT "brand_parentBrandId_workspaceId_fkey" FOREIGN KEY ("parentBrandId", "workspaceId") REFERENCES "brand"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "communication_conversation_vendorProfileId_status_lastMessageAt" RENAME TO "communication_conversation_vendorProfileId_status_lastMessa_idx";

-- RenameIndex
ALTER INDEX "communication_participant_conversationId_vendorProfileId_role_k" RENAME TO "communication_participant_conversationId_vendorProfileId_ro_key";

-- RenameIndex
ALTER INDEX "intelligence_resolution_workspaceId_ownerUserId_audience_status" RENAME TO "intelligence_resolution_workspaceId_ownerUserId_audience_st_idx";

-- RenameIndex
ALTER INDEX "shopping_list_preparation_request_workspaceId_status_submittedA" RENAME TO "shopping_list_preparation_request_workspaceId_status_submit_idx";

-- RenameIndex
ALTER INDEX "support_knowledge_interaction_workspaceId_matchedIntent_created" RENAME TO "support_knowledge_interaction_workspaceId_matchedIntent_cre_idx";
COMMIT;
