import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

function resolveCompanyId(user: { role: string; companyId: string | null }, bodyCompanyId?: string) {
    if (user.role === Roles.SUPER_ADMIN) return bodyCompanyId || null;
    if (user.role === Roles.COMPANY_ADMIN) return user.companyId;
    return null;
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const {
            companyId: bodyCompanyId,
            unitId,
            name,
            phone,
            email,
            idNumber,
            occupation,
            emergencyContact,
            moveInDate,
            status,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !unitId || !name || !phone) {
            return NextResponse.json(
                { ok: false, error: "Company, unit, name and phone are required" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: { id: unitId, companyId },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Selected unit was not found" },
                { status: 404 }
            );
        }

        if (unit.status !== "VACANT") {
            return NextResponse.json(
                { ok: false, error: "This unit is not vacant" },
                { status: 400 }
            );
        }

        const existingTenant = await prisma.tenant.findFirst({
            where: {
                companyId,
                unitId,
                status: { in: ["ACTIVE", "NOTICE"] },
            },
        });

        if (existingTenant) {
            return NextResponse.json(
                { ok: false, error: "This unit already has an active tenant" },
                { status: 400 }
            );
        }

        const tenant = await prisma.$transaction(async (tx) => {
            const createdTenant = await tx.tenant.create({
                data: {
                    companyId,
                    unitId,
                    name,
                    phone,
                    email: email || null,
                    idNumber: idNumber || null,
                    occupation: occupation || null,
                    emergencyContact: emergencyContact || null,
                    moveInDate: moveInDate ? new Date(moveInDate) : null,
                    status: status || "ACTIVE",
                },
            });

            await tx.unit.update({
                where: { id: unitId },
                data: { status: "OCCUPIED" },
            });

            return createdTenant;
        });

        return NextResponse.json({ ok: true, tenant });
    } catch (error) {
        console.error("Create tenant error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while creating tenant" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { tenantId, companyId: bodyCompanyId } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !tenantId) {
            return NextResponse.json(
                { ok: false, error: "Tenant ID is required" },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findFirst({
            where: { id: tenantId, companyId },
        });

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "Tenant not found" },
                { status: 404 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.tenant.delete({
                where: { id: tenantId },
            });

            if (tenant.unitId) {
                await tx.unit.updateMany({
                    where: {
                        id: tenant.unitId,
                        companyId,
                    },
                    data: { status: "VACANT" },
                });
            }
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete tenant error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while deleting tenant" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const {
            companyId: bodyCompanyId,
            tenantId,
            unitId,
            name,
            phone,
            email,
            idNumber,
            occupation,
            emergencyContact,
            moveInDate,
            status,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !tenantId || !unitId || !name || !phone) {
            return NextResponse.json(
                { ok: false, error: "Tenant, unit, name and phone are required" },
                { status: 400 }
            );
        }

        const existingTenant = await prisma.tenant.findFirst({
            where: { id: tenantId, companyId },
        });

        if (!existingTenant) {
            return NextResponse.json(
                { ok: false, error: "Tenant not found" },
                { status: 404 }
            );
        }

        const selectedUnit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                companyId,
            },
        });

        if (!selectedUnit) {
            return NextResponse.json(
                { ok: false, error: "Selected unit was not found" },
                { status: 404 }
            );
        }

        const anotherTenantInUnit = await prisma.tenant.findFirst({
            where: {
                companyId,
                unitId,
                id: { not: tenantId },
                status: { in: ["ACTIVE", "NOTICE"] },
            },
        });

        if (anotherTenantInUnit) {
            return NextResponse.json(
                { ok: false, error: "This unit already has another active tenant" },
                { status: 400 }
            );
        }

        const updatedTenant = await prisma.$transaction(async (tx) => {
            if (existingTenant.unitId && existingTenant.unitId !== unitId) {
                await tx.unit.updateMany({
                    where: {
                        id: existingTenant.unitId,
                        companyId,
                    },
                    data: { status: "VACANT" },
                });
            }

            await tx.unit.updateMany({
                where: {
                    id: unitId,
                    companyId,
                },
                data: {
                    status: status === "VACATED" ? "VACANT" : "OCCUPIED",
                },
            });

            return tx.tenant.update({
                where: { id: tenantId },
                data: {
                    unitId,
                    name,
                    phone,
                    email: email || null,
                    idNumber: idNumber || null,
                    occupation: occupation || null,
                    emergencyContact: emergencyContact || null,
                    moveInDate: moveInDate ? new Date(moveInDate) : null,
                    status: status || "ACTIVE",
                },
            });
        });

        return NextResponse.json({ ok: true, tenant: updatedTenant });
    } catch (error) {
        console.error("Update tenant error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while updating tenant" },
            { status: 500 }
        );
    }
}