import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json(
                { ok: false, error: "Phone number is required" },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                phone,
                status: {
                    in: ["ACTIVE", "NOTICE"],
                },
            },
            include: {
                company: true,
                unit: {
                    include: { property: true },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "No active tenant found with this phone number" },
                { status: 404 }
            );
        }

        const cookieStore = await cookies();

        cookieStore.set("tenant_id", tenant.id, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        cookieStore.set("tenant_company_id", tenant.companyId, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({
            ok: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                phone: tenant.phone,
                company: tenant.company.name,
                unit: tenant.unit
                    ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}`
                    : null,
            },
        });
    } catch (error) {
        console.error("Tenant login error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while logging in tenant" },
            { status: 500 }
        );
    }
}