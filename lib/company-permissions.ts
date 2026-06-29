import { redirect } from "next/navigation";
import { getActiveCompany } from "@/lib/get-active-company";
import { accessMap } from "@/lib/company-access-map";

export async function requireCompanyRouteAccess(path: string) {
    const { user, companyId, isSuperAdmin } = await getActiveCompany();

    if (isSuperAdmin) {
        return { user, companyId, isSuperAdmin };
    }

    const allowedRoles = accessMap[path] || accessMap["/dashboard/company"];

    if (!allowedRoles.includes(user.role)) {
        redirect("/dashboard/company");
    }

    return { user, companyId, isSuperAdmin };
}