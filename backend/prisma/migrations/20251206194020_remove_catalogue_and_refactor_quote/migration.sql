/*
  Warnings:

  - You are about to drop the column `finishId` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `qualityId` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `stoneColorId` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the `Finish` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductRange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoneColor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoneType` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `material` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_finishId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_qualityId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_stoneColorId_fkey";

-- DropForeignKey
ALTER TABLE "StoneColor" DROP CONSTRAINT "StoneColor_stoneTypeId_fkey";

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "excelFilePath" TEXT,
ADD COLUMN     "syncStatus" TEXT;

-- AlterTable
ALTER TABLE "QuoteItem" DROP COLUMN "finishId",
DROP COLUMN "qualityId",
DROP COLUMN "stoneColorId",
DROP COLUMN "unit",
ADD COLUMN     "finish" TEXT,
ADD COLUMN     "material" TEXT NOT NULL,
ADD COLUMN     "numHoles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "numSlots" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "unitPrice" SET DEFAULT 0,
ALTER COLUMN "totalPrice" SET DEFAULT 0;

-- DropTable
DROP TABLE "Finish";

-- DropTable
DROP TABLE "ProductRange";

-- DropTable
DROP TABLE "Quality";

-- DropTable
DROP TABLE "StoneColor";

-- DropTable
DROP TABLE "StoneType";
