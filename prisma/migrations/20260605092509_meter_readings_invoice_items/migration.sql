-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "garbageCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "securityCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "serviceCharge" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "previousReading" DECIMAL(12,2) NOT NULL,
    "currentReading" DECIMAL(12,2) NOT NULL,
    "unitsUsed" DECIMAL(12,2) NOT NULL,
    "ratePerUnit" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
