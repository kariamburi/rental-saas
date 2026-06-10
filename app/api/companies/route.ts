import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, email, phone, address } = await req.json();

        if (!name) {
            return NextResponse.json(
                { ok: false, error: "Company name is required" },
                { status: 400 }
            );
        }

        const company = await prisma.company.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                status: "ACTIVE",
            },
        });

        return NextResponse.json({ ok: true, company });
    } catch (error) {
        console.error("Create company error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating company" },
            { status: 500 }
        );
    }
}