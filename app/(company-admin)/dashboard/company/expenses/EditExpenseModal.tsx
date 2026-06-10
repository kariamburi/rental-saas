"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, Home, Pencil, Wallet, X } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

type ExpenseItem = {
    id: string;
    propertyId: string;
    category: string;
    description: string | null;
    amount: unknown;
    expenseDate: Date | string;
};

export default function EditExpenseModal({
    expense,
    properties,
}: {
    expense: ExpenseItem;
    properties: PropertyItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [propertyId, setPropertyId] = useState(expense.propertyId);
    const [category, setCategory] = useState(expense.category);
    const [description, setDescription] = useState(expense.description || "");
    const [amount, setAmount] = useState(String(expense.amount));
    const [expenseDate, setExpenseDate] = useState(
        new Date(expense.expenseDate).toISOString().slice(0, 10)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/expenses", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expenseId: expense.id,
                    propertyId,
                    category,
                    description,
                    amount,
                    expenseDate,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to update expense");
                return;
            }

            setOpen(false);
            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
                <Pencil size={14} />
                Edit
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Expense
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update property expense details
                                </p>
                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex-1 space-y-5 overflow-y-auto p-6"
                        >
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Property
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <Home size={18} className="text-emerald-600" />
                                    <select
                                        value={propertyId}
                                        onChange={(e) => setPropertyId(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        {properties.map((property) => (
                                            <option key={property.id} value={property.id}>
                                                {property.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Category
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <FileText size={18} className="text-emerald-600" />
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        >
                                            <option>Maintenance</option>
                                            <option>Water</option>
                                            <option>Electricity</option>
                                            <option>Security</option>
                                            <option>Caretaker Salary</option>
                                            <option>Cleaning</option>
                                            <option>Repairs</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    icon={Wallet}
                                    label="Amount"
                                    value={amount}
                                    onChange={setAmount}
                                    type="number"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Expense Date"
                                    value={expenseDate}
                                    onChange={setExpenseDate}
                                    type="date"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Expense"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function Input({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Icon size={18} className="text-emerald-600" />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
            </div>
        </div>
    );
}