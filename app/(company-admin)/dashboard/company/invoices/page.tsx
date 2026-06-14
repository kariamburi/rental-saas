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

export default async function CompanyInvoicesPage() {
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
            unit: {
                include: { property: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const properties = await prisma.property.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: "asc" },
    });

    const activeLeases = await prisma.lease.findMany({
        where: {
            companyId: user.companyId,
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

            <GenerateInvoicesButton properties={properties} tenants={tenants} />

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

            <div className="mt-8">
                <div className="mb-5">
                    <h2 className="text-lg font-black text-slate-950">Invoice List</h2>
                    <p className="text-sm text-slate-500">
                        Invoices grouped by property. Click a property to expand.
                    </p>
                </div>

                {invoices.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
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
                    <div className="space-y-4">
                        {properties.map((property) => {
                            const propertyInvoices = invoices.filter(
                                (invoice) => invoice.unit.property.id === property.id
                            );

                            const pending = propertyInvoices.filter(
                                (invoice) => invoice.status === "PENDING"
                            ).length;

                            const paid = propertyInvoices.filter(
                                (invoice) => invoice.status === "PAID"
                            ).length;

                            const totalBalance = propertyInvoices.reduce(
                                (sum, invoice) => sum + Number(invoice.balance || 0),
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
                                                        {propertyInvoices.length} invoice(s) • {pending} pending • {paid} paid
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                                                    Balance: KES {totalBalance.toLocaleString()}
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
                                                {propertyInvoices.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={10}
                                                            className="px-6 py-10 text-center text-sm font-bold text-slate-500"
                                                        >
                                                            No invoices for this property.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    propertyInvoices.map((invoice) => (
                                                        <tr
                                                            key={invoice.id}
                                                            className="transition hover:bg-slate-50"
                                                        >
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
                                                                    Unit {invoice.unit.unitNumber}
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
                                                                    href={`/dashboard/company/invoices/${invoice.id}/print`}
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
                                </details>
                            );
                        })}
                    </div>
                )}
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