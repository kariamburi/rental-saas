import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import {
    AlertTriangle,
    CalendarDays,
    ChevronDown,
    Download,
    Wallet,
} from "lucide-react";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function ArrearsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/arrears");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: companyId,
            balance: { gt: 0 },
        },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
        },
        orderBy: { dueDate: "asc" },
    });

    const totalArrears = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance || 0),
        0
    );

    const overdueInvoices = invoices.filter(
        (invoice) => getDaysOverdue(invoice.dueDate) > 0
    );

    return (
        <main className="p-6">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <p className="text-sm font-black text-slate-500">
                    Arrears Management
                </p>

                <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-950">
                            Outstanding Balances
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            Track unpaid rent invoices, overdue balances and tenant arrears.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Invoices With Balance" value={invoices.length} />
                <SummaryCard title="Overdue Invoices" value={overdueInvoices.length} />
                <SummaryCard
                    title="Total Arrears"
                    value={`KES ${totalArrears.toLocaleString()}`}
                />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Arrears List
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Arrears grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Wallet size={26} />
                            </div>
                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No arrears found
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                All invoices are fully paid.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyInvoices = invoices.filter(
                                    (invoice) => invoice.unit.property.id === property.id
                                );

                                const propertyTotalArrears = propertyInvoices.reduce(
                                    (sum, invoice) => sum + Number(invoice.balance || 0),
                                    0
                                );

                                const propertyOverdue = propertyInvoices.filter(
                                    (invoice) => getDaysOverdue(invoice.dueDate) > 0
                                );

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-red-50 p-2 text-red-600">
                                                        <AlertTriangle size={17} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-950">
                                                            {property.name}
                                                        </h3>
                                                        <p className="text-xs font-semibold text-slate-500">
                                                            {propertyInvoices.length} invoice(s) •{" "}
                                                            {propertyOverdue.length} overdue
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
                                                        Arrears: KES{" "}
                                                        {propertyTotalArrears.toLocaleString()}
                                                    </div>

                                                    <Link
                                                        href={`/dashboard/company/arrears/property/${property.id}/pdf`}
                                                        className="inline-flex items-center gap-1 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-black text-white transition hover:bg-black"
                                                    >
                                                        <Download size={14} />
                                                        PDF
                                                    </Link>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1050px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Phone
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Invoice
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
                                                            Days
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyInvoices.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={10}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No arrears for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyInvoices.map((invoice) => {
                                                            const daysOverdue = getDaysOverdue(
                                                                invoice.dueDate
                                                            );

                                                            return (
                                                                <tr
                                                                    key={invoice.id}
                                                                    className="border-b hover:bg-slate-50"
                                                                >
                                                                    <td className="px-2 py-2">
                                                                        <p className="font-semibold text-slate-900">
                                                                            {invoice.tenant.name}
                                                                        </p>
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                        {invoice.tenant.phone}
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                        Unit {invoice.unit.unitNumber}
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-900">
                                                                        {invoice.invoiceNo}
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                        KES{" "}
                                                                        {Number(
                                                                            invoice.amount
                                                                        ).toLocaleString()}
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                        KES{" "}
                                                                        {Number(
                                                                            invoice.paidAmount
                                                                        ).toLocaleString()}
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2 font-black text-red-700">
                                                                        KES{" "}
                                                                        {Number(
                                                                            invoice.balance
                                                                        ).toLocaleString()}
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
                                                                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${daysOverdue > 0
                                                                                ? "bg-red-50 text-red-700"
                                                                                : "bg-amber-50 text-amber-700"
                                                                                }`}
                                                                        >
                                                                            {daysOverdue > 0
                                                                                ? `${daysOverdue} day(s)`
                                                                                : "Not overdue"}
                                                                        </span>
                                                                    </td>

                                                                    <td className="whitespace-nowrap px-2 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Link
                                                                                href="/dashboard/company/payments"
                                                                                className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                            >
                                                                                Pay
                                                                            </Link>

                                                                            <Link
                                                                                href={`/dashboard/company/invoices/${invoice.id}/print`}
                                                                                className="rounded bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white"
                                                                            >
                                                                                Print
                                                                            </Link>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
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

function getDaysOverdue(dueDate: Date) {
    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = today.getTime() - due.getTime();

    if (diff <= 0) return 0;

    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: number | string;
}) {
    return (
        <div className="rounded-2xl bg-[#111111] p-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-white/65">{title}</p>
            <h2 className="mt-2 text-2xl font-black">{value}</h2>
        </div>
    );
}