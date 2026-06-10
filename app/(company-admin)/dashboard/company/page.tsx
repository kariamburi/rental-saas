import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    DoorOpen,
    FileText,
    Home,
    Users,
    WalletCards,
    Wrench,
} from "lucide-react";

export default async function CompanyDashboardPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    if (!user.companyId) {
        redirect("/dashboard");
    }

    const companyId = user.companyId;

    const [
        properties,
        units,
        vacantUnits,
        tenants,
        invoices,
        payments,
        maintenance,
    ] = await Promise.all([
        prisma.property.count({
            where: { companyId },
        }),

        prisma.unit.count({
            where: { property: { companyId } },
        }),

        prisma.unit.count({
            where: {
                property: { companyId },
                status: "VACANT",
            },
        }),

        prisma.tenant.count({
            where: { companyId },
        }),

        prisma.invoice.count({
            where: { companyId },
        }),

        prisma.payment.count({
            where: { companyId },
        }),

        prisma.maintenanceRequest.count({
            where: { companyId },
        }),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Company Dashboard
                        </p>

                        <h2 className="mt-3 text-3xl font-black">
                            Welcome back, {user.name}
                        </h2>

                        <p className="mt-2 max-w-2xl text-slate-300">
                            Manage properties, units, tenants, leases, invoices,
                            payments, expenses and maintenance for your company.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <p className="text-sm text-slate-300">Workspace status</p>
                        <p className="mt-1 text-xl font-black text-emerald-300">
                            Active
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Properties" value={properties} icon={Home} />
                <Card title="Units" value={units} icon={DoorOpen} />
                <Card title="Vacant Units" value={vacantUnits} icon={DoorOpen} />
                <Card title="Tenants" value={tenants} icon={Users} />
                <Card title="Invoices" value={invoices} icon={FileText} />
                <Card title="Payments" value={payments} icon={WalletCards} />
                <Card title="Maintenance" value={maintenance} icon={Wrench} />
            </div>
        </main>
    );
}

function Card({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <div className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>

                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={20} />
                </span>
            </div>

            <h2 className="mt-4 text-4xl font-black text-slate-950">{value}</h2>
        </div>
    );
}