-- AlterTable
ALTER TABLE "ThirdParty" ADD COLUMN     "customsBrokerId" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_customsBrokerId_fkey" FOREIGN KEY ("customsBrokerId") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
