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

        const { companyId: bodyCompanyId, name, location, description } =
            await req.json();

        let companyId: string | null = null;

        if (user.role === Roles.SUPER_ADMIN) {
            companyId = bodyCompanyId;
        }

        if (user.role === Roles.COMPANY_ADMIN) {
            companyId = user.companyId;
        }

        if (!companyId || !name) {
            return NextResponse.json(
                { ok: false, error: "Company and property name are required" },
                { status: 400 }
            );
        }

        const property = await prisma.property.create({
            data: {
                companyId,
                name,
                location: location || null,
                description: description || null,
            },
        });

        return NextResponse.json({ ok: true, property });
    } catch (error) {
        console.error("Create property error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while creating property" },
            { status: 500 }
        );
    }
}