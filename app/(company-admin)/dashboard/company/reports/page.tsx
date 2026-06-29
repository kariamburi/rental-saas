import Link from "next/link";
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
import type { ElementType } from "react";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyReportsPage({
    searchParams,
}: {
    searchParams?: Promise<{ propertyId?: string }>;
}) {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/reports");

    const params = await searchParams;
    const selectedPropertyId = String(params?.propertyId || "");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        include: { units: true },
        orderBy: { name: "asc" },
    });

    const selectedProperty = selectedPropertyId
        ? properties.find((p) => p.id === selectedPropertyId)
        : null;

    const units = await prisma.unit.findMany({
        where: {
            companyId: companyId,
            ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
        },
    });

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: companyId,
            ...(selectedPropertyId
                ? {
                    unit: {
                        propertyId: selectedPropertyId,
                    },
                }
                : {}),
        },
        include: {
            tenant: true,
            unit: {
                include: {
                    property: true,
                },
            },
        },
    });

    const expenses = await prisma.expense.findMany({
        where: {
            companyId: companyId,
            ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
        },
    });

    const tenantsCount = selectedPropertyId
        ? new Set(invoices.map((invoice) => invoice.tenantId)).size
        : await prisma.tenant.count({
            where: { companyId: companyId },
        });

    const totalInvoiced = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount || 0),
        0
    );

    const totalCollected = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.paidAmount || 0),
        0
    );

    const totalArrears = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance || 0),
        0
    );

    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
    const vacantUnits = units.filter((u) => u.status === "VACANT").length;

    const occupancyRate =
        units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const netIncome = totalCollected - totalExpenses;

    const visibleProperties = selectedPropertyId
        ? properties.filter((p) => p.id === selectedPropertyId)
        : properties;

    return (
        <main className="p-6">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <p className="text-sm font-black text-slate-500">Reports</p>

                <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-950">
                            {selectedProperty ? selectedProperty.name : company.name}
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            View rent collection, arrears, occupancy and property performance.
                        </p>
                    </div>

                    <form action="/dashboard/company/reports" className="flex gap-2">
                        <select
                            name="propertyId"
                            defaultValue={selectedPropertyId}
                            className="h-10 min-w-[230px] rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                            <option value="">All Properties</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                        </select>

                        <button className="h-10 cursor-pointer rounded-md bg-[#111111] px-5 text-sm font-black text-white transition hover:bg-black">
                            Filter
                        </button>

                        <Link
                            href="/dashboard/company/reports"
                            className="flex h-10 items-center rounded-md border border-slate-300 px-5 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                        >
                            Reset
                        </Link>
                    </form>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Card title="Properties" value={selectedPropertyId ? 1 : properties.length} icon={Home} />
                <Card title="Units" value={units.length} icon={DoorOpen} />
                <Card title="Tenants" value={tenantsCount} icon={Users} />
                <Card title="Occupancy" value={`${occupancyRate}%`} icon={TrendingUp} />
                <Card title="Invoices" value={invoices.length} icon={FileText} />
                <Card title="Vacant" value={vacantUnits} icon={DoorOpen} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-5">
                <MoneyCard title="Total Invoiced" value={totalInvoiced} />
                <MoneyCard title="Total Collected" value={totalCollected} />
                <MoneyCard title="Total Expenses" value={totalExpenses} danger />
                <MoneyCard title="Net Income" value={netIncome} danger={netIncome < 0} />
                <MoneyCard title="Outstanding Arrears" value={totalArrears} danger />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Property Performance
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Unit count and occupancy status per property.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] border-collapse text-[12px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-900">
                                <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                    Property
                                </th>
                                <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                    Total Units
                                </th>
                                <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                    Occupied
                                </th>
                                <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                    Vacant
                                </th>
                                <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                    Maintenance
                                </th>
                                <th className="px-2 py-2 text-left font-bold">
                                    Occupancy
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {visibleProperties.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-8 text-center text-slate-500"
                                    >
                                        No properties found.
                                    </td>
                                </tr>
                            ) : (
                                visibleProperties.map((property) => {
                                    const totalUnits = property.units.length;
                                    const occupied = property.units.filter(
                                        (u) => u.status === "OCCUPIED"
                                    ).length;
                                    const vacant = property.units.filter(
                                        (u) => u.status === "VACANT"
                                    ).length;
                                    const maintenance = property.units.filter(
                                        (u) => u.status === "MAINTENANCE"
                                    ).length;

                                    const rate =
                                        totalUnits > 0
                                            ? Math.round((occupied / totalUnits) * 100)
                                            : 0;

                                    return (
                                        <tr
                                            key={property.id}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <td className="px-2 py-2 font-semibold text-slate-900">
                                                {property.name}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                {totalUnits}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 font-semibold text-emerald-700">
                                                {occupied}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 font-semibold text-blue-700">
                                                {vacant}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 font-semibold text-amber-700">
                                                {maintenance}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2">
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                    {rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
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
    icon: ElementType;
}) {
    return (
        <div className="rounded-2xl bg-[#111111] p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/65">{title}</p>
                <Icon size={20} className="text-white/70" />
            </div>
            <h2 className="mt-2 text-2xl font-black">{value}</h2>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <Wallet
                    size={20}
                    className={danger ? "text-red-600" : "text-emerald-600"}
                />
            </div>

            <h2
                className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"
                    }`}
            >
                KES {value.toLocaleString()}
            </h2>
        </div>
    );
}