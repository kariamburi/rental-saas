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

        const { name, phone, email, idNumber, address } = await req.json();

        if (!name || !phone) {
            return NextResponse.json(
                { ok: false, error: "Owner name and phone are required" },
                { status: 400 }
            );
        }

        const owner = await prisma.owner.create({
            data: {
                companyId: user.companyId,
                name,
                phone,
                email: email || null,
                idNumber: idNumber || null,
                address: address || null,
                status: "ACTIVE",
            },
        });

        return NextResponse.json({ ok: true, owner });
    } catch (error) {
        console.error("Create owner error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating owner" },
            { status: 500 }
        );
    }
}