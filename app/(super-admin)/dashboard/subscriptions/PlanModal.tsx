"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { saveSubscriptionPlan } from "./actions";

export default function PlanModal({
    plan,
}: {
    plan?: {
        id: string;
        name: string;
        monthlyFee: any;
        propertyLimit: number | null;
        unitLimit: number | null;
        active: boolean;
    };
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        startTransition(async () => {
            await saveSubscriptionPlan(formData);
            setOpen(false);
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                    plan
                        ? "rounded cursor-pointer bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white"
                        : "inline-flex items-center gap-2 rounded-xl cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                }
            >
                {plan ? <Pencil size={13} /> : <Plus size={16} />}
                {plan ? "Edit" : "Add Plan"}
            </button>

            {open ? (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    {plan ? "Edit Plan" : "Add Plan"}
                                </h2>
                                <p className="text-sm font-semibold text-slate-500">
                                    Manage monthly billing package.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="space-y-4 p-5">
                            <input type="hidden" name="id" value={plan?.id || ""} />

                            <Input
                                label="Plan Name"
                                name="name"
                                defaultValue={plan?.name || ""}
                                required
                            />

                            <Input
                                label="Monthly Fee"
                                name="monthlyFee"
                                type="number"
                                defaultValue={String(plan?.monthlyFee ?? "")}
                                required
                            />

                            <Input
                                label="Property Limit"
                                name="propertyLimit"
                                type="number"
                                defaultValue={plan?.propertyLimit ?? ""}
                                placeholder="Leave blank for unlimited"
                            />

                            <Input
                                label="Unit Limit"
                                name="unitLimit"
                                type="number"
                                defaultValue={plan?.unitLimit ?? ""}
                                placeholder="Leave blank for unlimited"
                            />

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Status
                                </label>
                                <select
                                    name="active"
                                    defaultValue={String(plan?.active ?? true)}
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
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
                                    {pending ? "Saving..." : "Save Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function Input({
    label,
    name,
    defaultValue,
    type = "text",
    placeholder,
    required,
}: {
    label: string;
    name: string;
    defaultValue?: string | number | null;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
                {label}
            </label>
            <input
                name={name}
                type={type}
                defaultValue={defaultValue ?? ""}
                placeholder={placeholder}
                required={required}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
            />
        </div>
    );
}