import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Building2,
    DoorOpen,
    FileText,
    Home,
    Mail,
    MapPin,
    Phone,
    Users,
    WalletCards,
} from "lucide-react";
import Link from "next/link";

export default async function CompanyDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
    });

    if (!company) notFound();

    const [properties, units, tenants, invoices, payments] = await Promise.all([
        prisma.property.count({ where: { companyId: id } }),
        prisma.unit.count({ where: { companyId: id } }),
        prisma.tenant.count({ where: { companyId: id } }),
        prisma.invoice.count({ where: { companyId: id } }),
        prisma.payment.count({ where: { companyId: id } }),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Company Workspace
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                            <Info icon={Mail} text={company.email || "No email"} />
                            <Info icon={Phone} text={company.phone || "No phone"} />
                            <Info icon={MapPin} text={company.address || "No address"} />
                        </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-300">
                        {company.status}
                    </span>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
                <Card title="Properties" value={properties} icon={Home} />
                <Card title="Units" value={units} icon={DoorOpen} />
                <Card title="Tenants" value={tenants} icon={Users} />
                <Card title="Invoices" value={invoices} icon={FileText} />
                <Card title="Payments" value={payments} icon={WalletCards} />
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Company Modules</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Manage this client’s properties, units, tenants, billing and payments.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Module
                        href={`/dashboard/companies/${company.id}/properties`}
                        title="Properties"
                        desc="Add rental buildings"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/units`}
                        title="Units"
                        desc="Manage rooms and houses"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/tenants`}
                        title="Tenants"
                        desc="Register tenant records"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/leases`}
                        title="Leases"
                        desc="Manage tenant lease agreements"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/meter-readings`}
                        title="Meter Readings"
                        desc="Record water and electricity usage"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/invoices`}
                        title="Invoices"
                        desc="Generate monthly rent"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/payments`}
                        title="Payments"
                        desc="Record rent payments"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/expenses`}
                        title="Expenses"
                        desc="Track property costs"
                    />

                    <Module
                        href={`/dashboard/companies/${company.id}/maintenance`}
                        title="Maintenance"
                        desc="Track repairs and tenant issues"
                    />
                    <Module
                        href={`/dashboard/companies/${company.id}/reports`}
                        title="Reports"
                        desc="View rent performance"
                    />
                </div>
            </div>
        </main>
    );
}
function Module({
    title,
    desc,
    href,
}: {
    title: string;
    desc: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
        >
            <h3 className="font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>
        </Link>
    );
}
function Info({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <Icon size={16} className="text-emerald-300" />
            {text}
        </span>
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
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon size={20} />
                </span>
            </div>
            <h2 className="mt-4 text-4xl font-black text-slate-950">{value}</h2>
        </div>
    );
}
