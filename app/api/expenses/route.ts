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
            propertyId,
            category,
            description,
            amount,
            expenseDate,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !propertyId || !category || !amount) {
            return NextResponse.json(
                { ok: false, error: "Property, category and amount are required" },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: { id: propertyId, companyId },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                companyId,
                propertyId,
                category,
                description: description || null,
                amount,
                expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
            },
        });

        return NextResponse.json({ ok: true, expense });
    } catch (error) {
        console.error("Create expense error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating expense" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
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
            expenseId,
            propertyId,
            category,
            description,
            amount,
            expenseDate,
        } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !expenseId || !propertyId || !category || !amount) {
            return NextResponse.json(
                { ok: false, error: "Expense, property, category and amount are required" },
                { status: 400 }
            );
        }

        const existingExpense = await prisma.expense.findFirst({
            where: { id: expenseId, companyId },
        });

        if (!existingExpense) {
            return NextResponse.json(
                { ok: false, error: "Expense not found" },
                { status: 404 }
            );
        }

        const property = await prisma.property.findFirst({
            where: { id: propertyId, companyId },
        });

        if (!property) {
            return NextResponse.json(
                { ok: false, error: "Invalid property selected" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                propertyId,
                category,
                description: description || null,
                amount,
                expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
            },
        });

        return NextResponse.json({ ok: true, expense });
    } catch (error) {
        console.error("Update expense error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while updating expense" },
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

        const { companyId: bodyCompanyId, expenseId } = await req.json();

        const companyId = resolveCompanyId(user, bodyCompanyId);

        if (!companyId || !expenseId) {
            return NextResponse.json(
                { ok: false, error: "Expense ID is required" },
                { status: 400 }
            );
        }

        const existingExpense = await prisma.expense.findFirst({
            where: { id: expenseId, companyId },
        });

        if (!existingExpense) {
            return NextResponse.json(
                { ok: false, error: "Expense not found" },
                { status: 404 }
            );
        }

        await prisma.expense.delete({
            where: { id: expenseId },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete expense error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while deleting expense" },
            { status: 500 }
        );
    }
}