import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect, notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import AddOwnerPayoutModal from "../../AddOwnerPayoutModal";
import StatementDateFilter from "./StatementDateFilter";

export default async function OwnerStatementPage({
    params,
    searchParams,
}: {
    params: Promise<{ ownerId: string }>;
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const { ownerId } = await params;
    const { from, to } = await searchParams;

    const dateFilter =
        from || to
            ? {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            }
            : undefined;
    const owner = await prisma.owner.findFirst({
        where: {
            id: ownerId,
            companyId: user.companyId,
        },
        include: {
            company: true,
            properties: {
                include: {
                    property: true,
                },
            },
        },
    });

    if (!owner) notFound();

    const propertyIds = owner.properties.map((item) => item.propertyId);

    const [invoices, payments, expenses, payouts] = await Promise.all([
        prisma.invoice.findMany({
            where: {
                companyId: user.companyId,
                invoiceDate: dateFilter,
                unit: {
                    propertyId: { in: propertyIds },
                },
            },

            include: {
                unit: { include: { property: true } },
                tenant: true,
            },
        }),

        prisma.payment.findMany({
            where: {
                companyId: user.companyId,
                invoiceDate: dateFilter,
                invoice: {
                    unit: {
                        propertyId: { in: propertyIds },
                    },
                },
            },
            include: {
                invoice: {
                    include: {
                        unit: { include: { property: true } },
                    },
                },
                tenant: true,
            },
        }),

        prisma.expense.findMany({
            where: {
                companyId: user.companyId,
                invoiceDate: dateFilter,
                propertyId: { in: propertyIds },
            },
            include: {
                property: true,
            },
        }),
        prisma.ownerPayout.findMany({
            where: {
                companyId: user.companyId,
                ownerId: owner.id,
                invoiceDate: dateFilter,
            },
            orderBy: { payoutDate: "desc" },
        }),
    ]);

    const propertyPercentage = new Map(
        owner.properties.map((item) => [
            item.propertyId,
            Number(item.percentage) / 100,
        ])
    );

    const grossCollected = payments.reduce((sum, payment) => {
        const propertyId = payment.invoice.unit.propertyId;
        const share = propertyPercentage.get(propertyId) || 0;
        return sum + Number(payment.amount) * share;
    }, 0);

    const ownerExpenses = expenses.reduce((sum, expense) => {
        const share = propertyPercentage.get(expense.propertyId) || 0;
        return sum + Number(expense.amount) * share;
    }, 0);
    const ownerPayouts = payouts.reduce(
        (sum, payout) => sum + Number(payout.amount),
        0
    );
    const totalBilled = invoices.reduce((sum, invoice) => {
        const share = propertyPercentage.get(invoice.unit.propertyId) || 0;
        return sum + Number(invoice.amount) * share;
    }, 0);

    const outstanding = invoices.reduce((sum, invoice) => {
        const share = propertyPercentage.get(invoice.unit.propertyId) || 0;
        return sum + Number(invoice.balance) * share;
    }, 0);

    const netPayable = grossCollected - ownerExpenses - ownerPayouts;

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-6xl print:max-w-none">
                <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl print:rounded-none print:bg-white print:p-0 print:text-slate-950 print:shadow-none">
                    <div className="flex items-start justify-between border-b border-white/20 pb-6 print:border-slate-900">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300 print:text-emerald-700">
                                Owner Statement
                            </p>
                            <h1 className="mt-3 text-3xl font-black">{owner.name}</h1>
                            <p className="mt-2 text-slate-300 print:text-slate-600">
                                {owner.company.name} • {owner.phone}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 print:hidden">
                            <AddOwnerPayoutModal ownerId={owner.id} />
                            <PrintButton />
                        </div>
                    </div>
                </div>
                <StatementDateFilter />
                <div className="grid gap-5 md:grid-cols-5">
                    <SummaryCard title="Owner Billed" value={totalBilled} />
                    <SummaryCard title="Owner Collected" value={grossCollected} />
                    <SummaryCard title="Owner Expenses" value={ownerExpenses} danger />
                    <SummaryCard title="Owner Payouts" value={ownerPayouts} danger />
                    <SummaryCard
                        title="Net Payable"
                        value={netPayable}
                        danger={netPayable < 0}
                    />
                </div>

                <div className="mt-5">
                    <SummaryCard title="Outstanding Balance" value={outstanding} danger />
                </div>

                <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-black text-slate-950">
                        Linked Properties
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {owner.properties.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-slate-200 p-4"
                            >
                                <p className="font-black text-slate-950">
                                    {item.property.name}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Ownership: {Number(item.percentage)}%
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="text-lg font-black text-slate-950">
                            Recent Collections
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Owner Share</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {payments.map((payment) => {
                                    const propertyId = payment.invoice.unit.propertyId;
                                    const share = propertyPercentage.get(propertyId) || 0;

                                    return (
                                        <tr key={payment.id}>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                {payment.tenant.name}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600">
                                                {payment.invoice.unit.property.name}
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-700">
                                                KES {Number(payment.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-black text-emerald-700">
                                                KES{" "}
                                                {(Number(payment.amount) * share).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </section>
                <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm print:shadow-none">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="text-lg font-black text-slate-950">
                            Owner Payout History
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Paid By</th>
                                    <th className="px-6 py-4">Receipt</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm font-semibold text-slate-500">
                                            No payouts recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    payouts.map((payout) => (
                                        <tr key={payout.id}>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                                {new Date(payout.payoutDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-black text-red-700">
                                                KES {Number(payout.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600">
                                                {payout.method}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600">
                                                {payout.reference || "-"}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600">
                                                {payout.paidBy || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/dashboard/company/owners/payouts/${payout.id}/receipt`}
                                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                >
                                                    Receipt
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm print:shadow-none">
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="font-black text-slate-700">Prepared By</p>
                            <div className="mt-10 border-t border-slate-400 pt-2 text-slate-500">
                                Signature
                            </div>
                        </div>

                        <div>
                            <p className="font-black text-slate-700">Owner Signature</p>
                            <div className="mt-10 border-t border-slate-400 pt-2 text-slate-500">
                                Signature
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-xs font-semibold text-slate-400">
                        Powered by Craft Inventors
                    </p>
                </div>
            </div>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    danger,
}: {
    title: string;
    value: number;
    danger?: boolean;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
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