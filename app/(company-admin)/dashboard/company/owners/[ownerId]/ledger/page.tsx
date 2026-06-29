import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Banknote,
    Building2,
    CreditCard,
    ReceiptText,
    TrendingUp,
    Wallet,
} from "lucide-react";
import LedgerDateFilter from "./LedgerDateFilter";
import PrintButton from "./PrintButton";
import { getActiveCompany } from "@/lib/get-active-company";

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
    const { companyId } = await getActiveCompany();

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
        where: { id: ownerId, companyId },
        include: {
            company: true,
            properties: {
                include: { property: true },
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
                companyId,
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
                companyId,
                expenseDate: dateFilter,
                propertyId: { in: propertyIds },
            },
            include: { property: true },
        }),

        prisma.ownerPayout.findMany({
            where: {
                companyId,
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
        <main className="p-6 print:p-0">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm print:rounded-none print:bg-white print:text-slate-950 print:shadow-none">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div>
                        <Link
                            href="/dashboard/company/owners"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition hover:text-white print:hidden"
                        >
                            <ArrowLeft size={16} />
                            Back to Owners
                        </Link>

                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Owner Ledger
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{owner.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Combined ledger of owner collections, expenses and payouts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                        <Link
                            href={`/dashboard/company/owners/${owner.id}/statement`}
                            className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                        >
                            Statement
                        </Link>
                        <PrintButton />
                    </div>
                </div>
            </div>

            <div className="print:hidden">
                <LedgerDateFilter />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
                <SummaryCard title="Collections" value={totalCollections} icon={Wallet} success />
                <SummaryCard title="Expenses" value={totalExpenses} icon={ReceiptText} danger />
                <SummaryCard title="Payouts" value={totalPayouts} icon={CreditCard} danger />
                <SummaryCard
                    title="Running Balance"
                    value={finalBalance}
                    icon={TrendingUp}
                    danger={finalBalance < 0}
                    success={finalBalance >= 0}
                />
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Ledger Timeline
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Owner balance movement over time.
                        </p>
                    </div>

                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${finalBalance >= 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                            }`}
                    >
                        <Banknote size={13} />
                        Final Balance: KES {finalBalance.toLocaleString()}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse text-[12px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-900">
                                <Th>Date</Th>
                                <Th>Type</Th>
                                <Th>Description</Th>
                                <Th>Amount</Th>
                                <Th>Running Balance</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
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
                                        <tr
                                            key={`${item.type}-${index}`}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <Td>
                                                {new Date(item.date).toLocaleDateString("en-KE")}
                                            </Td>

                                            <Td>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${typeStyle(
                                                        item.type
                                                    )}`}
                                                >
                                                    {item.amount >= 0 ? (
                                                        <ArrowUpCircle size={13} />
                                                    ) : (
                                                        <ArrowDownCircle size={13} />
                                                    )}
                                                    {item.type}
                                                </span>
                                            </Td>

                                            <Td>{item.description}</Td>

                                            <Td strong success={item.amount >= 0} danger={item.amount < 0}>
                                                {item.amount >= 0 ? "+" : "-"} KES{" "}
                                                {Math.abs(item.amount).toLocaleString()}
                                            </Td>

                                            <Td strong danger={runningBalance < 0}>
                                                KES {runningBalance.toLocaleString()}
                                            </Td>
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
    icon: Icon,
    success,
    danger,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    success?: boolean;
    danger?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : success
            ? "text-emerald-700"
            : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={18} />
                </span>
            </div>

            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>
                KES {value.toLocaleString()}
            </h2>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
            {children}
        </th>
    );
}

function Td({
    children,
    strong,
    success,
    danger,
}: {
    children: React.ReactNode;
    strong?: boolean;
    success?: boolean;
    danger?: boolean;
}) {
    const color = danger
        ? "text-red-700"
        : success
            ? "text-emerald-700"
            : "text-slate-700";

    return (
        <td
            className={`px-2 py-2 ${strong || success || danger ? `font-black ${color}` : color
                }`}
        >
            {children}
        </td>
    );
}