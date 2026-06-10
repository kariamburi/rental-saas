"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Gauge, Plus, User, Wallet, X } from "lucide-react";

type TenantItem = {
    id: string;
    name: string;
    unitId: string | null;
    unit: {
        id: string;
        unitNumber: string;
        property: {
            name: string;
        };
    } | null;
};

export default function AddMeterReadingModal({

    tenants,
}: {

    tenants: TenantItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
    const [type, setType] = useState("WATER");
    const [previousReading, setPreviousReading] = useState("");
    const [currentReading, setCurrentReading] = useState("");
    const [ratePerUnit, setRatePerUnit] = useState("");
    const [billingMonth, setBillingMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const selectedTenant = tenants.find((t) => t.id === tenantId);

    const amount = useMemo(() => {
        const prev = Number(previousReading || 0);
        const curr = Number(currentReading || 0);
        const rate = Number(ratePerUnit || 0);
        return Math.max(curr - prev, 0) * rate;
    }, [previousReading, currentReading, ratePerUnit]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!selectedTenant?.unitId) {
            setError("Selected tenant has no assigned unit");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/meter-readings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    unitId: selectedTenant.unitId,
                    type,
                    previousReading,
                    currentReading,
                    ratePerUnit,
                    billingMonth,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to save meter reading");
                return;
            }

            setPreviousReading("");
            setCurrentReading("");
            setRatePerUnit("");
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
                Add Reading
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Add Meter Reading
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Record water or electricity usage for billing
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
                                    Tenant
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <User size={18} className="text-emerald-600" />
                                    <select
                                        value={tenantId}
                                        onChange={(e) => setTenantId(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        {tenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name}
                                                {tenant.unit
                                                    ? ` - ${tenant.unit.property.name} Unit ${tenant.unit.unitNumber}`
                                                    : " - No unit"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedTenant?.unit && (
                                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                                    {selectedTenant.unit.property.name} - Unit{" "}
                                    {selectedTenant.unit.unitNumber}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Type
                                    </label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    >
                                        <option value="WATER">Water</option>
                                        <option value="ELECTRICITY">Electricity</option>
                                    </select>
                                </div>

                                <Input
                                    icon={CalendarDays}
                                    label="Billing Month"
                                    value={billingMonth}
                                    onChange={setBillingMonth}
                                    type="month"
                                />

                                <Input
                                    icon={Gauge}
                                    label="Previous Reading"
                                    value={previousReading}
                                    onChange={setPreviousReading}
                                    type="number"
                                />

                                <Input
                                    icon={Gauge}
                                    label="Current Reading"
                                    value={currentReading}
                                    onChange={setCurrentReading}
                                    type="number"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Rate Per Unit"
                                    value={ratePerUnit}
                                    onChange={setRatePerUnit}
                                    type="number"
                                />
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-black uppercase text-slate-400">
                                    Calculated Amount
                                </p>
                                <p className="mt-1 text-3xl font-black text-slate-950">
                                    KES {amount.toLocaleString()}
                                </p>
                            </div>

                            <button
                                disabled={loading || tenants.length === 0}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Reading"}
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