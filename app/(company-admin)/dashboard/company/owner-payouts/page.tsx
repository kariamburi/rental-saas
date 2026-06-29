import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import {
    CalendarDays,
    CreditCard,
    ReceiptText,
    UserRound,
    Wallet,
} from "lucide-react";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function OwnerPayoutsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/owner-payouts");


    const payouts = await prisma.ownerPayout.findMany({
        where: { companyId: companyId },
        include: {
            owner: true,
        },
        orderBy: { payoutDate: "desc" },
    });

    const totalPaid = payouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0
    );

    const ownersPaid = new Set(payouts.map((payout) => payout.ownerId)).size;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Owner Payouts
                </p>

                <h1 className="mt-3 text-3xl font-black">Landlord Payments</h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                    Track all payouts made to property owners and landlords.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Total Payouts" value={payouts.length} />
                <SummaryCard
                    title="Amount Paid"
                    value={`KES ${totalPaid.toLocaleString()}`}
                    success
                />
                <SummaryCard title="Owners Paid" value={ownersPaid} />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Payout History
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                All owner payout transactions.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Owner
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
                                        Date
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Paid By
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Receipt
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center"
                                        >
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
                                        <tr
                                            key={payout.id}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <td className="px-2 py-2">
                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                    <UserRound size={13} />
                                                    {payout.owner.name}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Wallet size={13} />
                                                    KES{" "}
                                                    {Number(
                                                        payout.amount || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <CreditCard size={13} />
                                                    {payout.method}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                {payout.reference || "-"}
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays size={13} />
                                                    {new Date(
                                                        payout.payoutDate
                                                    ).toLocaleDateString("en-KE")}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                {payout.paidBy || "-"}
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <Link
                                                    href={`/dashboard/company/owners/payouts/${payout.id}/receipt`}
                                                    className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
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
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    success,
}: {
    title: string;
    value: number | string;
    success?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2
                className={`mt-2 text-2xl font-black ${success ? "text-emerald-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}