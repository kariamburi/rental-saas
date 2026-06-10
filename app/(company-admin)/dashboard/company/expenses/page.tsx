import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarDays, Home, Wallet } from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import DeleteExpenseButton from "./DeleteExpenseButton";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export default async function CompanyExpensesPage() {
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

    const properties = await prisma.property.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
    });

    const expenses = await prisma.expense.findMany({
        where: { companyId: user.companyId },
        include: { property: true },
        orderBy: { expenseDate: "desc" },
    });

    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Expenses
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Track property expenses, repairs, utilities and operating costs.
                        </p>
                    </div>

                    <AddExpenseModal properties={properties} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Expenses" value={expenses.length} />
                <SummaryCard
                    title="Amount Spent"
                    value={`KES ${totalExpenses.toLocaleString()}`}
                />
                <SummaryCard title="Properties" value={properties.length} />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Expense List</h2>
                    <p className="text-sm text-slate-500">
                        All recorded property expenses
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <Wallet size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No expenses yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Record property costs and maintenance expenses.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Home size={16} className="text-emerald-600" />
                                                {expense.property.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {expense.category}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {expense.description || "-"}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-black text-slate-700">
                                            KES {Number(expense.amount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {new Date(expense.expenseDate).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <EditExpenseModal
                                                    expense={expense}
                                                    properties={properties}
                                                />
                                                <DeleteExpenseButton expenseId={expense.id} />
                                            </div>
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