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
export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { propertyId, name, location, description } = await req.json();

        let companyId: string | null = null;

        if (user.role === Roles.COMPANY_ADMIN) {
            companyId = user.companyId;
        }

        if (user.role === Roles.SUPER_ADMIN) {
            const existingProperty = await prisma.property.findUnique({
                where: { id: propertyId },
            });

            companyId = existingProperty?.companyId || null;
        }

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

        const { propertyId } = await req.json();

        let companyId: string | null = null;

        if (user.role === Roles.COMPANY_ADMIN) {
            companyId = user.companyId;
        }

        if (user.role === Roles.SUPER_ADMIN) {
            const existingProperty = await prisma.property.findUnique({
                where: { id: propertyId },
            });

            companyId = existingProperty?.companyId || null;
        }

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