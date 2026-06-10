import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import { CalendarDays, CreditCard, ReceiptText, UserRound, Wallet } from "lucide-react";

export default async function OwnerPayoutsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const payouts = await prisma.ownerPayout.findMany({
        where: { companyId: user.companyId },
        include: {
            owner: true,
        },
        orderBy: { payoutDate: "desc" },
    });

    const totalPaid = payouts.reduce(
        (sum, payout) => sum + Number(payout.amount),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Owner Payouts
                </p>
                <h1 className="mt-3 text-3xl font-black">Landlord Payments</h1>
                <p className="mt-2 max-w-2xl text-slate-300">
                    Track all payouts made to property owners and landlords.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Payouts" value={payouts.length} />
                <SummaryCard
                    title="Amount Paid"
                    value={`KES ${totalPaid.toLocaleString()}`}
                />
                <SummaryCard
                    title="Owners Paid"
                    value={new Set(payouts.map((p) => p.ownerId)).size}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Payout History
                    </h2>
                    <p className="text-sm text-slate-500">
                        All owner payout transactions
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Paid By</th>
                                <th className="px-6 py-4">Receipt</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <ReceiptText size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No payouts yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Owner payouts will appear here after recording.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <UserRound size={16} className="text-emerald-600" />
                                                {payout.owner.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(payout.amount).toLocaleString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CreditCard size={16} className="text-emerald-600" />
                                                {payout.method}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {payout.reference || "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {new Date(payout.payoutDate).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {payout.paidBy || "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/company/owners/payouts/${payout.id}/receipt`}
                                                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
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