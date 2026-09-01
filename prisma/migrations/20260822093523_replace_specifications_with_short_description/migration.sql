-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shortDescription" TEXT;

-- Preserve existing ProductSpecification data as readable text before
-- the table is dropped below: one "label: value" line per row, in the
-- same order the admin originally arranged them (sortOrder), joined
-- into a single freeform block per product.
UPDATE "Product" p
SET "shortDescription" = agg.text
FROM (
  SELECT "productId", string_agg(label || ': ' || value, E'\n' ORDER BY "sortOrder") AS text
  FROM "ProductSpecification"
  GROUP BY "productId"
) agg
WHERE p.id = agg."productId";

-- DropForeignKey
ALTER TABLE "ProductSpecification" DROP CONSTRAINT "ProductSpecification_productId_fkey";

-- DropTable
DROP TABLE "ProductSpecification";
