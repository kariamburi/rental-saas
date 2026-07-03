import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const ownerPayoutWriteRoles = [
    Roles.SUPER_ADMIN,
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.ACCOUNTANT,
];

function canManageOwnerPayouts(role: string) {
    return ownerPayoutWriteRoles.includes(role as any);
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

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!canManageOwnerPayouts(user.role)) {
            return NextResponse.json(
                { ok: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const {
            companyId: bodyCompanyId,
            ownerId,
            amount,
            method,
            reference,
            payoutDate,
            notes,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !ownerId || !amount || !method) {
            return NextResponse.json(
                { ok: false, error: "Owner, amount and method are required" },
                { status: 400 }
            );
        }

        const owner = await prisma.owner.findFirst({
            where: {
                id: ownerId,
                companyId,
                status: "ACTIVE",
            },
        });

        if (!owner) {
            return NextResponse.json(
                { ok: false, error: "Owner not found" },
                { status: 404 }
            );
        }

        const payAmount = Number(amount);

        if (!Number.isFinite(payAmount) || payAmount <= 0) {
            return NextResponse.json(
                { ok: false, error: "Amount must be greater than zero" },
                { status: 400 }
            );
        }

        const payout = await prisma.ownerPayout.create({
            data: {
                companyId,
                ownerId,
                amount: payAmount,
                method,
                reference: reference || null,
                payoutDate: payoutDate ? new Date(payoutDate) : new Date(),
                notes: notes || null,
                paidBy: user.name || user.email,
            },
        });

        return NextResponse.json({ ok: true, payout });
    } catch (error) {
        console.error("Create owner payout error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while recording owner payout" },
            { status: 500 }
        );
    }
}