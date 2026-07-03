import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const maintenanceWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.CARETAKER,
];

function canManageMaintenance(role: string) {
    return maintenanceWriteRoles.includes(role as any);
}

function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) return bodyCompanyId || null;

    if (
        user.role === Roles.COMPANY_ADMIN ||
        user.role === Roles.MANAGER ||
        user.role === Roles.CARETAKER
    ) {
        return user.companyId;
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!canManageMaintenance(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const {
            companyId: bodyCompanyId,
            tenantId,
            propertyId,
            unitId,
            title,
            description,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !propertyId || !title || !description) {
            return NextResponse.json(
                { ok: false, error: "Property, title and description are required" },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: { id: propertyId, companyId },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        if (tenantId) {
            const tenant = await prisma.tenant.findFirst({
                where: { id: tenantId, companyId },
            });

            if (!tenant) {
                return NextResponse.json(
                    { ok: false, error: "Invalid tenant selected" },
                    { status: 400 }
                );
            }
        }

        if (unitId) {
            const unit = await prisma.unit.findFirst({
                where: {
                    id: unitId,
                    companyId,
                    propertyId,
                },
            });

            if (!unit) {
                return NextResponse.json(
                    { ok: false, error: "Invalid unit selected" },
                    { status: 400 }
                );
            }
        }

        const request = await prisma.maintenanceRequest.create({
            data: {
                companyId,
                tenantId: tenantId || null,
                propertyId,
                unitId: unitId || null,
                title,
                description,
                status: "OPEN",
            },
        });

        return NextResponse.json({ ok: true, request });
    } catch (error) {
        console.error("Create maintenance error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating maintenance request" },
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

        if (!canManageMaintenance(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const { companyId: bodyCompanyId, requestId, status } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !requestId || !status) {
            return NextResponse.json(
                { ok: false, error: "Request and status are required" },
                { status: 400 }
            );
        }

        const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { ok: false, error: "Invalid maintenance status" },
                { status: 400 }
            );
        }

        const existingRequest = await prisma.maintenanceRequest.findFirst({
            where: { id: requestId, companyId },
        });

        if (!existingRequest) {
            return NextResponse.json(
                { ok: false, error: "Maintenance request not found" },
                { status: 404 }
            );
        }

        const request = await prisma.maintenanceRequest.update({
            where: { id: requestId },
            data: { status },
        });

        return NextResponse.json({ ok: true, request });
    } catch (error) {
        console.error("Update maintenance error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating maintenance request" },
            { status: 500 }
        );
    }
}