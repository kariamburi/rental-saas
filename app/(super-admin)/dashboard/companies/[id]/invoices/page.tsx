import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CalendarDays, DoorOpen, FileText, ListChecks, User, Wallet } from "lucide-react";
import GenerateInvoicesButton from "./GenerateInvoicesButton";
import Link from "next/link";

export default async function CompanyInvoicesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
    });

    if (!company) notFound();

    const invoices = await prisma.invoice.findMany({
        where: { companyId: id },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Rent Billing
                    </p>
                    <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                    <p className="mt-2 max-w-2xl text-slate-300">
                        Generate monthly rent invoices and track tenant balances.
                    </p>
                </div>
            </div>

            <GenerateInvoicesButton companyId={company.id} />

            <div className="mt-8 grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Invoices" value={invoices.length} />
                <SummaryCard
                    title="Pending"
                    value={invoices.filter((i) => i.status === "PENDING").length}
                />
                <SummaryCard
                    title="Paid"
                    value={invoices.filter((i) => i.status === "PAID").length}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Invoice List</h2>
                    <p className="text-sm text-slate-500">
                        Monthly rent invoices generated from active leases
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Paid</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Print</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <FileText size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No invoices yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Generate monthly invoices from active leases.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4 font-black text-slate-950">
                                            {invoice.invoiceNo}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <User size={16} className="text-emerald-600" />
                                                {invoice.tenant.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {invoice.unit.property.name} - Unit{" "}
                                                {invoice.unit.unitNumber}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <ListChecks size={16} className="text-emerald-600" />
                                                {invoice.items.length} item(s)
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-black text-slate-700">
                                            KES {Number(invoice.amount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            KES {Number(invoice.paidAmount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(invoice.balance).toLocaleString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle(
                                                    invoice.status
                                                )}`}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/companies/${id}/invoices/${invoice.id}/print`}
                                                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
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
            </div>
        </main>
    );
}

function statusStyle(status: string) {
    if (status === "PAID") return "bg-emerald-50 text-emerald-700";
    if (status === "PARTIAL") return "bg-blue-50 text-blue-700";
    if (status === "OVERDUE") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
}

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}