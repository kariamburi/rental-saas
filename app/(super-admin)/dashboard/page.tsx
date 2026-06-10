import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    Building2,
    CreditCard,
    ShieldCheck,
    TrendingUp,
    Users,
} from "lucide-react";

export default async function DashboardPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    const [companies, users, properties, tenants] = await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.property.count(),
        prisma.tenant.count(),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Super Admin Dashboard
                        </p>

                        <h2 className="mt-3 text-3xl font-black">
                            Welcome back, {user.name}
                        </h2>

                        <p className="mt-2 max-w-2xl text-slate-300">
                            Manage registered companies, company admins, subscriptions,
                            SaaS settings and platform performance from one control center.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <p className="text-sm text-slate-300">Platform status</p>
                        <p className="mt-1 text-xl font-black text-emerald-300">
                            Active
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Card title="Companies" value={companies} icon={Building2} />
                <Card title="System Users" value={users} icon={Users} />
                <Card title="Properties" value={properties} icon={TrendingUp} />
                <Card title="Tenants" value={tenants} icon={ShieldCheck} />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-black text-slate-950">
                        Quick Actions
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Start SaaS setup from here.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Action label="Register Company" href="/dashboard/companies" />
                        <Action label="Add Company Admin" href="/dashboard/company-admins" />
                        <Action label="Manage Subscriptions" href="/dashboard/subscriptions" />
                        <Action label="SaaS Settings" href="/dashboard/settings" />
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CreditCard size={22} />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-950">
                                Subscription Overview
                            </h3>
                            <p className="text-sm text-slate-500">
                                Subscription billing module will appear here.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        Next: add company subscription status, active plans, expired
                        accounts and renewal reminders.
                    </div>
                </section>
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

function Action({ label, href }: { label: string; href: string }) {
    return (
        <a
            href={href}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
        >
            {label}
        </a>
    );
}