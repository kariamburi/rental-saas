import { prisma } from "@/lib/prisma";
import { CreditCard } from "lucide-react";
import RenewSubscriptionButton from "./RenewSubscriptionButton";
import PlanModal from "./PlanModal";
import DeletePlanButton from "./DeletePlanButton";

export default async function SubscriptionsPage() {
    const [plans, subscriptions] = await Promise.all([
        prisma.subscriptionPlan.findMany({
            orderBy: { monthlyFee: "asc" },
        }),

        prisma.companySubscription.findMany({
            include: {
                company: true,
                plan: true,
            },
            orderBy: { expiresAt: "asc" },
        }),
    ]);

    const subscribedCompanyIds = new Set(
        subscriptions.map((subscription) => subscription.companyId)
    );

    const companiesWithoutSubscriptions = await prisma.company.findMany({
        where: {
            id: {
                notIn: Array.from(subscribedCompanyIds),
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    const active = subscriptions.filter((s) => s.status === "ACTIVE").length;

    const expired = subscriptions.filter(
        (s) => s.status === "EXPIRED" || s.expiresAt < new Date()
    ).length;

    const monthlyExpected = subscriptions
        .filter((s) => s.status === "ACTIVE" && s.expiresAt >= new Date())
        .reduce((sum, s) => sum + Number(s.plan.monthlyFee || 0), 0);

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Subscriptions
                </p>

                <h1 className="mt-3 text-3xl font-black">
                    Company Subscriptions
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                    Manage monthly SaaS billing, active plans and expired company accounts.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Plans" value={plans.length} />
                <SummaryCard title="Subscriptions" value={subscriptions.length} />
                <SummaryCard title="Active" value={active} success />
                <SummaryCard
                    title="Monthly Expected"
                    value={`KES ${monthlyExpected.toLocaleString()}`}
                    success
                />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <SummaryCard title="Expired" value={expired} danger />
                <SummaryCard
                    title="Unassigned Companies"
                    value={companiesWithoutSubscriptions.length}
                    warning
                />
            </div>


            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Subscription Plans
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Create, edit and manage monthly SaaS packages.
                            </p>
                        </div>

                        <PlanModal />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Plan
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Monthly Fee
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Property Limit
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Unit Limit
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Status
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id} className="border-b hover:bg-slate-50">
                                        <td className="px-2 py-2 font-semibold text-slate-900">
                                            {plan.name}
                                        </td>
                                        <td className="px-2 py-2 font-black text-emerald-700">
                                            KES {Number(plan.monthlyFee).toLocaleString()}
                                        </td>
                                        <td className="px-2 py-2 text-slate-600">
                                            {plan.propertyLimit ?? "Unlimited"}
                                        </td>
                                        <td className="px-2 py-2 text-slate-600">
                                            {plan.unitLimit ?? "Unlimited"}
                                        </td>
                                        <td className="px-2 py-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-bold ${plan.active
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {plan.active ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-2">
                                                <PlanModal plan={plan} />
                                                <DeletePlanButton
                                                    planId={plan.id}
                                                    planName={plan.name}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 border-b border-slate-200 pb-4">
                        <h2 className="text-xl font-black text-slate-950">
                            Subscription List
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Companies and their current monthly plans.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Company
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Plan
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Monthly Fee
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Status
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Expires
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center"
                                        >
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                <CreditCard size={26} />
                                            </div>

                                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                                No subscriptions yet
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Assign plans to companies to start monthly billing.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((sub) => {
                                        const isExpired =
                                            sub.status === "EXPIRED" ||
                                            sub.expiresAt < new Date();

                                        return (
                                            <tr
                                                key={sub.id}
                                                className="border-b hover:bg-slate-50"
                                            >
                                                <td className="px-2 py-2 font-semibold text-slate-900">
                                                    {sub.company.name}
                                                </td>

                                                <td className="px-2 py-2 text-slate-700">
                                                    {sub.plan.name}
                                                </td>

                                                <td className="px-2 py-2 font-black text-emerald-700">
                                                    KES{" "}
                                                    {Number(
                                                        sub.plan.monthlyFee
                                                    ).toLocaleString()}
                                                </td>

                                                <td className="px-2 py-2">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${isExpired
                                                            ? "bg-red-50 text-red-700"
                                                            : "bg-emerald-50 text-emerald-700"
                                                            }`}
                                                    >
                                                        {isExpired ? "EXPIRED" : sub.status}
                                                    </span>
                                                </td>

                                                <td className="px-2 py-2 text-slate-600">
                                                    {new Date(
                                                        sub.expiresAt
                                                    ).toLocaleDateString("en-KE")}
                                                </td>

                                                <td className="px-2 py-2">
                                                    <RenewSubscriptionButton
                                                        companyId={sub.companyId}
                                                        plans={plans}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 border-b border-slate-200 pb-4">
                        <h2 className="text-xl font-black text-slate-950">
                            Companies Without Subscription
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Assign a monthly plan to new companies.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {companiesWithoutSubscriptions.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">
                                All companies already have subscriptions.
                            </p>
                        ) : (
                            companiesWithoutSubscriptions.map((company) => (
                                <div
                                    key={company.id}
                                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="font-black text-slate-950">
                                            {company.name}
                                        </p>

                                        <p className="text-sm font-semibold text-slate-500">
                                            {company.email || "No email"}
                                        </p>
                                    </div>

                                    <RenewSubscriptionButton
                                        companyId={company.id}
                                        plans={plans}
                                    />
                                </div>
                            ))
                        )}
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
    danger,
    warning,
}: {
    title: string;
    value: number | string;
    success?: boolean;
    danger?: boolean;
    warning?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : warning
            ? "text-amber-700"
            : success
                ? "text-emerald-700"
                : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>
                {value}
            </h2>
        </div>
    );
}