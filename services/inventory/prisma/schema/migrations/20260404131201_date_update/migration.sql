/*
  Warnings:

  - Added the required column `updateAt` to the `history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "history" DROP CONSTRAINT "history_inventoryId_fkey";

-- AlterTable
ALTER TABLE "history" ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
