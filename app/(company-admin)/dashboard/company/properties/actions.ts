"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveCompany } from "@/lib/get-active-company";

export async function deletePropertyWithData(propertyId: string) {
    const { companyId, isSuperAdmin } = await getActiveCompany();

    if (!isSuperAdmin) {
        throw new Error("Only SUPER_ADMIN can delete property data.");
    }

    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            companyId,
        },
        include: {
            units: true,
        },
    });

    if (!property) {
        throw new Error("Property not found.");
    }

    const unitIds = property.units.map((unit) => unit.id);

    await prisma.$transaction(async (tx) => {
        const invoices = await tx.invoice.findMany({
            where: {
                companyId,
                unitId: { in: unitIds },
            },
            select: { id: true },
        });

        const invoiceIds = invoices.map((invoice) => invoice.id);

        await tx.payment.deleteMany({
            where: {
                companyId,
                invoiceId: { in: invoiceIds },
            },
        });

        await tx.invoiceItem.deleteMany({
            where: {
                invoiceId: { in: invoiceIds },
            },
        });

        await tx.invoice.deleteMany({
            where: {
                companyId,
                id: { in: invoiceIds },
            },
        });

        await tx.meterReading.deleteMany({
            where: {
                companyId,
                unitId: { in: unitIds },
            },
        });

        await tx.maintenanceRequest.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        const inspections = await tx.propertyInspection.findMany({
            where: {
                companyId,
                propertyId,
            },
            select: { id: true },
        });

        const inspectionIds = inspections.map((inspection) => inspection.id);

        await tx.propertyInspectionItem.deleteMany({
            where: {
                inspectionId: { in: inspectionIds },
            },
        });

        await tx.propertyInspection.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        await tx.unitBooking.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        await tx.lease.deleteMany({
            where: {
                companyId,
                unitId: { in: unitIds },
            },
        });

        await tx.tenant.deleteMany({
            where: {
                companyId,
                unitId: { in: unitIds },
            },
        });

        await tx.expense.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        await tx.propertyOwnership.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        await tx.unit.deleteMany({
            where: {
                companyId,
                propertyId,
            },
        });

        await tx.property.delete({
            where: {
                id: propertyId,
            },
        });
    });

    revalidatePath("/dashboard/company/properties");
    revalidatePath("/dashboard/company");
    redirect("/dashboard/company/properties");
}