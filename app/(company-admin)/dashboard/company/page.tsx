import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveCompany } from "@/lib/get-active-company";
import {
    ArrowRight,
    DoorOpen,
    FileText,
    Home,
    Users,
    WalletCards,
    Wrench,
} from "lucide-react";
import type { ElementType } from "react";

export default async function CompanyDashboardPage() {
    const { user, companyId, isSuperAdmin } = await getActiveCompany();

    const [
        properties,
        units,
        vacantUnits,
        tenants,
        invoices,
        payments,
        maintenance,
    ] = await Promise.all([
        prisma.property.count({ where: { companyId } }),
        prisma.unit.count({ where: { companyId } }),
        prisma.unit.count({
            where: {
                companyId,
                status: "VACANT",
            },
        }),
        prisma.tenant.count({ where: { companyId } }),
        prisma.invoice.count({ where: { companyId } }),
        prisma.payment.count({ where: { companyId } }),
        prisma.maintenanceRequest.count({ where: { companyId } }),
    ]);

    const occupancyRate =
        units > 0 ? Math.round(((units - vacantUnits) / units) * 100) : 0;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Company Dashboard
                        </p>

                        <h2 className="mt-3 text-3xl font-black">
                            Welcome back, {user.name}
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Manage properties, units, tenants, leases, invoices, payments,
                            expenses and maintenance for your company.
                        </p>
                    </div>

                    {isSuperAdmin ? (
                        <Link
                            href="/dashboard"
                            className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-emerald-300 transition hover:bg-white/20"
                        >
                            Switch Company
                        </Link>
                    ) : (
                        <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                            <p className="text-sm font-semibold text-slate-300">
                                Workspace status
                            </p>
                            <p className="mt-1 text-xl font-black text-emerald-300">
                                Active
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Properties" value={properties} icon={Home} href="/dashboard/company/properties" />
                <Card title="Units" value={units} icon={DoorOpen} href="/dashboard/company/units" />
                <Card title="Vacant Units" value={vacantUnits} icon={DoorOpen} href="/dashboard/company/vacancies" success />
                <Card title="Tenants" value={tenants} icon={Users} href="/dashboard/company/tenants" />
                <Card title="Invoices" value={invoices} icon={FileText} href="/dashboard/company/invoices" />
                <Card title="Payments" value={payments} icon={WalletCards} href="/dashboard/company/payments" success />
                <Card title="Maintenance" value={maintenance} icon={Wrench} href="/dashboard/company/maintenance" warning />
                <Card title="Occupancy Rate" value={`${occupancyRate}%`} icon={Home} href="/dashboard/company/reports" success />
            </div>
        </main>
    );
}

function Card({
    title,
    value,
    icon: Icon,
    href,
    success,
    warning,
}: {
    title: string;
    value: number | string;
    icon: ElementType;
    href: string;
    success?: boolean;
    warning?: boolean;
}) {
    const valueClass = success
        ? "text-emerald-700"
        : warning
            ? "text-amber-700"
            : "text-slate-950";

    return (
        <Link
            href={href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-slate-50"
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={18} />
                </span>
            </div>

            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>

            <div className="mt-4 flex items-center gap-1 text-[12px] font-bold text-slate-500 transition group-hover:text-emerald-700">
                View details
                <ArrowRight size={13} />
            </div>
        </Link>
    );
}