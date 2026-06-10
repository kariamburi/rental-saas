"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    DoorOpen,
    Hash,
    Mail,
    Phone,
    Plus,
    User,
    Wallet,
    X,
} from "lucide-react";

type UnitItem = {
    id: string;
    propertyId: string;
    unitNumber: string;
    rentAmount: unknown;
    property: {
        name: string;
    };
};

export default function AddBookingModal({ units }: { units: UnitItem[] }) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [unitId, setUnitId] = useState(units[0]?.id || "");
    const selectedUnit = units.find((u) => u.id === unitId);

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [expectedMoveIn, setExpectedMoveIn] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const unit = units.find((u) => u.id === unitId);

        if (!unit) {
            setError("Select a vacant unit");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/unit-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId: unit.propertyId,
                    unitId,
                    customerName,
                    phone,
                    email,
                    idNumber,
                    expectedMoveIn,
                    amountPaid,
                    notes,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to create booking");
                return;
            }

            setCustomerName("");
            setPhone("");
            setEmail("");
            setIdNumber("");
            setExpectedMoveIn("");
            setAmountPaid("");
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
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
                <Plus size={18} />
                Add Booking
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Add Unit Booking
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Reserve a vacant unit for a prospective tenant
                                </p>
                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
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

                            {units.length === 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    No vacant units available for booking.
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Vacant Unit
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <DoorOpen size={18} className="text-emerald-600" />
                                    <select
                                        value={unitId}
                                        onChange={(e) => setUnitId(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.property.name} - Unit {unit.unitNumber} - KES{" "}
                                                {Number(unit.rentAmount).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedUnit && (
                                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                                    Selected: {selectedUnit.property.name} - Unit{" "}
                                    {selectedUnit.unitNumber} • Rent KES{" "}
                                    {Number(selectedUnit.rentAmount).toLocaleString()}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input
                                    icon={User}
                                    label="Customer Name"
                                    value={customerName}
                                    onChange={setCustomerName}
                                    placeholder="Full name"
                                />

                                <Input
                                    icon={Phone}
                                    label="Phone"
                                    value={phone}
                                    onChange={setPhone}
                                    placeholder="+2547..."
                                />

                                <Input
                                    icon={Mail}
                                    label="Email"
                                    value={email}
                                    onChange={setEmail}
                                    placeholder="Optional"
                                    type="email"
                                />

                                <Input
                                    icon={Hash}
                                    label="ID Number"
                                    value={idNumber}
                                    onChange={setIdNumber}
                                    placeholder="Optional"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Expected Move-in"
                                    value={expectedMoveIn}
                                    onChange={setExpectedMoveIn}
                                    placeholder=""
                                    type="date"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Amount Paid"
                                    value={amountPaid}
                                    onChange={setAmountPaid}
                                    placeholder="0"
                                    type="number"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    placeholder="Optional booking notes"
                                />
                            </div>

                            <button
                                disabled={loading || units.length === 0}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Booking"}
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