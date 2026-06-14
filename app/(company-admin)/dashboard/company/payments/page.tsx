import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    CalendarDays,
    ChevronDown,
    DoorOpen,
    FileText,
    User,
    WalletCards,
} from "lucide-react";
import AddPaymentModal from "./AddPaymentModal";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import ReversePaymentButton from "./ReversePaymentButton";

export default async function CompanyPaymentsPage() {
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

    const invoices = await prisma.invoice.findMany({
        where: { companyId: user.companyId },
        include: {
            tenant: true,
            unit: { include: { property: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.payment.findMany({
        where: { companyId: user.companyId },
        include: {
            tenant: true,
            invoice: {
                include: {
                    unit: {
                        include: {
                            property: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const properties = await prisma.property.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: "asc" },
    });

    const totalPaid = payments
        .filter((p) => p.status === "ACTIVE")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Rent Payments
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Record tenant payments and automatically update invoice balances.
                        </p>
                    </div>

                    <AddPaymentModal invoices={invoices} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Payments" value={payments.length} />
                <SummaryCard
                    title="Amount Collected"
                    value={`KES ${totalPaid.toLocaleString()}`}
                />
                <SummaryCard
                    title="Unpaid Invoices"
                    value={invoices.filter((i) => Number(i.balance) > 0).length}
                />
            </div>

            <div className="mt-8">
                <div className="mb-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Payment History
                    </h2>
                    <p className="text-sm text-slate-500">
                        Payments grouped by property. Click a property to expand.
                    </p>
                </div>

                {payments.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <WalletCards size={26} />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-slate-950">
                            No payments yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Record rent payments from pending invoices.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {properties.map((property) => {
                            const propertyPayments = payments.filter(
                                (payment) =>
                                    payment.invoice?.unit?.property?.id === property.id
                            );

                            const activePayments = propertyPayments.filter(
                                (payment) => payment.status === "ACTIVE"
                            );

                            const reversedPayments = propertyPayments.filter(
                                (payment) => payment.status !== "ACTIVE"
                            );

                            const propertyTotalPaid = activePayments.reduce(
                                (sum, payment) => sum + Number(payment.amount || 0),
                                0
                            );

                            return (
                                <details
                                    key={property.id}
                                    className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                                >
                                    <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-slate-50">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                                    <DoorOpen size={18} />
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-black text-slate-950">
                                                        {property.name}
                                                    </h3>

                                                    <p className="text-sm font-semibold text-slate-500">
                                                        {propertyPayments.length} payment(s) •{" "}
                                                        {activePayments.length} active •{" "}
                                                        {reversedPayments.length} reversed
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                                                    Collected: KES{" "}
                                                    {propertyTotalPaid.toLocaleString()}
                                                </div>

                                                <ChevronDown
                                                    size={20}
                                                    className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                />
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="overflow-x-auto border-t border-slate-100">
                                        <table className="w-full min-w-[1000px] text-left">
                                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                                <tr>
                                                    <th className="px-6 py-4">Tenant</th>
                                                    <th className="px-6 py-4">Invoice</th>
                                                    <th className="px-6 py-4">Amount</th>
                                                    <th className="px-6 py-4">Method</th>
                                                    <th className="px-6 py-4">Reference</th>
                                                    <th className="px-6 py-4">Payment Date</th>
                                                    <th className="px-6 py-4">Received By</th>
                                                    <th className="px-6 py-4">Receipt</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {propertyPayments.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={10}
                                                            className="px-6 py-10 text-center text-sm font-bold text-slate-500"
                                                        >
                                                            No payments for this property.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    propertyPayments.map((payment) => (
                                                        <tr
                                                            key={payment.id}
                                                            className="transition hover:bg-slate-50"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                    <User
                                                                        size={16}
                                                                        className="text-emerald-600"
                                                                    />
                                                                    {payment.tenant.name}
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                                    <FileText
                                                                        size={16}
                                                                        className="text-emerald-600"
                                                                    />
                                                                    {payment.invoice.invoiceNo}
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4 text-sm font-black text-slate-700">
                                                                KES{" "}
                                                                {Number(payment.amount).toLocaleString()}
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                                    {payment.method}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                                {payment.reference || "-"}
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                    <CalendarDays
                                                                        size={16}
                                                                        className="text-emerald-600"
                                                                    />
                                                                    {new Date(
                                                                        payment.paymentDate
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                                {payment.receivedBy || "-"}
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <Link
                                                                    href={`/dashboard/company/payments/${payment.id}/receipt`}
                                                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                >
                                                                    View Receipt
                                                                </Link>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-xs font-black ${payment.status === "ACTIVE"
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : "bg-red-50 text-red-700"
                                                                        }`}
                                                                >
                                                                    {payment.status}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                {payment.status === "ACTIVE" ? (
                                                                    <ReversePaymentButton
                                                                        paymentId={payment.id}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-slate-400">
                                                                        Reversed
                                                                    </span>
                                                                )}
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
        </main>
    );
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
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}