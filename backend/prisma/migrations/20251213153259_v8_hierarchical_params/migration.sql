/*
  Warnings:

  - You are about to drop the column `mobile` on the `ThirdParty` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "palletPrice" REAL;
ALTER TABLE "Quote" ADD COLUMN "palletRequired" BOOLEAN;
ALTER TABLE "Quote" ADD COLUMN "salesCurrency" TEXT;
ALTER TABLE "Quote" ADD COLUMN "semiStandardRate" REAL;

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL DEFAULT 'GLOBAL',
    "defaultSemiStandardRate" REAL NOT NULL DEFAULT 0.4,
    "defaultSalesCurrency" TEXT NOT NULL DEFAULT 'CAD',
    "defaultPalletPrice" REAL NOT NULL DEFAULT 50.0,
    "defaultPalletRequired" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ThirdParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'CAD',
    "paymentTerms" TEXT,
    "paymentTermId" TEXT,
    "paymentDays" INTEGER NOT NULL DEFAULT 0,
    "depositPercentage" REAL NOT NULL DEFAULT 0,
    "supplierType" TEXT,
    "taxScheme" TEXT,
    "creditLimit" REAL,
    "repName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "unitSystem" TEXT NOT NULL DEFAULT 'Imperial',
    "incoterm" TEXT,
    "incotermId" TEXT,
    "incotermCustomText" TEXT,
    "priceListUrl" TEXT,
    "priceListDate" TEXT,
    "semiStandardRate" REAL,
    "salesCurrency" TEXT,
    "palletPrice" REAL,
    "palletRequired" BOOLEAN,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThirdParty_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ThirdParty_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES "Incoterm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ThirdParty" ("code", "createdAt", "creditLimit", "defaultCurrency", "depositPercentage", "email", "fax", "id", "incoterm", "incotermCustomText", "incotermId", "internalNotes", "language", "name", "paymentDays", "paymentTermId", "paymentTerms", "phone", "priceListDate", "priceListUrl", "repName", "supplierType", "taxScheme", "type", "unitSystem", "updatedAt", "website") SELECT "code", "createdAt", "creditLimit", "defaultCurrency", "depositPercentage", "email", "fax", "id", "incoterm", "incotermCustomText", "incotermId", "internalNotes", "language", "name", "paymentDays", "paymentTermId", "paymentTerms", "phone", "priceListDate", "priceListUrl", "repName", "supplierType", "taxScheme", "type", "unitSystem", "updatedAt", "website" FROM "ThirdParty";
DROP TABLE "ThirdParty";
ALTER TABLE "new_ThirdParty" RENAME TO "ThirdParty";
CREATE UNIQUE INDEX "ThirdParty_code_key" ON "ThirdParty"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
