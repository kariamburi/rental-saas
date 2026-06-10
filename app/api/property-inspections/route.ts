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

        const {
            propertyId,
            unitId,
            tenantId,
            inspectionDate,
            type,
            status,
            overallNotes,
            items,
        } = await req.json();

        if (!propertyId || !inspectionDate) {
            return NextResponse.json(
                { ok: false, error: "Property and inspection date are required" },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId: user.companyId,
            },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        if (unitId) {
            const unit = await prisma.unit.findFirst({
                where: {
                    id: unitId,
                    propertyId,
                    companyId: user.companyId,
                },
            });

            if (!unit) {
                return NextResponse.json(
                    { ok: false, error: "Invalid unit selected" },
                    { status: 400 }
                );
            }
        }

        if (tenantId) {
            const tenant = await prisma.tenant.findFirst({
                where: {
                    id: tenantId,
                    companyId: user.companyId,
                    unitId: unitId || undefined,
                },
            });

            if (!tenant) {
                return NextResponse.json(
                    { ok: false, error: "Invalid tenant selected" },
                    { status: 400 }
                );
            }
        }

        const inspection = await prisma.propertyInspection.create({
            data: {
                companyId: user.companyId,
                propertyId,
                unitId: unitId || null,
                tenantId: tenantId || null,
                inspectionDate: new Date(inspectionDate),
                type: type || "ROUTINE",
                status: status || "PENDING",
                overallNotes: overallNotes || null,
                inspectedBy: user.name || user.email,
                items: {
                    create: Array.isArray(items)
                        ? items
                            .filter((item) => item.area && item.condition)
                            .map((item) => ({
                                area: item.area,
                                condition: item.condition,
                                notes: item.notes || null,
                                photoUrl: item.photoUrl || null,
                            }))
                        : [],
                },
            },
        });

        return NextResponse.json({ ok: true, inspection });
    } catch (error) {
        console.error("Create property inspection error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating inspection" },
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

        if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { inspectionId, status } = await req.json();

        if (!inspectionId || !status) {
            return NextResponse.json(
                { ok: false, error: "Inspection and status are required" },
                { status: 400 }
            );
        }

        const allowedStatuses = ["PENDING", "COMPLETED", "ISSUES_FOUND"];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { ok: false, error: "Invalid inspection status" },
                { status: 400 }
            );
        }

        const inspection = await prisma.propertyInspection.findFirst({
            where: {
                id: inspectionId,
                companyId: user.companyId,
            },
        });

        if (!inspection) {
            return NextResponse.json(
                { ok: false, error: "Inspection not found" },
                { status: 404 }
            );
        }

        const updatedInspection = await prisma.propertyInspection.update({
            where: { id: inspectionId },
            data: { status },
        });

        return NextResponse.json({ ok: true, inspection: updatedInspection });
    } catch (error) {
        console.error("Update property inspection error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating inspection" },
            { status: 500 }
        );
    }
}