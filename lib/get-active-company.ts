import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

const companyRoles = [
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.ACCOUNTANT,
    Roles.CARETAKER,
    Roles.VIEWER,
];

export async function getActiveCompany() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (companyRoles.includes(user.role as any)) {
        if (!user.companyId) redirect("/login");

        return {
            user,
            companyId: user.companyId,
            isSuperAdmin: false,
        };
    }

    if (user.role === Roles.SUPER_ADMIN) {
        const selectedCompany = await prisma.superAdminCompanyContext.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
        });

        if (!selectedCompany) {
            redirect("/dashboard");
        }

        return {
            user,
            companyId: selectedCompany.companyId,
            isSuperAdmin: true,
        };
    }

    redirect("/login");
}