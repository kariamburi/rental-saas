import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    CalendarDays,
    ChevronDown,
    DoorOpen,
    FileText,
    ListChecks,
    User,
    Wallet,
} from "lucide-react";
import GenerateInvoicesButton from "./GenerateInvoicesButton";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyInvoicesPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/invoices");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const invoices = await prisma.invoice.findMany({
        where: { companyId: companyId },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const activeLeases = await prisma.lease.findMany({
        where: {
            companyId: companyId,
            status: "ACTIVE",
        },
        include: {
            tenant: true,
            unit: true,
        },
        orderBy: {
            tenant: {
                name: "asc",
            },
        },
    });

    const tenants = activeLeases
        .filter((lease) => lease.tenant && lease.unit)
        .map((lease) => ({
            id: lease.tenant.id,
            name: lease.tenant.name,
            propertyId: lease.unit.propertyId,
            unitNumber: lease.unit.unitNumber,
        }));

    const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount || 0),
        0
    );

    const totalPaid = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.paidAmount || 0),
        0
    );

    const totalBalance = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance || 0),
        0
    );

    const pendingInvoices = invoices.filter(
        (invoice) => invoice.status === "PENDING"
    ).length;

    const paidInvoices = invoices.filter(
        (invoice) => invoice.status === "PAID"
    ).length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Rent Billing
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Generate monthly rent invoices and track tenant balances.
                        </p>
                    </div>
                </div>
            </div>

            <GenerateInvoicesButton properties={properties} tenants={tenants} />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SummaryCard title="Total Invoices" value={invoices.length} />
                <SummaryCard title="Pending" value={pendingInvoices} warning />
                <SummaryCard title="Paid" value={paidInvoices} success />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
                <SummaryCard
                    title="Total Billed"
                    value={`KES ${totalAmount.toLocaleString()}`}
                />
                <SummaryCard
                    title="Total Paid"
                    value={`KES ${totalPaid.toLocaleString()}`}
                    success
                />
                <SummaryCard
                    title="Outstanding Balance"
                    value={`KES ${totalBalance.toLocaleString()}`}
                    danger
                />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Invoice List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Invoices grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <FileText size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No invoices yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Generate monthly invoices from active leases.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyInvoices = invoices.filter(
                                    (invoice) => invoice.unit.property.id === property.id
                                );

                                const propertyPending = propertyInvoices.filter(
                                    (invoice) => invoice.status === "PENDING"
                                ).length;

                                const propertyPaid = propertyInvoices.filter(
                                    (invoice) => invoice.status === "PAID"
                                ).length;

                                const propertyBalance = propertyInvoices.reduce(
                                    (sum, invoice) => sum + Number(invoice.balance || 0),
                                    0
                                );

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                                        <DoorOpen size={17} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-950">
                                                            {property.name}
                                                        </h3>

                                                        <p className="text-xs font-semibold text-slate-500">
                                                            {propertyInvoices.length} invoice(s) •{" "}
                                                            {propertyPending} pending • {propertyPaid} paid
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
                                                        Balance: KES{" "}
                                                        {propertyBalance.toLocaleString()}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1100px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Invoice
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Items
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Type
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Amount
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Paid
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Balance
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Due Date
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Print
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyInvoices.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={11}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No invoices for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyInvoices.map((invoice) => (
                                                            <tr
                                                                key={invoice.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-900">
                                                                    {invoice.invoiceNo}
                                                                </td>

                                                                <td className="px-2 py-2">
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                                        <User size={13} />
                                                                        {invoice.tenant.name}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        Unit {invoice.unit.unitNumber}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <ListChecks size={13} />
                                                                        {invoice.items.length} item(s)
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${invoice.invoiceType === "UTILITY_ONLY"
                                                                            ? "bg-blue-50 text-blue-700"
                                                                            : "bg-emerald-50 text-emerald-700"
                                                                            }`}
                                                                    >
                                                                        {invoice.invoiceType === "UTILITY_ONLY" ? "BILLS ONLY" : "FULL"}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        invoice.amount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    KES{" "}
                                                                    {Number(
                                                                        invoice.paidAmount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-red-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Wallet size={13} />
                                                                        KES{" "}
                                                                        {Number(
                                                                            invoice.balance || 0
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            invoice.dueDate
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(
                                                                            invoice.status
                                                                        )}`}
                                                                    >
                                                                        {invoice.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <Link
                                                                        href={`/dashboard/company/invoices/${invoice.id}/print`}
                                                                        className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                    >
                                                                        Print
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

function statusStyle(status: string) {
    if (status === "PAID") return "bg-emerald-50 text-emerald-700";
    if (status === "PARTIAL") return "bg-blue-50 text-blue-700";
    if (status === "OVERDUE") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
}

function SummaryCard({
    title,
    value,
    danger,
    warning,
    success,
}: {
    title: string;
    value: number | string;
    danger?: boolean;
    warning?: boolean;
    success?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : warning
            ? "text-amber-700"
            : success
                ? "text-emerald-700"
                : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}