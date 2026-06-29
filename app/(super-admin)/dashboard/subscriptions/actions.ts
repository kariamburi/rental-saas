"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function saveSubscriptionPlan(formData: FormData) {
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const monthlyFee = Number(formData.get("monthlyFee") || 0);
    const propertyLimitRaw = String(formData.get("propertyLimit") || "");
    const unitLimitRaw = String(formData.get("unitLimit") || "");
    const active = String(formData.get("active") || "true") === "true";

    if (!name) throw new Error("Plan name is required.");

    const data = {
        name,
        monthlyFee,
        propertyLimit: propertyLimitRaw ? Number(propertyLimitRaw) : null,
        unitLimit: unitLimitRaw ? Number(unitLimitRaw) : null,
        active,
    };

    if (id) {
        await prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    } else {
        await prisma.subscriptionPlan.create({ data });
    }

    revalidatePath("/dashboard/subscriptions");
}

export async function deleteSubscriptionPlan(planId: string) {
    const linkedSubscriptions = await prisma.companySubscription.count({
        where: { planId },
    });

    if (linkedSubscriptions > 0) {
        throw new Error("This plan is already assigned to companies. Disable it instead.");
    }

    await prisma.subscriptionPlan.delete({
        where: { id: planId },
    });

    revalidatePath("/dashboard/subscriptions");
}
function addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

export async function assignOrRenewSubscription(formData: FormData) {
    const companyId = String(formData.get("companyId") || "");
    const planId = String(formData.get("planId") || "");
    const months = Number(formData.get("months") || 1);
    const method = String(formData.get("method") || "MANUAL");
    const reference = String(formData.get("reference") || "");

    if (!companyId || !planId) {
        throw new Error("Company and plan are required.");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        throw new Error("Plan not found.");
    }

    const existing = await prisma.companySubscription.findFirst({
        where: { companyId },
        orderBy: { expiresAt: "desc" },
    });

    const startDate =
        existing && existing.expiresAt > new Date()
            ? existing.expiresAt
            : new Date();

    const expiresAt = addMonths(startDate, months);
    const amount = Number(plan.monthlyFee) * months;

    const subscription = await prisma.companySubscription.upsert({
        where: {
            id: existing?.id || "new-subscription",
        },
        update: {
            planId,
            status: "ACTIVE",
            expiresAt,
        },
        create: {
            companyId,
            planId,
            status: "ACTIVE",
            startsAt: new Date(),
            expiresAt,
        },
    });

    await prisma.subscriptionPayment.create({
        data: {
            subscriptionId: subscription.id,
            companyId,
            amount,
            method,
            reference: reference || null,
        },
    });

    revalidatePath("/dashboard/subscriptions");
}