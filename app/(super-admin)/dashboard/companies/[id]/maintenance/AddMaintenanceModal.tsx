"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, DoorOpen, Plus, Text, User, X } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

type TenantItem = {
    id: string;
    name: string;
    unitId: string | null;
    unit: {
        unitNumber: string;
        propertyId: string;
    } | null;
};

export default function AddMaintenanceModal({
    companyId,
    properties,
    tenants,
}: {
    companyId: string;
    properties: PropertyItem[];
    tenants: TenantItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
    const [tenantId, setTenantId] = useState("");
    const selectedTenant = tenants.find((t) => t.id === tenantId);

    const [unitId, setUnitId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleTenantChange(value: string) {
        setTenantId(value);

        const tenant = tenants.find((t) => t.id === value);

        if (tenant?.unit) {
            setUnitId(tenant.unitId || "");
            setPropertyId(tenant.unit.propertyId);
        } else {
            setUnitId("");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/maintenance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyId,
                    tenantId,
                    propertyId,
                    unitId,
                    title,
                    description,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to create request");
                return;
            }

            setTenantId("");
            setUnitId("");
            setTitle("");
            setDescription("");
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
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
                <Plus size={18} />
                Add Request
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Maintenance Request
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Report repairs, faults, and tenant issues
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
                                    Tenant Optional
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <User size={18} className="text-emerald-600" />
                                    <select
                                        value={tenantId}
                                        onChange={(e) => handleTenantChange(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        <option value="">No tenant selected</option>
                                        {tenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name}
                                                {tenant.unit
                                                    ? ` - Unit ${tenant.unit.unitNumber}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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

                            {selectedTenant?.unit && (
                                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                                    <div className="flex items-center gap-2">
                                        <DoorOpen size={16} />
                                        Unit {selectedTenant.unit.unitNumber}
                                    </div>
                                </div>
                            )}

                            <Input
                                icon={Text}
                                label="Issue Title"
                                value={title}
                                onChange={setTitle}
                                placeholder="Example: Water leakage"
                            />

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>

                            <button
                                disabled={loading || properties.length === 0}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Request"}
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
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Icon size={18} className="text-emerald-600" />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
            </div>
        </div>
    );
}