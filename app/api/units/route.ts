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

        const { companyId: bodyCompanyId, propertyId, unitNumber, rentAmount, status } =
            await req.json();

        let companyId: string | null = null;

        if (user.role === Roles.SUPER_ADMIN) {
            companyId = bodyCompanyId;
        }

        if (user.role === Roles.COMPANY_ADMIN) {
            companyId = user.companyId;
        }

        if (!companyId || !propertyId || !unitNumber || !rentAmount) {
            return NextResponse.json(
                { ok: false, error: "Property, unit number and rent amount are required" },
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
                rentAmount,
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