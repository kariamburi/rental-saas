"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export async function deleteCompanyWithData(companyId: string) {
    const user = await getAuthUser();

    if (!user) redirect("/login");
    if (user.role !== Roles.SUPER_ADMIN) {
        throw new Error("Only SUPER_ADMIN can delete companies.");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
            properties: true,
        },
    });

    if (!company) {
        throw new Error("Company not found.");
    }

    const propertyIds = company.properties.map((property) => property.id);

    await prisma.$transaction(async (tx) => {
        const inspections = await tx.propertyInspection.findMany({
            where: { companyId },
            select: { id: true },
        });

        const inspectionIds = inspections.map((inspection) => inspection.id);

        await tx.propertyInspectionItem.deleteMany({
            where: {
                inspectionId: { in: inspectionIds },
            },
        });

        await tx.payment.deleteMany({
            where: { companyId },
        });

        await tx.invoiceItem.deleteMany({
            where: {
                invoice: {
                    companyId,
                },
            },
        });

        await tx.invoice.deleteMany({
            where: { companyId },
        });

        await tx.meterReading.deleteMany({
            where: { companyId },
        });

        await tx.maintenanceRequest.deleteMany({
            where: { companyId },
        });

        await tx.propertyInspection.deleteMany({
            where: { companyId },
        });

        await tx.unitBooking.deleteMany({
            where: { companyId },
        });

        await tx.lease.deleteMany({
            where: { companyId },
        });

        await tx.tenant.deleteMany({
            where: { companyId },
        });

        await tx.expense.deleteMany({
            where: { companyId },
        });

        await tx.ownerPayout.deleteMany({
            where: { companyId },
        });

        await tx.propertyOwnership.deleteMany({
            where: { companyId },
        });

        await tx.owner.deleteMany({
            where: { companyId },
        });

        await tx.unit.deleteMany({
            where: { companyId },
        });

        await tx.property.deleteMany({
            where: {
                id: { in: propertyIds },
            },
        });

        await tx.superAdminCompanyContext.deleteMany({
            where: { companyId },
        });

        await tx.user.deleteMany({
            where: {
                companyId,
            },
        });

        await tx.company.delete({
            where: { id: companyId },
        });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/companies");
    redirect("/dashboard/companies");
}