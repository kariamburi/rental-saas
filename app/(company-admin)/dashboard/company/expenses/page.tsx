import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    CalendarDays,
    ChevronDown,
    Home,
    Wallet,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import DeleteExpenseButton from "./DeleteExpenseButton";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyExpensesPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/expenses");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const expenses = await prisma.expense.findMany({
        where: { companyId: companyId },
        include: { property: true },
        orderBy: { expenseDate: "desc" },
    });

    const totalExpensesAmount = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const categories = new Set(expenses.map((expense) => expense.category));

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Expenses
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Track property expenses, repairs, utilities and operating costs.
                        </p>
                    </div>

                    <AddExpenseModal properties={properties} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Total Expenses" value={expenses.length} />
                <SummaryCard
                    title="Amount Spent"
                    value={`KES ${totalExpensesAmount.toLocaleString()}`}
                    danger
                />
                <SummaryCard title="Categories" value={categories.size} />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Expense List
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Expenses grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Wallet size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No expenses yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Record property costs and maintenance expenses.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyExpenses = expenses.filter(
                                    (expense) => expense.propertyId === property.id
                                );

                                const propertyTotalExpenses = propertyExpenses.reduce(
                                    (sum, expense) => sum + Number(expense.amount || 0),
                                    0
                                );

                                const propertyCategories = new Set(
                                    propertyExpenses.map((expense) => expense.category)
                                );

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                                        <Home size={17} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-950">
                                                            {property.name}
                                                        </h3>

                                                        <p className="text-xs font-semibold text-slate-500">
                                                            {propertyExpenses.length} expense(s) •{" "}
                                                            {propertyCategories.size} categories
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
                                                        Spent: KES{" "}
                                                        {propertyTotalExpenses.toLocaleString()}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[900px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Category
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Description
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Amount
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Date
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyExpenses.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No expenses for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyExpenses.map((expense) => (
                                                            <tr
                                                                key={expense.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                                        {expense.category}
                                                                    </span>
                                                                </td>

                                                                <td className="px-2 py-2 text-slate-600">
                                                                    {expense.description || "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-red-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        expense.amount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            expense.expenseDate
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <EditExpenseModal
                                                                            expense={expense}
                                                                            properties={properties}
                                                                        />

                                                                        <DeleteExpenseButton
                                                                            expenseId={expense.id}
                                                                        />
                                                                    </div>
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
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    danger,
}: {
    title: string;
    value: number | string;
    danger?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2
                className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}