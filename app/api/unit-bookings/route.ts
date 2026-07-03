import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const bookingWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
];

function canManageBookings(role: string) {
    return bookingWriteRoles.includes(role as any);
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

function toAmount(value: unknown) {
    return Number(value || 0);
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!canManageBookings(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const {
            companyId: bodyCompanyId,
            propertyId,
            unitId,
            customerName,
            phone,
            email,
            idNumber,
            expectedMoveIn,
            amountPaid,
            notes,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !propertyId || !unitId || !customerName || !phone) {
            return NextResponse.json(
                { ok: false, error: "Property, unit, customer name and phone are required" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                propertyId,
                companyId,
                status: "VACANT",
            },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Selected unit is not available for booking" },
                { status: 400 }
            );
        }

        const existingBooking = await prisma.unitBooking.findFirst({
            where: {
                companyId,
                unitId,
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
            },
        });

        if (existingBooking) {
            return NextResponse.json(
                { ok: false, error: "This unit already has an active booking" },
                { status: 400 }
            );
        }

        const booking = await prisma.unitBooking.create({
            data: {
                companyId,
                propertyId,
                unitId,
                customerName,
                phone,
                email: email || null,
                idNumber: idNumber || null,
                expectedMoveIn: expectedMoveIn ? new Date(expectedMoveIn) : null,
                amountPaid: toAmount(amountPaid),
                notes: notes || null,
                status: "PENDING",
            },
        });

        return NextResponse.json({ ok: true, booking });
    } catch (error) {
        console.error("Create unit booking error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating booking" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!canManageBookings(user.role)) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        const { companyId: bodyCompanyId, bookingId, status } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !bookingId || !status) {
            return NextResponse.json(
                { ok: false, error: "Booking and status are required" },
                { status: 400 }
            );
        }

        const allowedStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "CONVERTED"];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { ok: false, error: "Invalid booking status" },
                { status: 400 }
            );
        }

        const existingBooking = await prisma.unitBooking.findFirst({
            where: {
                id: bookingId,
                companyId,
            },
        });

        if (!existingBooking) {
            return NextResponse.json(
                { ok: false, error: "Booking not found" },
                { status: 404 }
            );
        }

        const booking = await prisma.unitBooking.update({
            where: { id: bookingId },
            data: { status },
        });

        return NextResponse.json({ ok: true, booking });
    } catch (error) {
        console.error("Update booking error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating booking" },
            { status: 500 }
        );
    }
}