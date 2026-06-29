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
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyPaymentsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/payments");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const invoices = await prisma.invoice.findMany({
        where: { companyId: companyId },
        include: {
            tenant: true,
            unit: { include: { property: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.payment.findMany({
        where: { companyId: companyId },
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
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const activePayments = payments.filter((payment) => payment.status === "ACTIVE");
    const reversedPayments = payments.filter((payment) => payment.status !== "ACTIVE");

    const totalPaid = activePayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    const unpaidInvoices = invoices.filter(
        (invoice) => Number(invoice.balance || 0) > 0
    ).length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Rent Payments
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Record tenant payments and automatically update invoice balances.
                        </p>
                    </div>

                    <AddPaymentModal invoices={invoices} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Payments" value={payments.length} />
                <SummaryCard title="Active Payments" value={activePayments.length} success />
                <SummaryCard title="Reversed" value={reversedPayments.length} danger />
                <SummaryCard
                    title="Amount Collected"
                    value={`KES ${totalPaid.toLocaleString()}`}
                    success
                />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-1">
                <SummaryCard title="Unpaid Invoices" value={unpaidInvoices} danger />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Payment History
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Payments grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {payments.length === 0 ? (
                        <div className="px-6 py-12 text-center">
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
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyPayments = payments.filter(
                                    (payment) =>
                                        payment.invoice?.unit?.property?.id === property.id
                                );

                                const propertyActivePayments = propertyPayments.filter(
                                    (payment) => payment.status === "ACTIVE"
                                );

                                const propertyReversedPayments = propertyPayments.filter(
                                    (payment) => payment.status !== "ACTIVE"
                                );

                                const propertyTotalPaid = propertyActivePayments.reduce(
                                    (sum, payment) => sum + Number(payment.amount || 0),
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
                                                            {propertyPayments.length} payment(s) •{" "}
                                                            {propertyActivePayments.length} active •{" "}
                                                            {propertyReversedPayments.length} reversed
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Collected: KES{" "}
                                                        {propertyTotalPaid.toLocaleString()}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1150px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Invoice
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Amount
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Method
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Reference
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Payment Date
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Received By
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Receipt
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyPayments.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={10}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No payments for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyPayments.map((payment) => (
                                                            <tr
                                                                key={payment.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="px-2 py-2">
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                                        <User size={13} />
                                                                        {payment.tenant.name}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FileText size={13} />
                                                                        {payment.invoice.invoiceNo}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        payment.amount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                                        {payment.method}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    {payment.reference || "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            payment.paymentDate
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    {payment.receivedBy || "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <Link
                                                                        href={`/dashboard/company/payments/${payment.id}/receipt`}
                                                                        className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                    >
                                                                        Receipt
                                                                    </Link>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${payment.status === "ACTIVE"
                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                            : "bg-red-50 text-red-700"
                                                                            }`}
                                                                    >
                                                                        {payment.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    {payment.status === "ACTIVE" ? (
                                                                        <ReversePaymentButton
                                                                            paymentId={payment.id}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-[11px] font-bold text-slate-400">
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
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    danger,
    success,
}: {
    title: string;
    value: number | string;
    danger?: boolean;
    success?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
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