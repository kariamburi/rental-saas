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

        const { bookingId } = await req.json();

        if (!bookingId) {
            return NextResponse.json(
                { ok: false, error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const booking = await prisma.unitBooking.findFirst({
            where: {
                id: bookingId,
                companyId: user.companyId,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { ok: false, error: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.status !== "CONFIRMED") {
            return NextResponse.json(
                { ok: false, error: "Only confirmed bookings can be converted" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: {
                id: booking.unitId,
                companyId: user.companyId,
                status: "VACANT",
            },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Booked unit is no longer vacant" },
                { status: 400 }
            );
        }

        const existingTenant = await prisma.tenant.findFirst({
            where: {
                companyId: user.companyId,
                unitId: booking.unitId,
                status: {
                    in: ["ACTIVE", "NOTICE"],
                },
            },
        });

        if (existingTenant) {
            return NextResponse.json(
                { ok: false, error: "This unit already has an active tenant" },
                { status: 400 }
            );
        }

        const tenant = await prisma.$transaction(async (tx) => {
            const createdTenant = await tx.tenant.create({
                data: {
                    companyId: user.companyId!,
                    unitId: booking.unitId,
                    name: booking.customerName,
                    phone: booking.phone,
                    email: booking.email || null,
                    idNumber: booking.idNumber || null,
                    moveInDate: booking.expectedMoveIn || new Date(),
                    status: "ACTIVE",
                },
            });

            await tx.unit.update({
                where: { id: booking.unitId },
                data: { status: "OCCUPIED" },
            });

            await tx.unitBooking.update({
                where: { id: booking.id },
                data: { status: "CONVERTED" },
            });

            return createdTenant;
        });

        return NextResponse.json({ ok: true, tenant });
    } catch (error) {
        console.error("Convert booking error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while converting booking" },
            { status: 500 }
        );
    }
}