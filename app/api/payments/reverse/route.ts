import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const paymentReverseRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.ACCOUNTANT,
];

function canReversePayments(role: string) {
    return paymentReverseRoles.includes(role as any);
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

function toNumber(value: unknown) {
    return Number(value || 0);
}

function resolveInvoiceStatus(amount: number, paidAmount: number) {
    const balance = amount - paidAmount;

    if (balance <= 0) return "PAID";
    if (paidAmount > 0) return "PARTIAL";
    return "PENDING";
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

        if (!canReversePayments(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const { companyId: bodyCompanyId, paymentId, reason } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !paymentId) {
            return NextResponse.json(
                { ok: false, error: "Payment ID is required" },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                companyId,
            },
            include: {
                invoice: true,
            },
        });

        if (!payment) {
            return NextResponse.json(
                { ok: false, error: "Payment not found" },
                { status: 404 }
            );
        }

        if (payment.status === "REVERSED") {
            return NextResponse.json(
                { ok: false, error: "Payment is already reversed" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "REVERSED",
                    reversedAt: new Date(),
                    reversedBy: user.name || user.email,
                    reverseReason: reason || "Payment reversed by admin",
                },
            });

            const activePayments = await tx.payment.findMany({
                where: {
                    invoiceId: payment.invoiceId,
                    companyId,
                    status: "ACTIVE",
                },
            });

            const paidAmount = activePayments.reduce(
                (sum, item) => sum + toNumber(item.amount),
                0
            );

            const invoiceAmount = toNumber(payment.invoice.amount);
            const balance = invoiceAmount - paidAmount;
            const status = resolveInvoiceStatus(invoiceAmount, paidAmount);

            const invoice = await tx.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                    paidAmount,
                    balance,
                    status,
                },
            });

            return invoice;
        });

        return NextResponse.json({
            ok: true,
            invoice: result,
        });
    } catch (error) {
        console.error("Reverse payment error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while reversing payment" },
            { status: 500 }
        );
    }
}