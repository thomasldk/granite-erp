-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "fax" TEXT,
ADD COLUMN     "mobile" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "estimatedWeeks" INTEGER,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "measureSystem" TEXT NOT NULL DEFAULT 'Imperial',
ADD COLUMN     "numberOfLines" INTEGER;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "estimatedWeeks" INTEGER,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN     "incoterm" TEXT DEFAULT 'Ex Works',
ADD COLUMN     "materialId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "productionNotes" TEXT,
ADD COLUMN     "productionSiteId" TEXT,
ADD COLUMN     "productionStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "tag" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "Representative" ADD COLUMN     "fax" TEXT,
ADD COLUMN     "mobile" TEXT;

-- AlterTable
ALTER TABLE "ThirdParty" ADD COLUMN     "depositPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "incoterm" TEXT,
ADD COLUMN     "paymentDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentTermId" TEXT,
ADD COLUMN     "priceListDate" TEXT,
ADD COLUMN     "priceListUrl" TEXT,
ADD COLUMN     "supplierType" TEXT,
ADD COLUMN     "unitSystem" TEXT NOT NULL DEFAULT 'Imperial';

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
    "sellingUnit" TEXT NOT NULL DEFAULT 'sqft',
    "imageUrl" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTerm" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_fr" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "depositPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTerm_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ProductionSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTerm_code_key" ON "PaymentTerm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLocation_name_key" ON "ProjectLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionSite_name_key" ON "ProductionSite"("name");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ProjectLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productionSiteId_fkey" FOREIGN KEY ("productionSiteId") REFERENCES "ProductionSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
