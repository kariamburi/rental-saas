"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase,
    CalendarDays,
    DoorOpen,
    Edit,
    IdCard,
    Mail,
    Phone,
    ShieldAlert,
    User,
    X,
} from "lucide-react";

type UnitItem = {
    id: string;
    unitNumber: string;
    status: string;
    property: { name: string };
};

type TenantItem = {
    id: string;
    unitId: string | null;
    name: string;
    phone: string;
    email: string | null;
    idNumber: string | null;
    occupation: string | null;
    emergencyContact: string | null;
    moveInDate: Date | string | null;
    status: string;
};

export default function EditTenantModal({
    tenant,
    units,
}: {
    tenant: TenantItem;
    units: UnitItem[];
}) {
    const router = useRouter();

    const availableUnits = units.filter(
        (u) => u.status === "VACANT" || u.id === tenant.unitId
    );

    const [open, setOpen] = useState(false);
    const [unitId, setUnitId] = useState(tenant.unitId || availableUnits[0]?.id || "");
    const [name, setName] = useState(tenant.name);
    const [phone, setPhone] = useState(tenant.phone);
    const [email, setEmail] = useState(tenant.email || "");
    const [idNumber, setIdNumber] = useState(tenant.idNumber || "");
    const [occupation, setOccupation] = useState(tenant.occupation || "");
    const [emergencyContact, setEmergencyContact] = useState(
        tenant.emergencyContact || ""
    );
    const [moveInDate, setMoveInDate] = useState(
        tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().slice(0, 10) : ""
    );
    const [status, setStatus] = useState(tenant.status);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/tenants", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId: tenant.id,
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
                setError(data.error || "Failed to update tenant");
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
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
                <Edit size={14} />
                Edit
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Tenant
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update tenant details and assigned unit
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
                            className="max-h-[75vh] space-y-5 overflow-y-auto p-6"
                        >
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Unit
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <DoorOpen size={18} className="text-emerald-600" />
                                    <select
                                        value={unitId}
                                        onChange={(e) => setUnitId(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                    >
                                        {availableUnits.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.property.name} - Unit {unit.unitNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input icon={User} label="Full Name" value={name} onChange={setName} />
                                <Input icon={Phone} label="Phone" value={phone} onChange={setPhone} />
                                <Input icon={Mail} label="Email" value={email} onChange={setEmail} type="email" />
                                <Input icon={IdCard} label="National ID" value={idNumber} onChange={setIdNumber} />
                                <Input icon={Briefcase} label="Occupation" value={occupation} onChange={setOccupation} />
                                <Input icon={ShieldAlert} label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} />
                                <Input icon={CalendarDays} label="Move-in Date" value={moveInDate} onChange={setMoveInDate} type="date" />

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
                                disabled={loading || !unitId}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Tenant"}
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
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Icon size={18} className="text-emerald-600" />
                <input
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                />
            </div>
        </div>
    );
}