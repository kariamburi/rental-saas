import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { getCompanySubscription } from "@/lib/get-company-subscription";

const propertyWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
];

function canManageProperties(role: string) {
    return propertyWriteRoles.includes(role as any);
}

async function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string,
    propertyId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) {
        if (bodyCompanyId) return bodyCompanyId;

        if (propertyId) {
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { companyId: true },
            });

            return property?.companyId || null;
        }

        return null;
    }

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

        if (!canManageProperties(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { companyId: bodyCompanyId, name, location, description } =
            await req.json();

        const companyId = await resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !name) {
            return NextResponse.json(
                { ok: false, error: "Company and property name are required" },
                { status: 400 }
            );
        }

        const subscription = await getCompanySubscription(companyId);

        if (subscription.isExpired) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Subscription expired. Please renew to continue.",
                },
                { status: 403 }
            );
        }

        if (subscription.plan?.propertyLimit) {
            const propertyCount = await prisma.property.count({
                where: { companyId },
            });

            if (propertyCount >= subscription.plan.propertyLimit) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: `Your current plan allows only ${subscription.plan.propertyLimit} property/properties.`,
                    },
                    { status: 403 }
                );
            }
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

export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!canManageProperties(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { propertyId, name, location, description } = await req.json();

        const companyId = await resolveCompanyId(user, undefined, propertyId);

        if (!companyId || !propertyId || !name) {
            return NextResponse.json(
                { ok: false, error: "Property name is required" },
                { status: 400 }
            );
        }

        const existingProperty = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (!existingProperty) {
            return NextResponse.json(
                { ok: false, error: "Property not found" },
                { status: 404 }
            );
        }

        const property = await prisma.property.update({
            where: { id: propertyId },
            data: {
                name,
                location: location || null,
                description: description || null,
            },
        });

        return NextResponse.json({ ok: true, property });
    } catch (error) {
        console.error("Update property error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating property" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!canManageProperties(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { propertyId } = await req.json();

        const companyId = await resolveCompanyId(user, undefined, propertyId);

        if (!companyId || !propertyId) {
            return NextResponse.json(
                { ok: false, error: "Property is required" },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
            include: {
                units: true,
            },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Property not found" },
                { status: 404 }
            );
        }

        if (property.units.length > 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Cannot delete property because it has units",
                },
                { status: 400 }
            );
        }

        await prisma.property.delete({
            where: { id: propertyId },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete property error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while deleting property" },
            { status: 500 }
        );
    }
}