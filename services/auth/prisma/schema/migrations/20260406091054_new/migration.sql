/*
  Warnings:

  - You are about to drop the column `verifiedt` on the `verificationCode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "verificationCode" DROP COLUMN "verifiedt",
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
