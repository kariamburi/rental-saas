import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

function resolveCompanyId(
    user: { role: string; companyId: string | null },
    bodyCompanyId?: string
) {
    if (user.role === Roles.SUPER_ADMIN) return bodyCompanyId || null;
    if (user.role === Roles.COMPANY_ADMIN) return user.companyId;
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

        const {
            companyId: bodyCompanyId,
            tenantId,
            unitId,
            type,
            previousReading,
            currentReading,
            ratePerUnit,
            billingMonth,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (
            !companyId ||
            !tenantId ||
            !unitId ||
            !type ||
            previousReading === "" ||
            currentReading === "" ||
            ratePerUnit === "" ||
            !billingMonth
        ) {
            return NextResponse.json(
                { ok: false, error: "All meter reading fields are required" },
                { status: 400 }
            );
        }

        if (!["WATER", "ELECTRICITY"].includes(type)) {
            return NextResponse.json(
                { ok: false, error: "Invalid meter type" },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                id: tenantId,
                companyId,
                unitId,
                status: { in: ["ACTIVE", "NOTICE"] },
            },
        });

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "Invalid tenant selected" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.findFirst({
            where: {
                id: unitId,
                companyId,
            },
        });

        if (!unit) {
            return NextResponse.json(
                { ok: false, error: "Invalid unit selected" },
                { status: 400 }
            );
        }

        const prev = Number(previousReading);
        const curr = Number(currentReading);
        const rate = Number(ratePerUnit);

        if (Number.isNaN(prev) || Number.isNaN(curr) || Number.isNaN(rate)) {
            return NextResponse.json(
                { ok: false, error: "Readings and rate must be valid numbers" },
                { status: 400 }
            );
        }

        if (curr < prev) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Current reading cannot be less than previous reading",
                },
                { status: 400 }
            );
        }

        const unitsUsed = curr - prev;
        const amount = unitsUsed * rate;

        const existing = await prisma.meterReading.findFirst({
            where: {
                companyId,
                tenantId,
                unitId,
                type,
                billingMonth,
            },
        });

        if (existing) {
            return NextResponse.json(
                { ok: false, error: `${type} reading already exists for this month` },
                { status: 400 }
            );
        }

        const reading = await prisma.meterReading.create({
            data: {
                companyId,
                tenantId,
                unitId,
                type,
                previousReading: prev,
                currentReading: curr,
                unitsUsed,
                ratePerUnit: rate,
                amount,
                billingMonth,
            },
        });

        return NextResponse.json({ ok: true, reading });
    } catch (error) {
        console.error("Create meter reading error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating meter reading" },
            { status: 500 }
        );
    }
}