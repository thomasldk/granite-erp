-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Stone',
    "type" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPrice" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'sqft',
    "density" DOUBLE PRECISION,
    "wasteFactor" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "densityUnit" TEXT NOT NULL DEFAULT 'lb/ft3',
    "quality" TEXT NOT NULL DEFAULT 'S',
    "syncStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "validityDuration" INTEGER,
    "sellingUnit" TEXT NOT NULL DEFAULT 'sqft',
    "imageUrl" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdParty" (
    "id" TEXT NOT NULL,
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
    "depositPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountDays" INTEGER NOT NULL DEFAULT 0,
    "paymentCustomText" TEXT,
    "supplierType" TEXT,
    "taxScheme" TEXT,
    "creditLimit" DOUBLE PRECISION,
    "repName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "unitSystem" TEXT NOT NULL DEFAULT 'Imperial',
    "incoterm" TEXT,
    "incotermId" TEXT,
    "incotermCustomText" TEXT,
    "priceListUrl" TEXT,
    "priceListDate" TEXT,
    "semiStandardRate" DOUBLE PRECISION,
    "salesCurrency" TEXT,
    "palletPrice" DOUBLE PRECISION,
    "palletRequired" BOOLEAN,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exchangeRate" DOUBLE PRECISION,
    "validityDuration" INTEGER,

    CONSTRAINT "ThirdParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTerm" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_fr" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "depositPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountDays" INTEGER NOT NULL DEFAULT 0,
    "requiresText" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "role" TEXT,
    "thirdPartyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL,
    "thirdPartyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "thirdPartyId" TEXT,
    "locationId" TEXT,
    "measureSystem" TEXT NOT NULL DEFAULT 'Imperial',
    "estimatedWeeks" INTEGER,
    "numberOfLines" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "exchangeRate" DOUBLE PRECISION DEFAULT 1.0,
    "incoterm" TEXT DEFAULT 'Ex Works',
    "incotermId" TEXT,
    "incotermCustomText" TEXT,
    "semiStandardRate" DOUBLE PRECISION,
    "salesCurrency" TEXT,
    "palletPrice" DOUBLE PRECISION,
    "palletRequired" BOOLEAN,
    "paymentTermId" TEXT,
    "paymentDays" INTEGER,
    "depositPercentage" DOUBLE PRECISION,
    "discountPercentage" DOUBLE PRECISION,
    "paymentCustomText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "projectId" TEXT NOT NULL,
    "thirdPartyId" TEXT NOT NULL,
    "contactId" TEXT,
    "materialId" TEXT,
    "dateIssued" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedWeeks" INTEGER,
    "excelFilePath" TEXT,
    "syncStatus" TEXT,
    "odooId" TEXT,
    "odooStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discountDays" INTEGER,
    "validityDuration" INTEGER,
    "representativeId" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "tag" TEXT,
    "lineNo" TEXT,
    "refReference" TEXT,
    "product" TEXT,
    "description" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "finish" TEXT,
    "unit" TEXT,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "thickness" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "numHoles" INTEGER NOT NULL DEFAULT 0,
    "numSlots" INTEGER NOT NULL DEFAULT 0,
    "netLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPriceInternal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPriceInternal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPriceCad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPriceCad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stoneValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "primarySawingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "secondarySawingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profilingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finishingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anchoringCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productionStatus" TEXT NOT NULL DEFAULT 'Pending',
    "productionSiteId" TEXT,
    "productionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Client',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incoterm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xmlCode" TEXT NOT NULL,
    "requiresText" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incoterm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'GLOBAL',
    "defaultSemiStandardRate" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "defaultSalesCurrency" TEXT NOT NULL DEFAULT 'CAD',
    "defaultPalletPrice" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "defaultPalletRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultPaymentDays" INTEGER NOT NULL DEFAULT 30,
    "defaultDepositPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultDiscountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultDiscountDays" INTEGER NOT NULL DEFAULT 10,
    "defaultExchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defaultPaymentTermId" TEXT,
    "taxRateTPS" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "taxRateTVQ" DOUBLE PRECISION NOT NULL DEFAULT 9.975,
    "taxRateTVH" DOUBLE PRECISION NOT NULL DEFAULT 13.0,
    "taxRateTVH_Maritimes" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "defaultMeasureUnit" TEXT NOT NULL DEFAULT 'an',
    "defaultValidityDuration" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThirdParty_code_key" ON "ThirdParty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTerm_code_key" ON "PaymentTerm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLocation_name_key" ON "ProjectLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Project_reference_key" ON "Project"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ContactType_name_category_key" ON "ContactType"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionSite_name_key" ON "ProductionSite"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceSite_name_key" ON "MaintenanceSite"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES "Incoterm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ProjectLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_incotermId_fkey" FOREIGN KEY ("incotermId") REFERENCES "Incoterm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productionSiteId_fkey" FOREIGN KEY ("productionSiteId") REFERENCES "ProductionSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
