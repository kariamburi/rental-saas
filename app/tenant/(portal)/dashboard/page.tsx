import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DoorOpen, FileText, Home, Phone, Wallet } from "lucide-react";

import AddTenantMaintenanceModal from "./AddTenantMaintenanceModal";

export default async function TenantDashboardPage() {
    const cookieStore = await cookies();

    const tenantId = cookieStore.get("tenant_id")?.value;
    const companyId = cookieStore.get("tenant_company_id")?.value;

    if (!tenantId || !companyId) redirect("/tenant/login");

    const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, companyId },
        include: {
            company: true,
            unit: { include: { property: true } },
            invoices: { orderBy: { createdAt: "desc" } },
            payments: {
                include: { invoice: true },
                orderBy: { createdAt: "desc" },
            },
            maintenanceRequests: { orderBy: { createdAt: "desc" } },
        },
    });

    if (!tenant) redirect("/tenant/login");

    const totalBilled = tenant.invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount),
        0
    );

    const totalPaid = tenant.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
    );

    const balance = tenant.invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance),
        0
    );

    return (

        <main className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300 md:text-sm">
                                Tenant Portal
                            </p>

                            <h1 className="mt-3 text-2xl font-black md:text-3xl">
                                Welcome, {tenant.name}
                            </h1>
                        </div>


                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300 md:text-sm">
                        <Info icon={Phone} text={tenant.phone} />
                        <Info icon={Home} text={tenant.company.name} />
                        <Info
                            icon={DoorOpen}
                            text={
                                tenant.unit
                                    ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}`
                                    : "No unit assigned"
                            }
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <AddTenantMaintenanceModal />

                    <Link
                        href="/tenant/lease-agreement"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-slate-800"
                    >
                        View Lease Agreement
                    </Link>
                    <Link
                        href="/tenant/profile"
                        className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg hover:bg-slate-50"
                    >
                        My Profile
                    </Link>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                    <MoneyCard title="Total Billed" value={totalBilled} />
                    <MoneyCard title="Total Paid" value={totalPaid} />
                    <MoneyCard title="Balance" value={balance} danger={balance > 0} />
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-black text-slate-950">Invoices</h2>
                            <p className="text-sm text-slate-500">
                                Your rent invoices and outstanding balances
                            </p>
                        </div>

                        <div>
                            <table className="w-full text-left text-[11px] md:text-xs">
                                <thead className="bg-slate-50 font-black uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-3 py-3">Invoice</th>
                                        <th className="px-3 py-3">Amount</th>
                                        <th className="px-3 py-3">Paid</th>
                                        <th className="px-3 py-3">Balance</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3">Print</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {tenant.invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center">
                                                <FileText size={28} className="mx-auto text-emerald-600" />
                                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                                    No invoices yet
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        tenant.invoices.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-3 font-black text-slate-900">
                                                    {invoice.invoiceNo}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-600">
                                                    KES {Number(invoice.amount).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-600">
                                                    KES {Number(invoice.paidAmount).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 font-black text-slate-900">
                                                    KES {Number(invoice.balance).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[10px] font-black ${statusStyle(
                                                            invoice.status
                                                        )}`}
                                                    >
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Link
                                                        href={`/tenant/invoices/${invoice.id}/print`}
                                                        target="_blank"
                                                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-600 hover:text-white"
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
                    </section>

                    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-black text-slate-950">Payments</h2>
                            <p className="text-sm text-slate-500">
                                Your recorded rent payments
                            </p>
                        </div>

                        <div>
                            <table className="w-full text-left text-[11px] md:text-xs">
                                <thead className="bg-slate-50 font-black uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-3 py-3">Invoice</th>
                                        <th className="px-3 py-3">Amount</th>
                                        <th className="px-3 py-3">Method</th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Receipt</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {tenant.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center">
                                                <Wallet size={28} className="mx-auto text-emerald-600" />
                                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                                    No payments yet
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        tenant.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-3 font-black text-slate-900">
                                                    {payment.invoice.invoiceNo}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-600">
                                                    KES {Number(payment.amount).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-600">
                                                    {payment.method}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-slate-600">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Link
                                                        href={`/tenant/receipts/${payment.id}`}
                                                        target="_blank"
                                                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                                    >
                                                        Receipt
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-black text-slate-950">
                            Maintenance Requests
                        </h2>
                        <p className="text-sm text-slate-500">
                            Issues you have reported to property management
                        </p>
                    </div>

                    <table className="w-full text-left text-[11px] md:text-xs">
                        <thead className="bg-slate-50 font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-3 py-3">Issue</th>
                                <th className="px-3 py-3">Description</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3">Date</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {tenant.maintenanceRequests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                                    >
                                        No maintenance requests yet
                                    </td>
                                </tr>
                            ) : (
                                tenant.maintenanceRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-3 font-black text-slate-900">
                                            {request.title}
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-slate-600">
                                            {request.description}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-black ${maintenanceStatusStyle(
                                                    request.status
                                                )}`}
                                            >
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-slate-600">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </main>
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
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2
                className={`mt-3 text-3xl font-black ${danger ? "text-red-700" : "text-slate-950"
                    }`}
            >
                KES {value.toLocaleString()}
            </h2>
        </div>
    );
}

function statusStyle(status: string) {
    if (status === "PAID") return "bg-emerald-50 text-emerald-700";
    if (status === "PARTIAL") return "bg-blue-50 text-blue-700";
    if (status === "OVERDUE") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
}

function maintenanceStatusStyle(status: string) {
    if (status === "OPEN") return "bg-amber-50 text-amber-700";
    if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-700";
    if (status === "RESOLVED") return "bg-emerald-50 text-emerald-700";
    if (status === "CLOSED") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-700";
}