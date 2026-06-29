"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export async function createCompanyUser(formData: FormData) {
    const authUser = await getAuthUser();

    if (!authUser || authUser.role !== Roles.SUPER_ADMIN) {
        throw new Error("Unauthorized");
    }

    const companyId = String(formData.get("companyId") || "");
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!companyId || !name || !email || !password) {
        throw new Error("All fields are required.");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) {
        throw new Error("Company not found.");
    }

    const existing = await prisma.user.findUnique({
        where: { email },
    });

    if (existing) {
        throw new Error("Email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            companyId,
            name,
            email,
            password: hashedPassword,
            role: Roles.COMPANY_ADMIN,
            status: "ACTIVE",
        },
    });

    revalidatePath(`/dashboard/companies/${companyId}`);
}