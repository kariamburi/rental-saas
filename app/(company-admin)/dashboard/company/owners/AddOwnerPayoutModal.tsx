"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, FileText, Plus, Wallet, X } from "lucide-react";

export default function AddOwnerPayoutModal({
    ownerId,
}: {
    ownerId: string;
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("MPESA");
    const [reference, setReference] = useState("");
    const [payoutDate, setPayoutDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [notes, setNotes] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/owner-payouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ownerId,
                    amount,
                    method,
                    reference,
                    payoutDate,
                    notes,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to record payout");
                return;
            }

            setAmount("");
            setMethod("MPESA");
            setReference("");
            setPayoutDate(new Date().toISOString().slice(0, 10));
            setNotes("");
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
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-xl  cursor-pointer bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
                Pay Owner
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Record Owner Payout
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Record money paid to this landlord/owner
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input
                                    icon={Wallet}
                                    label="Amount"
                                    value={amount}
                                    onChange={setAmount}
                                    type="number"
                                    placeholder="0"
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Method
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <CreditCard size={18} className="text-emerald-600" />
                                        <select
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        >
                                            <option value="MPESA">MPESA</option>
                                            <option value="BANK">Bank</option>
                                            <option value="CASH">Cash</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    icon={FileText}
                                    label="Reference"
                                    value={reference}
                                    onChange={setReference}
                                    placeholder="Transaction reference"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Payout Date"
                                    value={payoutDate}
                                    onChange={setPayoutDate}
                                    type="date"
                                    placeholder=""
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional notes"
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Payout"}
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
    placeholder,
    type = "text",
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Icon size={18} className="text-emerald-600" />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type={type}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
            </div>
        </div>
    );
}