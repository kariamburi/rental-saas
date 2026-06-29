import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Banknote,
    Building2,
    CreditCard,
    FileText,
    Home,
    Phone,
    ReceiptText,
    TrendingUp,
    Wallet,
} from "lucide-react";
import PrintButton from "./PrintButton";
import AddOwnerPayoutModal from "../../AddOwnerPayoutModal";
import StatementDateFilter from "./StatementDateFilter";
import { getActiveCompany } from "@/lib/get-active-company";

export default async function OwnerStatementPage({
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

    const [invoices, payments, expenses, payouts] = await Promise.all([
        prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: dateFilter,
                unit: { propertyId: { in: propertyIds } },
            },
            include: {
                unit: { include: { property: true } },
                tenant: true,
            },
            orderBy: { invoiceDate: "desc" },
        }),

        prisma.payment.findMany({
            where: {
                companyId,
                paymentDate: dateFilter,
                invoice: {
                    unit: { propertyId: { in: propertyIds } },
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
            orderBy: { paymentDate: "desc" },
        }),

        prisma.expense.findMany({
            where: {
                companyId,
                expenseDate: dateFilter,
                propertyId: { in: propertyIds },
            },
            include: { property: true },
            orderBy: { expenseDate: "desc" },
        }),

        prisma.ownerPayout.findMany({
            where: {
                companyId,
                ownerId: owner.id,
                payoutDate: dateFilter,
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
        const share = propertyPercentage.get(payment.invoice.unit.propertyId) || 0;
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
        <main className="p-6 print:p-0">
            <div className="mx-auto max-w-7xl print:max-w-none">
                <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm print:rounded-none print:bg-white print:text-slate-950 print:shadow-none">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300 print:text-emerald-700">
                                Owner Statement
                            </p>

                            <h1 className="mt-3 text-3xl font-black">
                                {owner.name}
                            </h1>

                            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-300 print:text-slate-600">
                                <Info icon={Building2} text={owner.company.name} />
                                <Info icon={Phone} text={owner.phone || "No phone"} />
                                <Info
                                    icon={Home}
                                    text={`${owner.properties.length} linked properties`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 print:hidden">
                            <AddOwnerPayoutModal ownerId={owner.id} />
                            <PrintButton />
                        </div>
                    </div>
                </div>

                <div className="print:hidden">
                    <StatementDateFilter />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <SummaryCard title="Owner Billed" value={totalBilled} icon={FileText} />
                    <SummaryCard title="Owner Collected" value={grossCollected} icon={Wallet} success />
                    <SummaryCard title="Owner Expenses" value={ownerExpenses} icon={ReceiptText} danger />
                    <SummaryCard title="Owner Payouts" value={ownerPayouts} icon={CreditCard} danger />
                    <SummaryCard
                        title="Net Payable"
                        value={netPayable}
                        icon={TrendingUp}
                        danger={netPayable < 0}
                        success={netPayable >= 0}
                    />
                </div>

                <div className="mt-4">
                    <SummaryCard title="Outstanding Balance" value={outstanding} icon={Banknote} danger />
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
                    <div className="mb-4 border-b border-slate-200 pb-4">
                        <h2 className="text-xl font-black text-slate-950">
                            Linked Properties
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Ownership percentage used when calculating statement totals.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {owner.properties.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
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

                <TableSection title="Recent Collections">
                    <table className="w-full min-w-[900px] border-collapse text-[12px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-900">
                                <Th>Tenant</Th>
                                <Th>Property</Th>
                                <Th>Amount</Th>
                                <Th>Owner Share</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {payments.length === 0 ? (
                                <EmptyRow colSpan={5} text="No collections recorded." />
                            ) : (
                                payments.map((payment) => {
                                    const share =
                                        propertyPercentage.get(payment.invoice.unit.propertyId) || 0;

                                    return (
                                        <tr key={payment.id} className="border-b hover:bg-slate-50">
                                            <Td strong>{payment.tenant.name}</Td>
                                            <Td>{payment.invoice.unit.property.name}</Td>
                                            <Td strong>KES {Number(payment.amount).toLocaleString()}</Td>
                                            <Td success>
                                                KES {(Number(payment.amount) * share).toLocaleString()}
                                            </Td>
                                            <Td>
                                                {new Date(payment.paymentDate).toLocaleDateString("en-KE")}
                                            </Td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </TableSection>

                <TableSection title="Owner Payout History">
                    <table className="w-full min-w-[900px] border-collapse text-[12px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-900">
                                <Th>Date</Th>
                                <Th>Amount</Th>
                                <Th>Method</Th>
                                <Th>Reference</Th>
                                <Th>Paid By</Th>
                                <Th>Receipt</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {payouts.length === 0 ? (
                                <EmptyRow colSpan={6} text="No payouts recorded." />
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout.id} className="border-b hover:bg-slate-50">
                                        <Td>
                                            {new Date(payout.payoutDate).toLocaleDateString("en-KE")}
                                        </Td>
                                        <Td danger>KES {Number(payout.amount).toLocaleString()}</Td>
                                        <Td>{payout.method}</Td>
                                        <Td>{payout.reference || "-"}</Td>
                                        <Td>{payout.paidBy || "-"}</Td>
                                        <Td>
                                            <a
                                                href={`/dashboard/company/owners/payouts/${payout.id}/receipt`}
                                                className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white print:hidden"
                                            >
                                                Receipt
                                            </a>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </TableSection>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none">
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

function Info({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <Icon size={15} className="text-emerald-300" />
            {text}
        </span>
    );
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

function TableSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
            <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-black text-slate-950">{title}</h2>
            </div>

            <div className="overflow-x-auto">{children}</div>
        </section>
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

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
            >
                {text}
            </td>
        </tr>
    );
}