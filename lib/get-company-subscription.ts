import { prisma } from "@/lib/prisma";

export async function getCompanySubscription(companyId: string) {
    const subscription = await prisma.companySubscription.findFirst({
        where: { companyId },
        include: { plan: true },
        orderBy: { expiresAt: "desc" },
    });

    if (!subscription) {
        return {
            subscription: null,
            plan: null,
            isExpired: true,
            status: "NO_SUBSCRIPTION",
        };
    }

    const isExpired =
        subscription.status === "EXPIRED" || subscription.expiresAt < new Date();

    return {
        subscription,
        plan: subscription.plan,
        isExpired,
        status: isExpired ? "EXPIRED" : subscription.status,
    };
}