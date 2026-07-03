import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const ownerWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
];

function canManageOwners(role: string) {
    return ownerWriteRoles.includes(role as any);
}

function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) return bodyCompanyId || null;

    if (user.role === Roles.COMPANY_ADMIN || user.role === Roles.MANAGER) {
        return user.companyId;
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!canManageOwners(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const {
            companyId: bodyCompanyId,
            name,
            phone,
            email,
            idNumber,
            address,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !name || !phone) {
            return NextResponse.json(
                { ok: false, error: "Owner name and phone are required" },
                { status: 400 }
            );
        }

        const owner = await prisma.owner.create({
            data: {
                companyId,
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