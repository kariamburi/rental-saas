import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();

        const tenantId = cookieStore.get("tenant_id")?.value;
        const companyId = cookieStore.get("tenant_company_id")?.value;

        if (!tenantId || !companyId) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { title, description } = await req.json();

        if (!title || !description) {
            return NextResponse.json(
                { ok: false, error: "Title and description are required" },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                id: tenantId,
                companyId,
            },
        });

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "Tenant not found" },
                { status: 404 }
            );
        }

        if (!tenant.unitId) {
            return NextResponse.json(
                { ok: false, error: "Tenant has no assigned unit" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: {
                id: tenant.unitId,
                companyId,
            },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Unit not found" },
                { status: 404 }
            );
        }

        const request = await prisma.maintenanceRequest.create({
            data: {
                companyId,
                tenantId: tenant.id,
                propertyId: unit.propertyId,
                unitId: unit.id,
                title,
                description,
                status: "OPEN",
            },
        });

        return NextResponse.json({ ok: true, request });
    } catch (error) {
        console.error("Tenant maintenance error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating maintenance request" },
            { status: 500 }
        );
    }
}