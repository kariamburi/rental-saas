-- AddForeignKey
ALTER TABLE "SuperAdminCompanyContext" ADD CONSTRAINT "SuperAdminCompanyContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
