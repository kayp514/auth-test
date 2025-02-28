/*
  Warnings:

  - You are about to drop the column `active` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "active",
ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT false;
