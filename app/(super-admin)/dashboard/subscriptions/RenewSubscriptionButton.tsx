"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { assignOrRenewSubscription } from "./actions";

export default function RenewSubscriptionButton({
    companyId,
    plans,
}: {
    companyId: string;
    plans: {
        id: string;
        name: string;
        monthlyFee: any;
    }[];
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        startTransition(async () => {
            await assignOrRenewSubscription(formData);
            setOpen(false);
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
                <CreditCard size={13} />
                Renew
            </button>

            {open ? (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <h2 className="text-xl font-black text-slate-950">
                            Renew Subscription
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Select plan and number of months.
                        </p>

                        <form action={handleSubmit} className="mt-5 space-y-4">
                            <input type="hidden" name="companyId" value={companyId} />

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Plan
                                </label>
                                <select
                                    name="planId"
                                    required
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                >
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - KES{" "}
                                            {Number(plan.monthlyFee).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Months
                                </label>
                                <input
                                    name="months"
                                    type="number"
                                    min={1}
                                    defaultValue={1}
                                    required
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Payment Method
                                </label>
                                <select
                                    name="method"
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                >
                                    <option value="MPESA">MPESA</option>
                                    <option value="BANK">BANK</option>
                                    <option value="CASH">CASH</option>
                                    <option value="MANUAL">MANUAL</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Reference
                                </label>
                                <input
                                    name="reference"
                                    placeholder="Transaction reference"
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded-xl cursor-pointer bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={pending}
                                    className="rounded-xl cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                                >
                                    {pending ? "Saving..." : "Save Renewal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}