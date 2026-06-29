"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveCompany } from "@/lib/get-active-company";
import { Roles, companyStaffRoles } from "@/lib/roles";

export async function createCompanyStaffUser(formData: FormData) {
    const { user, companyId, isSuperAdmin } = await getActiveCompany();

    if (
        !isSuperAdmin &&
        user.role !== Roles.COMPANY_ADMIN &&
        user.role !== Roles.MANAGER
    ) {
        throw new Error("You are not allowed to create users.");
    }

    const selectedCompanyId = String(formData.get("companyId") || companyId);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "");

    if (!name || !email || !password || !role) {
        throw new Error("All fields are required.");
    }

    if (!companyStaffRoles.includes(role as any)) {
        throw new Error("Invalid role selected.");
    }

    if (!isSuperAdmin && selectedCompanyId !== companyId) {
        throw new Error("You can only add users to your own company.");
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
            companyId: selectedCompanyId,
            name,
            email,
            password: hashedPassword,
            role,
            status: "ACTIVE",
        },
    });

    revalidatePath("/dashboard/company/users");
}