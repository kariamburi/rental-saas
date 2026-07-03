import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const unitWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
];

function canManageUnits(role: string) {
    return unitWriteRoles.includes(role as any);
}

async function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string,
    unitId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) {
        if (bodyCompanyId) return bodyCompanyId;

        if (unitId) {
            const unit = await prisma.unit.findUnique({
                where: { id: unitId },
                select: { companyId: true },
            });

            return unit?.companyId || null;
        }

        return null;
    }

    if (user.role === Roles.COMPANY_ADMIN || user.role === Roles.MANAGER) {
        return user.companyId;
    }

    return null;
}

function toAmount(value: unknown) {
    return Number(value || 0);
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!canManageUnits(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const {
            companyId: bodyCompanyId,
            propertyId,
            unitNumber,
            unitSize,
            rentAmount,
            status,
        } = await req.json();

        const companyId = await resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !propertyId || !unitNumber || !rentAmount) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Property, unit number and rent amount are required",
                },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.create({
            data: {
                companyId,
                propertyId,
                unitNumber,
                unitSize: unitSize || null,
                rentAmount: toAmount(rentAmount),
                status: status || "VACANT",
            },
        });

        return NextResponse.json({ ok: true, unit });
    } catch (error) {
        console.error("Create unit error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating unit" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!canManageUnits(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const {
            unitId,
            propertyId,
            unitNumber,
            unitSize,
            rentAmount,
            status,
        } = await req.json();

        const companyId = await resolveCompanyId(user, undefined, unitId);

        if (!companyId || !unitId || !propertyId || !unitNumber || !rentAmount) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Unit, property, unit number and rent amount are required",
                },
                { status: 400 }
            );
        }

        const existingUnit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                companyId,
            },
        });

        if (!existingUnit) {
            return NextResponse.json(
                { ok: false, error: "Unit not found" },
                { status: 404 }
            );
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.update({
            where: { id: unitId },
            data: {
                propertyId,
                unitNumber,
                unitSize: unitSize || null,
                rentAmount: toAmount(rentAmount),
                status: status || existingUnit.status,
            },
        });

        return NextResponse.json({ ok: true, unit });
    } catch (error) {
        console.error("Update unit error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating unit" },
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

        if (!canManageUnits(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const { unitId, companyId: bodyCompanyId } = await req.json();

        const companyId = await resolveCompanyId(user, bodyCompanyId, unitId);

        if (!companyId || !unitId) {
            return NextResponse.json(
                { ok: false, error: "Unit ID is required" },
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
                { ok: false, error: "Unit not found" },
                { status: 404 }
            );
        }

        if (unit.status !== "VACANT") {
            return NextResponse.json(
                { ok: false, error: "Only vacant units can be deleted" },
                { status: 400 }
            );
        }

        await prisma.unit.delete({
            where: {
                id: unitId,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete unit error:", error);

        return NextResponse.json(
            { ok: false, error: "Failed to delete unit" },
            { status: 500 }
        );
    }
}