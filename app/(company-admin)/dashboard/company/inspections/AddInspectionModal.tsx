"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    CalendarDays,
    DoorOpen,
    FileText,
    Plus,
    Trash2,
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
    property: {
        name: string;
    };
};

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

type InspectionItem = {
    area: string;
    condition: string;
    notes: string;
};

export default function AddInspectionModal({
    properties,
    units,
    tenants,
}: {
    properties: PropertyItem[];
    units: UnitItem[];
    tenants: TenantItem[];
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
    const [unitId, setUnitId] = useState("");
    const [tenantId, setTenantId] = useState("");

    const [inspectionDate, setInspectionDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [type, setType] = useState("ROUTINE");
    const [status, setStatus] = useState("PENDING");
    const [overallNotes, setOverallNotes] = useState("");

    const [items, setItems] = useState<InspectionItem[]>([
        { area: "Living Room", condition: "GOOD", notes: "" },
        { area: "Kitchen", condition: "GOOD", notes: "" },
        { area: "Bathroom", condition: "GOOD", notes: "" },
    ]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const propertyUnits = useMemo(
        () => units.filter((unit) => unit.propertyId === propertyId),
        [units, propertyId]
    );

    const unitTenants = useMemo(
        () => tenants.filter((tenant) => tenant.unitId === unitId),
        [tenants, unitId]
    );

    function handlePropertyChange(value: string) {
        setPropertyId(value);
        setUnitId("");
        setTenantId("");
    }

    function handleUnitChange(value: string) {
        setUnitId(value);
        setTenantId("");
    }

    function updateItem(index: number, field: keyof InspectionItem, value: string) {
        setItems((current) =>
            current.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    }

    function addItem() {
        setItems((current) => [
            ...current,
            { area: "", condition: "GOOD", notes: "" },
        ]);
    }

    function removeItem(index: number) {
        setItems((current) => current.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/property-inspections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    unitId,
                    tenantId,
                    inspectionDate,
                    type,
                    status,
                    overallNotes,
                    items,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to create inspection");
                return;
            }

            setOpen(false);
            setUnitId("");
            setTenantId("");
            setInspectionDate(new Date().toISOString().slice(0, 10));
            setType("ROUTINE");
            setStatus("PENDING");
            setOverallNotes("");
            setItems([
                { area: "Living Room", condition: "GOOD", notes: "" },
                { area: "Kitchen", condition: "GOOD", notes: "" },
                { area: "Bathroom", condition: "GOOD", notes: "" },
            ]);
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
                Add Inspection
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Add Property Inspection
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Capture unit/property condition and inspection checklist
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
                            className="flex-1 space-y-5 overflow-y-auto p-6"
                        >
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            {properties.length === 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    No properties available. Add a property first.
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <SelectBox
                                    icon={Building2}
                                    label="Property"
                                    value={propertyId}
                                    onChange={handlePropertyChange}
                                    options={properties.map((property) => ({
                                        value: property.id,
                                        label: property.name,
                                    }))}
                                />

                                <SelectBox
                                    icon={DoorOpen}
                                    label="Unit"
                                    value={unitId}
                                    onChange={handleUnitChange}
                                    options={[
                                        { value: "", label: "Whole property / no unit" },
                                        ...propertyUnits.map((unit) => ({
                                            value: unit.id,
                                            label: `Unit ${unit.unitNumber}`,
                                        })),
                                    ]}
                                />

                                <SelectBox
                                    icon={User}
                                    label="Tenant"
                                    value={tenantId}
                                    onChange={setTenantId}
                                    options={[
                                        { value: "", label: "No tenant" },
                                        ...unitTenants.map((tenant) => ({
                                            value: tenant.id,
                                            label: tenant.name,
                                        })),
                                    ]}
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Inspection Date"
                                    value={inspectionDate}
                                    onChange={setInspectionDate}
                                    type="date"
                                />

                                <SelectBox
                                    icon={FileText}
                                    label="Inspection Type"
                                    value={type}
                                    onChange={setType}
                                    options={[
                                        { value: "ROUTINE", label: "Routine" },
                                        { value: "MOVE_IN", label: "Move In" },
                                        { value: "MOVE_OUT", label: "Move Out" },
                                        { value: "MAINTENANCE", label: "Maintenance" },
                                    ]}
                                />

                                <SelectBox
                                    icon={FileText}
                                    label="Status"
                                    value={status}
                                    onChange={setStatus}
                                    options={[
                                        { value: "PENDING", label: "Pending" },
                                        { value: "COMPLETED", label: "Completed" },
                                        { value: "ISSUES_FOUND", label: "Issues Found" },
                                    ]}
                                />
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-slate-950">
                                            Inspection Items
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Add areas checked and their condition
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                    >
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-12"
                                        >
                                            <input
                                                value={item.area}
                                                onChange={(e) =>
                                                    updateItem(index, "area", e.target.value)
                                                }
                                                placeholder="Area e.g. Kitchen"
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none md:col-span-3"
                                            />

                                            <select
                                                value={item.condition}
                                                onChange={(e) =>
                                                    updateItem(index, "condition", e.target.value)
                                                }
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none md:col-span-3"
                                            >
                                                <option value="GOOD">Good</option>
                                                <option value="FAIR">Fair</option>
                                                <option value="POOR">Poor</option>
                                                <option value="DAMAGED">Damaged</option>
                                                <option value="NEEDS_REPAIR">Needs Repair</option>
                                            </select>

                                            <input
                                                value={item.notes}
                                                onChange={(e) =>
                                                    updateItem(index, "notes", e.target.value)
                                                }
                                                placeholder="Notes"
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none md:col-span-5"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white md:col-span-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Overall Notes
                                </label>
                                <textarea
                                    value={overallNotes}
                                    onChange={(e) => setOverallNotes(e.target.value)}
                                    placeholder="General inspection notes"
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>

                            <button
                                disabled={loading || properties.length === 0}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Inspection"}
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
            </div>
        </div>
    );
}

function SelectBox({
    icon: Icon,
    label,
    value,
    onChange,
    options,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Icon size={18} className="text-emerald-600" />
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}