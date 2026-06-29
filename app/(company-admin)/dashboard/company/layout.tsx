import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import CompanyMobileMenu, { SidebarContent } from "./CompanyMobileMenu";
import { getActiveCompany } from "@/lib/get-active-company";
import { getCompanySubscription } from "@/lib/get-company-subscription";
import { prisma } from "@/lib/prisma";

export default async function CompanyDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const { user, companyId, isSuperAdmin } = await getActiveCompany();
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
    });

    const subscription = await getCompanySubscription(companyId);

    if (subscription.isExpired) {
        return (
            <div className="min-h-screen bg-[#f4f6fb] p-6">
                <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-black text-slate-950">
                        Subscription Expired
                    </h1>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                        {company?.name || "This company"} subscription has expired.
                        Please contact Super Admin to renew access.
                    </p>

                    {isSuperAdmin ? (
                        <Link
                            href="/dashboard/subscriptions"
                            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                        >
                            Renew Subscription
                        </Link>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-900 md:flex">
            <aside className="sticky top-0 z-20 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-5 shadow-sm md:block">
                <SidebarContent role={user.role} />
            </aside>

            <section className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CompanyMobileMenu role={user.role} />

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                    Company Workspace
                                </p>
                                <h1 className="text-lg font-black text-slate-900">
                                    {company?.name || "Rental Management System"}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white sm:block">
                                {isSuperAdmin ? "Super Admin" : "Company Admin"}
                            </div>

                            <div className="hidden border-slate-200 sm:block">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </header>

                {children}
            </section>
        </div>
    );
}