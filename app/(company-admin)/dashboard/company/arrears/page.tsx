import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import {
    AlertTriangle,
    CalendarDays,
    ChevronDown,
    DoorOpen,
    FileText,
    Phone,
    User,
    Wallet,
} from "lucide-react";

export default async function ArrearsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN) {
        redirect("/dashboard");
    }

    if (!user.companyId) {
        redirect("/dashboard");
    }

    const properties = await prisma.property.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: "asc" },
    });

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: user.companyId,
            balance: {
                gt: 0,
            },
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
        (sum: number, invoice) => sum + Number(invoice.balance),
        0
    );

    const overdueInvoices = invoices.filter(
        (invoice) => new Date(invoice.dueDate) < new Date()
    );

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-950 via-slate-950 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
                    Arrears Management
                </p>
                <h1 className="mt-3 text-3xl font-black">Outstanding Balances</h1>
                <p className="mt-2 max-w-2xl text-slate-300">
                    Track unpaid rent invoices, overdue balances and tenant arrears.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Invoices With Balance" value={invoices.length} />
                <SummaryCard title="Overdue Invoices" value={overdueInvoices.length} />
                <SummaryCard
                    title="Total Arrears"
                    value={`KES ${totalArrears.toLocaleString()}`}
                />
            </div>

            <section className="mt-8">
                <div className="mb-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Arrears List
                    </h2>
                    <p className="text-sm text-slate-500">
                        Arrears grouped by property. Click a property to expand.
                    </p>
                </div>

                {invoices.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
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
                    <div className="space-y-4">
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
                                    className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                                >
                                    <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-slate-50">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-red-50 p-2 text-red-600">
                                                    <AlertTriangle size={18} />
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-black text-slate-950">
                                                        {property.name}
                                                    </h3>

                                                    <p className="text-sm font-semibold text-slate-500">
                                                        {propertyInvoices.length} invoice(s) •{" "}
                                                        {propertyOverdue.length} overdue
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                                                    Arrears: KES{" "}
                                                    {propertyTotalArrears.toLocaleString()}
                                                </div>

                                                <ChevronDown
                                                    size={20}
                                                    className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                />
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="overflow-x-auto border-t border-slate-100">
                                        <table className="w-full min-w-[1100px] text-left">
                                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                                <tr>
                                                    <th className="px-6 py-4">Tenant</th>
                                                    <th className="px-6 py-4">Phone</th>
                                                    <th className="px-6 py-4">Unit</th>
                                                    <th className="px-6 py-4">Invoice</th>
                                                    <th className="px-6 py-4">Amount</th>
                                                    <th className="px-6 py-4">Paid</th>
                                                    <th className="px-6 py-4">Balance</th>
                                                    <th className="px-6 py-4">Due Date</th>
                                                    <th className="px-6 py-4">Days Overdue</th>
                                                    <th className="px-6 py-4">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {propertyInvoices.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={10}
                                                            className="px-6 py-10 text-center text-sm font-bold text-slate-500"
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
                                                                className="transition hover:bg-slate-50"
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                        <User
                                                                            size={16}
                                                                            className="text-emerald-600"
                                                                        />
                                                                        {invoice.tenant.name}
                                                                    </div>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                        <Phone
                                                                            size={16}
                                                                            className="text-emerald-600"
                                                                        />
                                                                        {invoice.tenant.phone}
                                                                    </div>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                        <DoorOpen
                                                                            size={16}
                                                                            className="text-emerald-600"
                                                                        />
                                                                        Unit {invoice.unit.unitNumber}
                                                                    </div>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                                        <FileText
                                                                            size={16}
                                                                            className="text-emerald-600"
                                                                        />
                                                                        {invoice.invoiceNo}
                                                                    </div>
                                                                </td>

                                                                <td className="px-6 py-4 text-sm font-black text-slate-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        invoice.amount
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                                                    KES{" "}
                                                                    {Number(
                                                                        invoice.paidAmount
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="px-6 py-4 text-sm font-black text-red-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        invoice.balance
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                        <CalendarDays
                                                                            size={16}
                                                                            className="text-emerald-600"
                                                                        />
                                                                        {new Date(
                                                                            invoice.dueDate
                                                                        ).toLocaleDateString()}
                                                                    </div>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-xs font-black ${daysOverdue > 0
                                                                            ? "bg-red-50 text-red-700"
                                                                            : "bg-amber-50 text-amber-700"
                                                                            }`}
                                                                    >
                                                                        {daysOverdue > 0
                                                                            ? `${daysOverdue} day(s)`
                                                                            : "Not overdue"}
                                                                    </span>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <div className="flex gap-2">
                                                                        <Link
                                                                            href="/dashboard/company/payments"
                                                                            className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                        >
                                                                            Record Payment
                                                                        </Link>

                                                                        <Link
                                                                            href={`/dashboard/company/invoices/${invoice.id}/print`}
                                                                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
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
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}