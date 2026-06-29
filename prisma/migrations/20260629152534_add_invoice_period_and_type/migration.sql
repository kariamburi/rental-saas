/*
  Warnings:

  - Added the required column `periodKey` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceType" TEXT NOT NULL DEFAULT 'FULL',
ADD COLUMN     "periodKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Invoice_companyId_tenantId_unitId_periodKey_invoiceType_idx" ON "Invoice"("companyId", "tenantId", "unitId", "periodKey", "invoiceType");
