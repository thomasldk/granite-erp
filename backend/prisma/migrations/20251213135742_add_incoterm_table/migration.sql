-- CreateTable
CREATE TABLE "Incoterm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "xmlCode" TEXT NOT NULL,
    "requiresText" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "exchangeRate" REAL DEFAULT 1.0,
    "incoterm" TEXT DEFAULT 'Ex Works',
    "incotermId" TEXT,
    "incotermCustomText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "projectId" TEXT NOT NULL,
    "thirdPartyId" TEXT NOT NULL,
    "contactId" TEXT,
    "materialId" TEXT,
    "dateIssued" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "estimatedWeeks" INTEGER,
    "excelFilePath" TEXT,
    "syncStatus" TEXT,
    "odooId" TEXT,
    "odooStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES "Incoterm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("contactId", "createdAt", "currency", "dateIssued", "estimatedWeeks", "excelFilePath", "exchangeRate", "id", "incoterm", "materialId", "odooId", "odooStatus", "projectId", "reference", "status", "syncStatus", "thirdPartyId", "totalAmount", "updatedAt", "validUntil", "version") SELECT "contactId", "createdAt", "currency", "dateIssued", "estimatedWeeks", "excelFilePath", "exchangeRate", "id", "incoterm", "materialId", "odooId", "odooStatus", "projectId", "reference", "status", "syncStatus", "thirdPartyId", "totalAmount", "updatedAt", "validUntil", "version" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");
CREATE TABLE "new_ThirdParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
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
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThirdParty_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ThirdParty_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES "Incoterm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ThirdParty" ("code", "createdAt", "creditLimit", "defaultCurrency", "depositPercentage", "email", "fax", "id", "incoterm", "internalNotes", "language", "mobile", "name", "paymentDays", "paymentTermId", "paymentTerms", "phone", "priceListDate", "priceListUrl", "repName", "supplierType", "taxScheme", "type", "unitSystem", "updatedAt", "website") SELECT "code", "createdAt", "creditLimit", "defaultCurrency", "depositPercentage", "email", "fax", "id", "incoterm", "internalNotes", "language", "mobile", "name", "paymentDays", "paymentTermId", "paymentTerms", "phone", "priceListDate", "priceListUrl", "repName", "supplierType", "taxScheme", "type", "unitSystem", "updatedAt", "website" FROM "ThirdParty";
DROP TABLE "ThirdParty";
ALTER TABLE "new_ThirdParty" RENAME TO "ThirdParty";
CREATE UNIQUE INDEX "ThirdParty_code_key" ON "ThirdParty"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
