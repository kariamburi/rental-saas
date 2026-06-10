import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { inspectionId } = await req.json();

        if (!inspectionId) {
            return NextResponse.json(
                { ok: false, error: "Inspection ID is required" },
                { status: 400 }
            );
        }

        const inspection = await prisma.propertyInspection.findFirst({
            where: {
                id: inspectionId,
                companyId: user.companyId,
            },
            include: {
                property: true,
                unit: true,
                tenant: true,
                items: true,
            },
        });

        if (!inspection) {
            return NextResponse.json(
                { ok: false, error: "Inspection not found" },
                { status: 404 }
            );
        }

        const issueItems = inspection.items.filter((item) =>
            ["DAMAGED", "NEEDS_REPAIR", "POOR"].includes(item.condition)
        );

        if (issueItems.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No damaged or repair-needed items found" },
                { status: 400 }
            );
        }

        const description = issueItems
            .map(
                (item) =>
                    `${item.area}: ${item.condition}${item.notes ? ` - ${item.notes}` : ""}`
            )
            .join("\n");

        const request = await prisma.maintenanceRequest.create({
            data: {
                companyId: user.companyId,
                propertyId: inspection.propertyId,
                unitId: inspection.unitId || null,
                tenantId: inspection.tenantId || null,
                title: `Inspection Issue - ${inspection.property.name}`,
                description,
                status: "OPEN",
            },
        });

        await prisma.propertyInspection.update({
            where: { id: inspection.id },
            data: { status: "ISSUES_FOUND" },
        });

        return NextResponse.json({ ok: true, request });
    } catch (error) {
        console.error("Create maintenance from inspection error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating maintenance request" },
            { status: 500 }
        );
    }
}