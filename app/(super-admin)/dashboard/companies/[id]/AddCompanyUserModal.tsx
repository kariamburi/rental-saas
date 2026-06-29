"use client";

import { useState, useTransition } from "react";
import { Plus, X, UserRound, Mail, LockKeyhole, EyeOff, Eye } from "lucide-react";
import { createCompanyUser } from "./actions";

export default function AddCompanyUserModal({
    companyId,
}: {
    companyId: string;
}) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    function handleSubmit(formData: FormData) {
        setError("");

        startTransition(async () => {
            try {
                await createCompanyUser(formData);
                setOpen(false);
            } catch (err: any) {
                setError(err?.message || "Failed to create user.");
            }
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
            >
                <Plus size={16} />
                Add User
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
                                    Add Company User
                                </h2>
                                <p className="text-sm font-semibold text-slate-500">
                                    Create a login account for this company.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-9 w-9  cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="space-y-4 p-5">
                            <input type="hidden" name="companyId" value={companyId} />

                            {error ? (
                                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <Input
                                icon={UserRound}
                                label="Full Name"
                                name="name"
                                placeholder="Example: John Admin"
                            />

                            <Input
                                icon={Mail}
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="admin@company.co.ke"
                            />

                            <Input
                                icon={LockKeyhole}
                                label="Temporary Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter temporary password"
                                rightAction={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="cursor-pointer text-slate-400 transition hover:text-emerald-600"
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                }
                            />

                            <button
                                disabled={pending}
                                className="w-full  cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {pending ? "Saving..." : "Create User"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function Input({
    icon: Icon,
    label,
    name,
    type = "text",
    placeholder,
    rightAction,
}: {
    icon: React.ElementType;
    label: string;
    name: string;
    type?: string;
    placeholder: string;
    rightAction?: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-3 focus-within:border-emerald-500">
                <Icon size={17} className="text-emerald-600" />

                <input
                    name={name}
                    type={type}
                    required
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                />

                {rightAction}
            </div>
        </div>
    );
}