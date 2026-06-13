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
            invoiceId,
            amount,
            method,
            reference,
            paymentDate,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !invoiceId || !amount || !method) {
            return NextResponse.json(
                { ok: false, error: "Invoice, amount and method are required" },
                { status: 400 }
            );
        }

        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                companyId,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { ok: false, error: "Invoice not found" },
                { status: 404 }
            );
        }

        const payAmount = Number(amount);
        const currentPaid = Number(invoice.paidAmount);
        const invoiceAmount = Number(invoice.amount);
        const currentBalance = Number(invoice.balance);

        if (payAmount <= 0) {
            return NextResponse.json(
                { ok: false, error: "Payment amount must be greater than zero" },
                { status: 400 }
            );
        }

        const newPaidAmount = currentPaid + payAmount;
        const newBalance = invoiceAmount - newPaidAmount;

        const newStatus =
            newBalance <= 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING";



        const payment = await prisma.$transaction(async (tx) => {
            const createdPayment = await tx.payment.create({
                data: {
                    companyId,
                    invoiceId,
                    tenantId: invoice.tenantId,
                    amount: payAmount,
                    method,
                    reference: reference || null,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    receivedBy: user.name || user.email,
                },
            });

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    balance: newBalance,
                    status: newStatus,
                },
            });

            return createdPayment;
        });

        return NextResponse.json({ ok: true, payment });
    } catch (error) {
        console.error("Create payment error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while recording payment" },
            { status: 500 }
        );
    }
}