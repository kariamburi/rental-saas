"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Edit, MapPin, Text, X } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
    location: string | null;
    description: string | null;
};

export default function EditPropertyModal({
    property,
}: {
    property: PropertyItem;
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [name, setName] = useState(property.name);
    const [location, setLocation] = useState(property.location || "");
    const [description, setDescription] = useState(property.description || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/properties", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId: property.id,
                    name,
                    location,
                    description,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to update property");
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                title="Edit property"
            >
                <Edit size={16} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Property
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update property details
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
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

                            <Input
                                icon={Building2}
                                label="Property Name"
                                value={name}
                                onChange={setName}
                                placeholder="Example: Green Court Apartments"
                            />

                            <Input
                                icon={MapPin}
                                label="Location"
                                value={location}
                                onChange={setLocation}
                                placeholder="Example: Ruaka, Nairobi"
                            />

                            <Input
                                icon={Text}
                                label="Description"
                                value={description}
                                onChange={setDescription}
                                placeholder="Optional description"
                            />

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Property"}
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
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Icon size={18} className="text-emerald-600" />
                <input
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}