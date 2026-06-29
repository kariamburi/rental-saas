-- CreateTable
CREATE TABLE "SuperAdminCompanyContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdminCompanyContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminCompanyContext_userId_key" ON "SuperAdminCompanyContext"("userId");

-- CreateIndex
CREATE INDEX "SuperAdminCompanyContext_companyId_idx" ON "SuperAdminCompanyContext"("companyId");

-- AddForeignKey
ALTER TABLE "SuperAdminCompanyContext" ADD CONSTRAINT "SuperAdminCompanyContext_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
