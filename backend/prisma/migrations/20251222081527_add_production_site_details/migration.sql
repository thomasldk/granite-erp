-- AlterTable
ALTER TABLE "ProductionSite" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Canada',
ADD COLUMN     "managerEmail" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "managerPhone" TEXT,
ADD COLUMN     "province" TEXT DEFAULT 'QC',
ADD COLUMN     "zipCode" TEXT;
