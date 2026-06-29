"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, IdCard, Mail, MapPin, Phone, UserRound, X } from "lucide-react";

type OwnerItem = {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    idNumber: string | null;
    address: string | null;
};

export default function EditOwnerModal({ owner }: { owner: OwnerItem }) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [name, setName] = useState(owner.name);
    const [phone, setPhone] = useState(owner.phone);
    const [email, setEmail] = useState(owner.email || "");
    const [idNumber, setIdNumber] = useState(owner.idNumber || "");
    const [address, setAddress] = useState(owner.address || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/owners", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ownerId: owner.id,
                    name,
                    phone,
                    email,
                    idNumber,
                    address,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to update owner");
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
                className="flex h-9 w-9  cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                title="Edit owner"
            >
                <Edit size={16} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Owner / Landlord
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update landlord contact details
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

                        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input icon={UserRound} label="Owner Name" value={name} onChange={setName} placeholder="Full name" />
                                <Input icon={Phone} label="Phone" value={phone} onChange={setPhone} placeholder="+2547..." />
                                <Input icon={Mail} label="Email" value={email} onChange={setEmail} placeholder="Optional" type="email" />
                                <Input icon={IdCard} label="ID Number" value={idNumber} onChange={setIdNumber} placeholder="Optional" />
                            </div>

                            <Input icon={MapPin} label="Address" value={address} onChange={setAddress} placeholder="Optional address" />

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Owner"}
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
            <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>

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