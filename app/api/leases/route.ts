import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) return bodyCompanyId || null;
    if (user.role === Roles.COMPANY_ADMIN) return user.companyId;
    return null;
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            companyId: bodyCompanyId,
            tenantId,
            unitId,
            monthlyRent,
            depositAmount,
            garbageCharge,
            securityCharge,
            serviceCharge,
            startDate,
            endDate,
            billingDay,
            rentDueDay,
            gracePeriodDays,
            notes,
            agreementTerms,
            status,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !tenantId || !unitId || !monthlyRent || !startDate) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Tenant, unit, monthly rent and start date are required",
                },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                id: tenantId,
                companyId,
                unitId,
                status: { in: ["ACTIVE", "NOTICE"] },
            },
        });

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "Invalid tenant selected" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                companyId,
            },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Invalid unit selected" },
                { status: 400 }
            );
        }

        const existingLease = await prisma.lease.findFirst({
            where: {
                companyId,
                unitId,
                status: "ACTIVE",
            },
        });

        if (existingLease) {
            return NextResponse.json(
                { ok: false, error: "This unit already has an active lease" },
                { status: 400 }
            );
        }

        const lease = await prisma.lease.create({
            data: {
                companyId,
                tenantId,
                unitId,
                monthlyRent,
                depositAmount: depositAmount || 0,
                garbageCharge: garbageCharge || 0,
                securityCharge: securityCharge || 0,
                serviceCharge: serviceCharge || 0,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                billingDay: Number(billingDay || 1),
                rentDueDay: Number(rentDueDay || 5),
                gracePeriodDays: Number(gracePeriodDays || 0),
                notes: notes || null,
                agreementTerms: agreementTerms || null,
                status: status || "ACTIVE",
            },
        });

        return NextResponse.json({ ok: true, lease });
    } catch (error) {
        console.error("Create lease error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while creating lease" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            companyId: bodyCompanyId,
            leaseId,
            monthlyRent,
            depositAmount,
            garbageCharge,
            securityCharge,
            serviceCharge,
            startDate,
            endDate,
            billingDay,
            rentDueDay,
            gracePeriodDays,
            notes,
            agreementTerms,
            status,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !leaseId || !monthlyRent || !startDate) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Lease, monthly rent and start date are required",
                },
                { status: 400 }
            );
        }

        const lease = await prisma.lease.findFirst({
            where: {
                id: leaseId,
                companyId,
            },
        });

        if (!lease) {
            return NextResponse.json(
                { ok: false, error: "Lease not found" },
                { status: 404 }
            );
        }

        const invoiceCount = await prisma.invoice.count({
            where: {
                companyId,
                tenantId: lease.tenantId,
                unitId: lease.unitId,
            },
        });

        if (invoiceCount > 0 && status === "ENDED") {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Use End Lease button to end leases with invoices",
                },
                { status: 400 }
            );
        }

        const updatedLease = await prisma.lease.update({
            where: { id: leaseId },
            data: {
                monthlyRent,
                depositAmount: depositAmount || 0,
                garbageCharge: garbageCharge || 0,
                securityCharge: securityCharge || 0,
                serviceCharge: serviceCharge || 0,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                billingDay: Number(billingDay || 1),
                rentDueDay: Number(rentDueDay || 5),
                gracePeriodDays: Number(gracePeriodDays || 0),
                notes: notes || null,
                agreementTerms: agreementTerms || null,
                status: status || "ACTIVE",
            },
        });

        return NextResponse.json({ ok: true, lease: updatedLease });
    } catch (error) {
        console.error("Update lease error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while updating lease" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { companyId: bodyCompanyId, leaseId, endDate } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !leaseId) {
            return NextResponse.json(
                { ok: false, error: "Lease ID is required" },
                { status: 400 }
            );
        }

        const lease = await prisma.lease.findFirst({
            where: {
                id: leaseId,
                companyId,
            },
        });

        if (!lease) {
            return NextResponse.json(
                { ok: false, error: "Lease not found" },
                { status: 404 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.lease.update({
                where: { id: leaseId },
                data: {
                    status: "ENDED",
                    endDate: endDate ? new Date(endDate) : new Date(),
                },
            });

            await tx.tenant.updateMany({
                where: {
                    id: lease.tenantId,
                    companyId,
                },
                data: {
                    status: "VACATED",
                },
            });

            await tx.unit.updateMany({
                where: {
                    id: lease.unitId,
                    companyId,
                },
                data: {
                    status: "VACANT",
                },
            });
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("End lease error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while ending lease" },
            { status: 500 }
        );
    }
}