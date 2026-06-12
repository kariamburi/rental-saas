import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

function pad(num: number) {
    return String(num).padStart(4, "0");
}

function toNumber(value: unknown) {
    return Number(value || 0);
}

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

        const { companyId: bodyCompanyId, year, month, propertyId } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !year || !month) {
            return NextResponse.json(
                { ok: false, error: "Company, year and month are required" },
                { status: 400 }
            );
        }

        const period = `${year}-${String(month).padStart(2, "0")}`;
        const periodKey = period.replace("-", "");

        const leases = await prisma.lease.findMany({
            where: {
                companyId,
                status: "ACTIVE",
                ...(propertyId
                    ? {
                        unit: {
                            propertyId,
                        },
                    }
                    : {}),
            },
            include: {
                tenant: true,
                unit: true,
            },
        });

        let created = 0;
        let skipped = 0;

        for (const lease of leases) {
            const existing = await prisma.invoice.findFirst({
                where: {
                    companyId,
                    tenantId: lease.tenantId,
                    unitId: lease.unitId,
                    invoiceNo: {
                        contains: periodKey,
                    },
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            const meterReadings = await prisma.meterReading.findMany({
                where: {
                    companyId,
                    tenantId: lease.tenantId,
                    unitId: lease.unitId,
                    billingMonth: period,
                },
            });

            const items: {
                description: string;
                type: string;
                amount: number;
            }[] = [];

            items.push({
                description: "Monthly Rent",
                type: "RENT",
                amount: toNumber(lease.monthlyRent),
            });

            if (toNumber(lease.garbageCharge) > 0) {
                items.push({
                    description: "Garbage Collection",
                    type: "GARBAGE",
                    amount: toNumber(lease.garbageCharge),
                });
            }

            if (toNumber(lease.securityCharge) > 0) {
                items.push({
                    description: "Security Charge",
                    type: "SECURITY",
                    amount: toNumber(lease.securityCharge),
                });
            }

            if (toNumber(lease.serviceCharge) > 0) {
                items.push({
                    description: "Service Charge",
                    type: "SERVICE",
                    amount: toNumber(lease.serviceCharge),
                });
            }

            for (const reading of meterReadings) {
                items.push({
                    description: `${reading.type} (${Number(
                        reading.previousReading
                    ).toLocaleString()} → ${Number(
                        reading.currentReading
                    ).toLocaleString()} @ KES ${Number(
                        reading.ratePerUnit
                    ).toLocaleString()})`,
                    type: reading.type,
                    amount: toNumber(reading.amount),
                });
            }

            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

            if (totalAmount <= 0) {
                skipped++;
                continue;
            }

            const count = await prisma.invoice.count({
                where: { companyId },
            });

            const invoiceNo = `INV-${periodKey}-${pad(count + created + 1)}`;

            const dueDate = new Date(
                Number(year),
                Number(month) - 1,
                lease.rentDueDay || 5
            );

            await prisma.invoice.create({
                data: {
                    companyId,
                    tenantId: lease.tenantId,
                    unitId: lease.unitId,
                    invoiceNo,
                    invoiceDate: new Date(),
                    dueDate,
                    amount: totalAmount,
                    paidAmount: 0,
                    balance: totalAmount,
                    status: "PENDING",
                    items: {
                        create: items.map((item) => ({
                            description: item.description,
                            type: item.type,
                            amount: item.amount,
                        })),
                    },
                },
            });

            created++;
        }

        return NextResponse.json({
            ok: true,
            created,
            skipped,
            totalLeases: leases.length,
        });
    } catch (error) {
        console.error("Generate invoices error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while generating invoices" },
            { status: 500 }
        );
    }
}