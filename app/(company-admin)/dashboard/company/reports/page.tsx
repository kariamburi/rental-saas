import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    DoorOpen,
    FileText,
    Home,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export default async function CompanyReportsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN) {
        redirect("/dashboard");
    }

    if (!user.companyId) {
        redirect("/dashboard");
    }

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
    });

    if (!company) redirect("/dashboard");

    const [units, tenants, invoices, payments, properties, expenses] =
        await Promise.all([
            prisma.unit.findMany({ where: { companyId: user.companyId } }),
            prisma.tenant.findMany({ where: { companyId: user.companyId } }),
            prisma.invoice.findMany({ where: { companyId: user.companyId } }),
            prisma.payment.findMany({ where: { companyId: user.companyId } }),
            prisma.property.findMany({
                where: { companyId: user.companyId },
                include: { units: true },
            }),
            prisma.expense.findMany({ where: { companyId: user.companyId } }),
        ]);

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalArrears = invoices.reduce((sum, i) => sum + Number(i.balance), 0);
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
    const vacantUnits = units.filter((u) => u.status === "VACANT").length;
    const occupancyRate =
        units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netIncome = totalCollected - totalExpenses;

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Reports
                </p>
                <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                <p className="mt-2 max-w-2xl text-slate-300">
                    View rent collection, arrears, occupancy and property performance.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
                <Card title="Properties" value={properties.length} icon={Home} />
                <Card title="Units" value={units.length} icon={DoorOpen} />
                <Card title="Tenants" value={tenants.length} icon={Users} />
                <Card title="Occupancy" value={`${occupancyRate}%`} icon={TrendingUp} />
                <Card title="Invoices" value={invoices.length} icon={FileText} />
                <Card title="Vacant" value={vacantUnits} icon={DoorOpen} />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-4">
                <MoneyCard title="Total Invoiced" value={totalInvoiced} />
                <MoneyCard title="Total Collected" value={totalCollected} />
                <MoneyCard title="Total Expenses" value={totalExpenses} danger />
                <MoneyCard
                    title="Net Income"
                    value={netIncome}
                    danger={netIncome < 0}
                />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-1">
                <MoneyCard title="Outstanding Arrears" value={totalArrears} danger />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Property Performance
                    </h2>
                    <p className="text-sm text-slate-500">
                        Unit count and occupancy status per property
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Total Units</th>
                                <th className="px-6 py-4">Occupied</th>
                                <th className="px-6 py-4">Vacant</th>
                                <th className="px-6 py-4">Maintenance</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {properties.map((property) => (
                                <tr key={property.id} className="transition hover:bg-slate-50">
                                    <td className="px-6 py-4 font-black text-slate-950">
                                        {property.name}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-600">
                                        {property.units.length}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-emerald-700">
                                        {
                                            property.units.filter(
                                                (u) => u.status === "OCCUPIED"
                                            ).length
                                        }
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-blue-700">
                                        {
                                            property.units.filter(
                                                (u) => u.status === "VACANT"
                                            ).length
                                        }
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-amber-700">
                                        {
                                            property.units.filter(
                                                (u) => u.status === "MAINTENANCE"
                                            ).length
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
    value: number | string;
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
            <h2 className="mt-4 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}

function MoneyCard({
    title,
    value,
    danger,
}: {
    title: string;
    value: number;
    danger?: boolean;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <Wallet
                    size={22}
                    className={danger ? "text-red-600" : "text-emerald-600"}
                />
            </div>
            <h2
                className={`mt-4 text-3xl font-black ${danger ? "text-red-700" : "text-slate-950"
                    }`}
            >
                KES {value.toLocaleString()}
            </h2>
        </div>
    );
}