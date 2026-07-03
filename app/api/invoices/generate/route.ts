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

    if (
        user.role === Roles.COMPANY_ADMIN ||
        user.role === Roles.MANAGER ||
        user.role === Roles.ACCOUNTANT
    ) {
        return user.companyId;
    }

    return null;
}
const invoiceGenerateRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.ACCOUNTANT,
];

function canGenerateInvoices(role: string) {
    return invoiceGenerateRoles.includes(role as any);
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
        if (!canGenerateInvoices(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }
        const {
            companyId: bodyCompanyId,
            year,
            month,
            propertyId,
            tenantId,
            utilitiesOnly = false,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !year || !month) {
            return NextResponse.json(
                { ok: false, error: "Company, year and month are required" },
                { status: 400 }
            );
        }

        const yearNumber = Number(year);
        const monthNumber = Number(month);

        if (!yearNumber || !monthNumber || monthNumber < 1 || monthNumber > 12) {
            return NextResponse.json(
                { ok: false, error: "Invalid year or month" },
                { status: 400 }
            );
        }

        const periodKey = `${yearNumber}-${String(monthNumber).padStart(2, "0")}`;
        const invoiceType = utilitiesOnly ? "UTILITY_ONLY" : "FULL";
        const invoiceNoPeriod = periodKey.replace("-", "");

        const leases = await prisma.lease.findMany({
            where: {
                companyId,
                status: "ACTIVE",
                ...(tenantId ? { tenantId } : {}),
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
        const invoices: any[] = [];

        const invoiceCount = await prisma.invoice.count({
            where: { companyId },
        });

        for (const lease of leases) {
            try {
                if (!lease.tenantId || !lease.unitId || !lease.tenant || !lease.unit) {
                    skipped++;
                    continue;
                }

                const existing = await prisma.invoice.findFirst({
                    where: {
                        companyId,
                        tenantId: lease.tenantId,
                        unitId: lease.unitId,
                        periodKey,
                        invoiceType,
                    },
                    include: {
                        items: true,
                    },
                });

                if (existing) {
                    invoices.push(existing);
                    skipped++;
                    continue;
                }

                const meterReadings = await prisma.meterReading.findMany({
                    where: {
                        companyId,
                        tenantId: lease.tenantId,
                        unitId: lease.unitId,
                        billingMonth: periodKey,
                    },
                    orderBy: {
                        type: "asc",
                    },
                });

                const items: {
                    description: string;
                    type: string;
                    amount: number;
                }[] = [];

                if (!utilitiesOnly) {
                    const previousInvoices = await prisma.invoice.findMany({
                        where: {
                            companyId,
                            tenantId: lease.tenantId,
                            unitId: lease.unitId,
                            periodKey: {
                                lt: periodKey,
                            },
                            balance: {
                                not: 0,
                            },
                        },
                        select: {
                            balance: true,
                        },
                    });

                    const previousBalance = previousInvoices.reduce(
                        (sum, invoice) => sum + toNumber(invoice.balance),
                        0
                    );

                    if (previousBalance > 0) {
                        items.push({
                            description: "Balance Brought Forward",
                            type: "ARREARS",
                            amount: previousBalance,
                        });
                    }

                    if (previousBalance < 0) {
                        items.push({
                            description: "Credit Brought Forward",
                            type: "CREDIT",
                            amount: previousBalance,
                        });
                    }

                    const monthlyRent = toNumber(lease.monthlyRent);

                    if (monthlyRent > 0) {
                        items.push({
                            description: "Monthly Rent",
                            type: "RENT",
                            amount: monthlyRent,
                        });
                    }

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
                }

                for (const reading of meterReadings) {
                    const readingAmount = toNumber(reading.amount);

                    if (readingAmount <= 0) continue;

                    items.push({
                        description:
                            reading.type === "WATER"
                                ? `Water Bill (${Number(
                                    reading.previousReading
                                ).toLocaleString()} → ${Number(
                                    reading.currentReading
                                ).toLocaleString()} @ KES ${Number(
                                    reading.ratePerUnit
                                ).toLocaleString()})`
                                : `Electricity Bill (${Number(
                                    reading.previousReading
                                ).toLocaleString()} → ${Number(
                                    reading.currentReading
                                ).toLocaleString()} @ KES ${Number(
                                    reading.ratePerUnit
                                ).toLocaleString()})`,
                        type: reading.type,
                        amount: readingAmount,
                    });
                }

                const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

                if (totalAmount <= 0 || items.length === 0) {
                    skipped++;
                    continue;
                }

                const invoiceNo =
                    invoiceType === "UTILITY_ONLY"
                        ? `UTIL-${invoiceNoPeriod}-${pad(invoiceCount + created + 1)}`
                        : `INV-${invoiceNoPeriod}-${pad(invoiceCount + created + 1)}`;

                const dueDate = new Date(
                    yearNumber,
                    monthNumber - 1,
                    lease.rentDueDay || 5
                );

                const invoice = await prisma.invoice.create({
                    data: {
                        companyId,
                        tenantId: lease.tenantId,
                        unitId: lease.unitId,
                        invoiceNo,
                        periodKey,
                        invoiceType,
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
                    include: {
                        items: true,
                    },
                });

                invoices.push(invoice);
                created++;
            } catch (error) {
                console.error("Skipping lease invoice error:", lease.id, error);
                skipped++;
            }
        }

        return NextResponse.json({
            ok: true,
            created,
            skipped,
            totalLeases: leases.length,
            invoice: invoices[0] || null,
            invoices,
        });
    } catch (error: any) {
        console.error("Generate invoices error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Server error while generating invoices",
            },
            { status: 500 }
        );
    }
}