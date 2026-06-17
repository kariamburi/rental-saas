"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase,
    Building2,
    CalendarDays,
    DoorOpen,
    IdCard,
    Mail,
    Phone,
    Plus,
    ShieldAlert,
    User,
    X,
} from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

type UnitItem = {
    id: string;
    propertyId: string;
    unitNumber: string;
    unitSize?: string | null;
    status: string;
    property: {
        id: string;
        name: string;
    };
};

export default function AddTenantModal({
    properties,
    units,
    selectedUnitId,
}: {
    properties: PropertyItem[];
    units: UnitItem[];
    selectedUnitId?: string;
}) {
    const router = useRouter();

    const availableUnits = units.filter((u) => u.status === "VACANT");

    const selectedUnit = selectedUnitId
        ? availableUnits.find((u) => u.id === selectedUnitId)
        : null;

    const initialPropertyId =
        selectedUnit?.propertyId || selectedUnit?.property?.id || properties[0]?.id || "";

    const [open, setOpen] = useState(Boolean(selectedUnitId));
    const [propertyId, setPropertyId] = useState(initialPropertyId);
    const [unitId, setUnitId] = useState(selectedUnit?.id || "");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [occupation, setOccupation] = useState("");
    const [emergencyContact, setEmergencyContact] = useState("");
    const [moveInDate, setMoveInDate] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const filteredUnits = useMemo(() => {
        return availableUnits.filter((unit) => unit.propertyId === propertyId);
    }, [availableUnits, propertyId]);

    function handlePropertyChange(value: string) {
        setPropertyId(value);

        const firstUnit = availableUnits.find((unit) => unit.propertyId === value);
        setUnitId(firstUnit?.id || "");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!propertyId) {
            setError("Please select property");
            return;
        }

        if (!unitId) {
            setError("Please select vacant unit");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId,
                    name,
                    phone,
                    email,
                    idNumber,
                    occupation,
                    emergencyContact,
                    moveInDate,
                    status,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to add tenant");
                return;
            }

            setName("");
            setPhone("");
            setEmail("");
            setIdNumber("");
            setOccupation("");
            setEmergencyContact("");
            setMoveInDate("");
            setStatus("ACTIVE");
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
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
                <Plus size={18} />
                Add Tenant
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Add Tenant
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Select property first, then assign a vacant unit.
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

                        <form
                            onSubmit={handleSubmit}
                            className="max-h-[75vh] space-y-5 overflow-y-auto p-6"
                        >
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            {availableUnits.length === 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    No vacant units available. Add a vacant unit first.
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Property
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <Building2 size={18} className="text-emerald-600" />
                                        <select
                                            value={propertyId}
                                            onChange={(e) => handlePropertyChange(e.target.value)}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        >
                                            <option value="">Select property</option>
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
                                        Vacant Unit
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <DoorOpen size={18} className="text-emerald-600" />
                                        <select
                                            value={unitId}
                                            onChange={(e) => setUnitId(e.target.value)}
                                            disabled={!propertyId || filteredUnits.length === 0}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:opacity-60"
                                        >
                                            <option value="">
                                                {propertyId
                                                    ? "Select vacant unit"
                                                    : "Select property first"}
                                            </option>

                                            {filteredUnits.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    Unit {unit.unitNumber}
                                                    {unit.unitSize ? ` - ${unit.unitSize}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input icon={User} label="Full Name" value={name} onChange={setName} placeholder="Tenant name" />
                                <Input icon={Phone} label="Phone" value={phone} onChange={setPhone} placeholder="+2547..." />
                                <Input icon={Mail} label="Email" value={email} onChange={setEmail} placeholder="optional@email.com" type="email" />
                                <Input icon={IdCard} label="National ID" value={idNumber} onChange={setIdNumber} placeholder="ID number" />
                                <Input icon={Briefcase} label="Occupation" value={occupation} onChange={setOccupation} placeholder="Optional" />
                                <Input icon={ShieldAlert} label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} placeholder="+2547..." />
                                <Input icon={CalendarDays} label="Move-in Date" value={moveInDate} onChange={setMoveInDate} placeholder="" type="date" />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="NOTICE">Notice</option>
                                        <option value="VACATED">Vacated</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                disabled={loading || availableUnits.length === 0 || !unitId}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Tenant"}
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