/*
  Warnings:

  - The `status` column on the `product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNLISTED');

-- AlterTable
ALTER TABLE "product" DROP COLUMN "status",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "Status";
