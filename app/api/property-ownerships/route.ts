import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const propertyOwnershipWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
];

function canManagePropertyOwnerships(role: string) {
    return propertyOwnershipWriteRoles.includes(role as any);
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

        if (!canManagePropertyOwnerships(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const {
            companyId: bodyCompanyId,
            ownerId,
            propertyId,
            percentage,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !ownerId || !propertyId || !percentage) {
            return NextResponse.json(
                { ok: false, error: "Owner, property and percentage are required" },
                { status: 400 }
            );
        }

        const owner = await prisma.owner.findFirst({
            where: {
                id: ownerId,
                companyId,
            },
        });

        if (!owner) {
            return NextResponse.json(
                { ok: false, error: "Invalid owner selected" },
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

        const percent = Number(percentage);

        if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
            return NextResponse.json(
                { ok: false, error: "Percentage must be between 1 and 100" },
                { status: 400 }
            );
        }

        const existing = await prisma.propertyOwnership.findFirst({
            where: {
                companyId,
                ownerId,
                propertyId,
            },
        });

        if (existing) {
            return NextResponse.json(
                { ok: false, error: "This owner is already linked to this property" },
                { status: 400 }
            );
        }

        const totalExistingPercentage = await prisma.propertyOwnership.aggregate({
            where: {
                companyId,
                propertyId,
            },
            _sum: {
                percentage: true,
            },
        });

        const usedPercentage = Number(totalExistingPercentage._sum.percentage || 0);

        if (usedPercentage + percent > 100) {
            return NextResponse.json(
                {
                    ok: false,
                    error: `Ownership exceeds 100%. Available percentage is ${100 - usedPercentage
                        }%`,
                },
                { status: 400 }
            );
        }

        const ownership = await prisma.propertyOwnership.create({
            data: {
                companyId,
                ownerId,
                propertyId,
                percentage: percent,
            },
        });

        return NextResponse.json({ ok: true, ownership });
    } catch (error) {
        console.error("Create property ownership error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while assigning property" },
            { status: 500 }
        );
    }
}