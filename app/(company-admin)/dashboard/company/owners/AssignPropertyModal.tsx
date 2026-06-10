"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Percent, Plus, X } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

export default function AssignPropertyModal({
    ownerId,
    properties,
}: {
    ownerId: string;
    properties: PropertyItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
    const [percentage, setPercentage] = useState("100");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/property-ownerships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ownerId,
                    propertyId,
                    percentage,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to assign property");
                return;
            }

            setPercentage("100");
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
                className="rounded-xl cursor-pointer bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
                Assign Property
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Assign Property
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Link this owner to a property
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

                            {properties.length === 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    No properties available. Add property first.
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Property
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <Building2 size={18} className="text-emerald-600" />
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

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Ownership Percentage
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <Percent size={18} className="text-emerald-600" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading || properties.length === 0}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Assignment"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}