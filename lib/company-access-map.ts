import { Roles } from "@/lib/roles";

export const accessMap: Record<string, string[]> = {
    "/dashboard/company": [
        Roles.COMPANY_ADMIN,
        Roles.MANAGER,
        Roles.ACCOUNTANT,
        Roles.CARETAKER,
        Roles.VIEWER,
    ],
    "/dashboard/company/properties": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.VIEWER],
    "/dashboard/company/owners": [Roles.COMPANY_ADMIN, Roles.MANAGER],
    "/dashboard/company/owner-payouts": [Roles.COMPANY_ADMIN, Roles.ACCOUNTANT],
    "/dashboard/company/units": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.CARETAKER, Roles.VIEWER],
    "/dashboard/company/vacancies": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.VIEWER],
    "/dashboard/company/bookings": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.VIEWER],
    "/dashboard/company/tenants": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.ACCOUNTANT, Roles.VIEWER],
    "/dashboard/company/leases": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.ACCOUNTANT],
    "/dashboard/company/meter-readings": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.CARETAKER],
    "/dashboard/company/invoices": [Roles.COMPANY_ADMIN, Roles.ACCOUNTANT],
    "/dashboard/company/payments": [Roles.COMPANY_ADMIN, Roles.ACCOUNTANT],
    "/dashboard/company/expenses": [Roles.COMPANY_ADMIN, Roles.ACCOUNTANT],
    "/dashboard/company/maintenance": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.CARETAKER],
    "/dashboard/company/inspections": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.CARETAKER],
    "/dashboard/company/reports": [Roles.COMPANY_ADMIN, Roles.MANAGER, Roles.ACCOUNTANT, Roles.VIEWER],
    "/dashboard/company/arrears": [Roles.COMPANY_ADMIN, Roles.ACCOUNTANT, Roles.MANAGER],
    "/dashboard/company/users": [Roles.COMPANY_ADMIN, Roles.MANAGER],
};

export function canAccessCompanyRoute(role: string, href: string) {
    if (role === Roles.SUPER_ADMIN) return true;

    const matchedPath =
        Object.keys(accessMap)
            .sort((a, b) => b.length - a.length)
            .find((path) => href === path || href.startsWith(`${path}/`)) ||
        "/dashboard/company";

    return (accessMap[matchedPath] || []).includes(role);
}