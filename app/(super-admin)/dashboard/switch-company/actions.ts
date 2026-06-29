"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";

export async function switchCompany(formData: FormData) {
    const user = await getAuthUser();

    if (!user) redirect("/login");
    if (user.role !== Roles.SUPER_ADMIN) redirect("/dashboard/company");

    const companyId = String(formData.get("companyId") || "");

    if (!companyId) redirect("/dashboard");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    if (!dbUser) redirect("/login");

    await prisma.superAdminCompanyContext.upsert({
        where: { userId: dbUser.id },
        update: { companyId },
        create: {
            userId: dbUser.id,
            companyId,
        },
    });

    redirect("/dashboard/company");
}