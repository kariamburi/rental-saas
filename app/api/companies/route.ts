import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, email, phone, address } = await req.json();

        if (!name) {
            return NextResponse.json(
                { ok: false, error: "Company name is required" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    email: email || null,
                    phone: phone || null,
                    address: address || null,
                    status: "ACTIVE",
                },
            });

            const trialPlan = await tx.subscriptionPlan.upsert({
                where: { name: "Trial" },
                update: {},
                create: {
                    name: "Trial",
                    monthlyFee: 0,
                    propertyLimit: 1,
                    unitLimit: 20,
                    active: true,
                },
            });

            const subscription = await tx.companySubscription.create({
                data: {
                    companyId: company.id,
                    planId: trialPlan.id,
                    status: "TRIAL",
                    startsAt: new Date(),
                    expiresAt: addDays(new Date(), 30),
                },
            });

            return { company, subscription };
        });

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error("Create company error:", error);

        return NextResponse.json(
            { ok: false, error: "Server error while creating company" },
            { status: 500 }
        );
    }
}