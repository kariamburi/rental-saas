"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Edit, Home, House, Wallet, X } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

type UnitItem = {
    id: string;
    propertyId: string;
    unitNumber: string;
    unitSize?: string | null;
    rentAmount: any;
    status: string;
};

export default function EditUnitModal({
    unit,
    properties,
}: {
    unit: UnitItem;
    properties: PropertyItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [propertyId, setPropertyId] = useState(unit.propertyId);
    const [unitNumber, setUnitNumber] = useState(unit.unitNumber);
    const [unitSize, setUnitSize] = useState(unit.unitSize || "");
    const [rentAmount, setRentAmount] = useState(String(unit.rentAmount));
    const [status, setStatus] = useState(unit.status);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/units", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId: unit.id,
                    propertyId,
                    unitNumber,
                    unitSize,
                    rentAmount,
                    status,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to update unit");
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
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                title="Edit unit"
            >
                <Edit size={16} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Unit
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update unit rent, size, status, property, or number
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

                            <Input
                                icon={DoorOpen}
                                label="Unit Number"
                                value={unitNumber}
                                onChange={setUnitNumber}
                                placeholder="Example: A1, B2, Shop 3"
                            />

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Unit Size
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                                    <House size={18} className="text-emerald-600" />
                                    <select
                                        value={unitSize}
                                        onChange={(e) => setUnitSize(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        <option value="">Select Unit Size</option>
                                        <option value="Bedsitter">Bedsitter</option>
                                        <option value="1 Bedroom">1 Bedroom</option>
                                        <option value="2 Bedroom">2 Bedroom</option>
                                        <option value="3 Bedroom">3 Bedroom</option>
                                        <option value="4 Bedroom">4 Bedroom</option>
                                        <option value="Shop">Shop</option>
                                        <option value="Office">Office</option>
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <Input
                                icon={Wallet}
                                label="Monthly Rent"
                                value={rentAmount}
                                onChange={setRentAmount}
                                placeholder="Example: 15000"
                                type="number"
                            />

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value="VACANT">Vacant</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Unit"}
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
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type={type}
                />
            </div>
        </div>
    );
}