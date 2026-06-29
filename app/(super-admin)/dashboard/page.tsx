import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import {
    ArrowRight,
    Building2,
    Gauge,
    ShieldCheck,
    Users,
} from "lucide-react";

export default async function SuperAdminDashboardPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");
    if (user.role !== Roles.SUPER_ADMIN) redirect("/dashboard/company");

    const [companies, activeCompanies, users] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({
            where: { status: "ACTIVE" },
        }),
        prisma.user.count(),
    ]);

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Super Admin Dashboard
                        </p>

                        <h1 className="mt-3 text-3xl font-black">
                            Welcome back, {user.name}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Manage companies, users, and switch into company workspaces.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/switch-company"
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-white/20"
                    >
                        Switch Company
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card title="Total Companies" value={companies} icon={Building2} />
                <Card
                    title="Active Companies"
                    value={activeCompanies}
                    icon={ShieldCheck}
                    success
                />
                <Card title="System Users" value={users} icon={Users} />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 border-b border-slate-200 pb-4">
                        <h2 className="text-xl font-black text-slate-950">
                            Quick Actions
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Start by choosing a company workspace.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Link
                            href="/dashboard/switch-company"
                            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-white">
                                    <Gauge size={20} />
                                </span>

                                <div>
                                    <p className="font-black text-slate-950">
                                        Switch Company
                                    </p>
                                    <p className="text-sm font-semibold text-slate-500">
                                        Open a company dashboard.
                                    </p>
                                </div>
                            </div>
                        </Link>


                    </div>
                </div>
            </section>
        </main>
    );
}

function Card({
    title,
    value,
    icon: Icon,
    success,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    success?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={18} />
                </span>
            </div>

            <h2
                className={`mt-2 text-2xl font-black ${success ? "text-emerald-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}