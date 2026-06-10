import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect, notFound } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, ReceiptText } from "lucide-react";
import LedgerDateFilter from "./LedgerDateFilter";
import PrintButton from "./PrintButton";

type LedgerItem = {
    date: Date;
    type: "COLLECTION" | "EXPENSE" | "PAYOUT";
    description: string;
    amount: number;
};

export default async function OwnerLedgerPage({
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

    const propertyPercentage = new Map(
        owner.properties.map((item) => [
            item.propertyId,
            Number(item.percentage) / 100,
        ])
    );

    const [payments, expenses, payouts] = await Promise.all([
        prisma.payment.findMany({
            where: {
                companyId: user.companyId,
                paymentDate: dateFilter,
                invoice: {
                    unit: {
                        propertyId: { in: propertyIds },
                    },
                },
            },
            include: {
                tenant: true,
                invoice: {
                    include: {
                        unit: {
                            include: { property: true },
                        },
                    },
                },
            },
        }),

        prisma.expense.findMany({
            where: {
                companyId: user.companyId,
                expenseDate: dateFilter,
                propertyId: { in: propertyIds },
            },
            include: {
                property: true,
            },
        }),

        prisma.ownerPayout.findMany({
            where: {
                companyId: user.companyId,
                payoutDate: dateFilter,
                ownerId: owner.id,
            },
        }),
    ]);

    const ledger: LedgerItem[] = [
        ...payments.map((payment) => {
            const propertyId = payment.invoice.unit.propertyId;
            const share = propertyPercentage.get(propertyId) || 0;

            return {
                date: payment.paymentDate,
                type: "COLLECTION" as const,
                description: `Rent collection from ${payment.tenant.name} - ${payment.invoice.unit.property.name}`,
                amount: Number(payment.amount) * share,
            };
        }),

        ...expenses.map((expense) => {
            const share = propertyPercentage.get(expense.propertyId) || 0;

            return {
                date: expense.expenseDate,
                type: "EXPENSE" as const,
                description: `${expense.category} - ${expense.property.name}`,
                amount: Number(expense.amount) * share * -1,
            };
        }),

        ...payouts.map((payout) => ({
            date: payout.payoutDate,
            type: "PAYOUT" as const,
            description: `Owner payout via ${payout.method}`,
            amount: Number(payout.amount) * -1,
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;

    const totalCollections = ledger
        .filter((item) => item.type === "COLLECTION")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = ledger
        .filter((item) => item.type === "EXPENSE")
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const totalPayouts = ledger
        .filter((item) => item.type === "PAYOUT")
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const finalBalance = totalCollections - totalExpenses - totalPayouts;

    return (
        <main className="p-6 print:bg-white print:p-0">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Owner Ledger
                    </p>
                    <h1 className="mt-3 text-3xl font-black">{owner.name}</h1>
                    <p className="mt-2 text-slate-300">
                        Combined ledger of collections, expenses and payouts.
                    </p>
                </div>

                <PrintButton />
            </div>
            <LedgerDateFilter />
            <div className="grid gap-5 md:grid-cols-4">
                <SummaryCard title="Collections" value={totalCollections} />
                <SummaryCard title="Expenses" value={totalExpenses} danger />
                <SummaryCard title="Payouts" value={totalPayouts} danger />
                <SummaryCard
                    title="Running Balance"
                    value={finalBalance}
                    danger={finalBalance < 0}
                />
            </div>

            <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-black text-slate-950">
                            Ledger Timeline
                        </h2>
                        <p className="text-sm text-slate-500">
                            Owner balance movement over time.
                        </p>
                    </div>

                    <Link
                        href={`/dashboard/company/owners/${owner.id}/statement`}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
                    >
                        Statement
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Running Balance</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <ReceiptText size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No ledger entries
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Collections, expenses and payouts will appear here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((item, index) => {
                                    runningBalance += item.amount;

                                    return (
                                        <tr key={`${item.type}-${index}`} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${typeStyle(
                                                        item.type
                                                    )}`}
                                                >
                                                    {item.amount >= 0 ? (
                                                        <ArrowUpCircle size={14} />
                                                    ) : (
                                                        <ArrowDownCircle size={14} />
                                                    )}
                                                    {item.type}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                                {item.description}
                                            </td>

                                            <td
                                                className={`px-6 py-4 text-sm font-black ${item.amount >= 0
                                                    ? "text-emerald-700"
                                                    : "text-red-700"
                                                    }`}
                                            >
                                                {item.amount >= 0 ? "+" : "-"} KES{" "}
                                                {Math.abs(item.amount).toLocaleString()}
                                            </td>

                                            <td
                                                className={`px-6 py-4 text-sm font-black ${runningBalance >= 0
                                                    ? "text-slate-800"
                                                    : "text-red-700"
                                                    }`}
                                            >
                                                KES {runningBalance.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

function typeStyle(type: LedgerItem["type"]) {
    if (type === "COLLECTION") return "bg-emerald-50 text-emerald-700";
    if (type === "EXPENSE") return "bg-red-50 text-red-700";
    if (type === "PAYOUT") return "bg-blue-50 text-blue-700";
    return "bg-slate-100 text-slate-700";
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