
import { redirect } from "next/navigation";
import { getActiveCompany } from "@/lib/get-active-company";
import { canAccessCompanyRoute } from "@/lib/company-access-map";

export async function requireCompanyRouteAccess(path: string) {
    const { user, companyId, isSuperAdmin } = await getActiveCompany();

    if (isSuperAdmin) {
        return { user, companyId, isSuperAdmin };
    }

    if (!canAccessCompanyRoute(user.role, path)) {
        redirect("/dashboard/company");
    }

    return { user, companyId, isSuperAdmin };
}