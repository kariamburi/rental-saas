import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DoorOpen, FileText, Phone, User, Wallet } from "lucide-react";

export default async function TenantStatementPage({
    params,
}: {
    params: Promise<{ id: string; tenantId: string }>;
}) {
    const { id, tenantId } = await params;

    const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, companyId: id },
        include: {
            unit: { include: { property: true } },
            invoices: { orderBy: { createdAt: "desc" } },
            payments: {
                include: { invoice: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!tenant) notFound();

    const totalBilled = tenant.invoices.reduce(
        (sum, i) => sum + Number(i.amount),
        0
    );

    const totalPaid = tenant.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
    );

    const balance = tenant.invoices.reduce(
        (sum, i) => sum + Number(i.balance),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Tenant Statement
                </p>
                <h1 className="mt-3 text-3xl font-black">{tenant.name}</h1>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                        <Phone size={16} className="text-emerald-300" />
                        {tenant.phone}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                        <DoorOpen size={16} className="text-emerald-300" />
                        {tenant.unit
                            ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}`
                            : "No unit"}
                    </span>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <MoneyCard title="Total Billed" value={totalBilled} />
                <MoneyCard title="Total Paid" value={totalPaid} />
                <MoneyCard title="Balance" value={balance} danger={balance > 0} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="text-lg font-black text-slate-950">Invoices</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Invoice</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Balance</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenant.invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="px-6 py-4 font-black">{invoice.invoiceNo}</td>
                                        <td className="px-6 py-4">
                                            KES {Number(invoice.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            KES {Number(invoice.balance).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">{invoice.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="text-lg font-black text-slate-950">Payments</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Invoice</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenant.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 font-black">
                                            {payment.invoice.invoiceNo}
                                        </td>
                                        <td className="px-6 py-4">
                                            KES {Number(payment.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">{payment.method}</td>
                                        <td className="px-6 py-4">
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
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
            <h2 className={`mt-4 text-3xl font-black ${danger ? "text-red-700" : "text-slate-950"}`}>
                KES {value.toLocaleString()}
            </h2>
        </div>
    );
}