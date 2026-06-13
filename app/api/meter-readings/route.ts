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

function toNumber(value: unknown) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

async function validateTenant(companyId: string, tenantId: string, unitId: string) {
    return prisma.tenant.findFirst({
        where: {
            id: tenantId,
            companyId,
            unitId,
            status: { in: ["ACTIVE", "NOTICE"] },
        },
    });
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const {
            companyId: bodyCompanyId,
            tenantId,
            unitId,
            billingMonth,
            readings,
        } = body;

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !tenantId || !unitId || !billingMonth || !Array.isArray(readings)) {
            return NextResponse.json(
                { ok: false, error: "Tenant, unit, month and readings are required" },
                { status: 400 }
            );
        }

        const tenant = await validateTenant(companyId, tenantId, unitId);

        if (!tenant) {
            return NextResponse.json(
                { ok: false, error: "Invalid tenant selected" },
                { status: 400 }
            );
        }

        const validReadings = readings.filter((r) => r.enabled);

        if (validReadings.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Select at least one meter type" },
                { status: 400 }
            );
        }

        const created = [];

        for (const item of validReadings) {
            const { type, previousReading, currentReading, ratePerUnit } = item;

            if (!["WATER", "ELECTRICITY"].includes(type)) {
                return NextResponse.json(
                    { ok: false, error: "Invalid meter type" },
                    { status: 400 }
                );
            }

            const prev = toNumber(previousReading);
            const curr = toNumber(currentReading);
            const rate = toNumber(ratePerUnit);

            if (prev === null || curr === null || rate === null) {
                return NextResponse.json(
                    { ok: false, error: `${type}: readings and rate must be valid numbers` },
                    { status: 400 }
                );
            }

            if (curr < prev) {
                return NextResponse.json(
                    { ok: false, error: `${type}: current reading cannot be less than previous` },
                    { status: 400 }
                );
            }

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
                    { ok: false, error: `${type} reading already exists for ${billingMonth}` },
                    { status: 400 }
                );
            }

            const unitsUsed = curr - prev;
            const amount = unitsUsed * rate;

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

            created.push(reading);
        }

        return NextResponse.json({ ok: true, readings: created });
    } catch (error) {
        console.error("Create meter readings error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while creating meter readings" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        const {
            companyId: bodyCompanyId,
            readingId,
            tenantId,
            unitId,
            type,
            previousReading,
            currentReading,
            ratePerUnit,
            billingMonth,
        } = body;

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !readingId || !tenantId || !unitId || !type || !billingMonth) {
            return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
        }

        const prev = toNumber(previousReading);
        const curr = toNumber(currentReading);
        const rate = toNumber(ratePerUnit);

        if (prev === null || curr === null || rate === null) {
            return NextResponse.json({ ok: false, error: "Invalid numbers" }, { status: 400 });
        }

        if (curr < prev) {
            return NextResponse.json(
                { ok: false, error: "Current reading cannot be less than previous reading" },
                { status: 400 }
            );
        }

        const existing = await prisma.meterReading.findFirst({
            where: { id: readingId, companyId },
        });

        if (!existing) {
            return NextResponse.json({ ok: false, error: "Reading not found" }, { status: 404 });
        }

        const duplicate = await prisma.meterReading.findFirst({
            where: {
                companyId,
                tenantId,
                unitId,
                type,
                billingMonth,
                NOT: { id: readingId },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { ok: false, error: `${type} reading already exists for this month` },
                { status: 400 }
            );
        }

        const unitsUsed = curr - prev;
        const amount = unitsUsed * rate;

        const reading = await prisma.meterReading.update({
            where: { id: readingId },
            data: {
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
        console.error("Update meter reading error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while updating meter reading" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const { readingId, companyId: bodyCompanyId } = await req.json();
        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !readingId) {
            return NextResponse.json({ ok: false, error: "Reading ID is required" }, { status: 400 });
        }

        const reading = await prisma.meterReading.findFirst({
            where: { id: readingId, companyId },
        });

        if (!reading) {
            return NextResponse.json({ ok: false, error: "Reading not found" }, { status: 404 });
        }

        await prisma.meterReading.delete({
            where: { id: readingId },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete meter reading error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error while deleting meter reading" },
            { status: 500 }
        );
    }
}