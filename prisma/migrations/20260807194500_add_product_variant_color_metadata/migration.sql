-- Shelsea / RCENTZ product variant color authority.
-- Color remains optional because perfumes, capacities, pack sizes and
-- other products may only use the primary variant label.

ALTER TABLE "product_variant"
  ADD COLUMN "color" TEXT,
  ADD COLUMN "colorHex" TEXT;
