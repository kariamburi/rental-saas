"use client";

import { useMemo, useState } from "react";
import {
    Building2,
    ChevronDown,
    DoorOpen,
    Filter,
    Home,
    House,
    Wallet,
} from "lucide-react";
import AddUnitModal from "./AddUnitModal";
import EditUnitModal from "./EditUnitModal";
import DeleteUnitButton from "./DeleteUnitButton";

type UnitItem = {
    id: string;
    companyId: string;
    propertyId: string;
    unitNumber: string;
    unitSize?: string | null;
    rentAmount: any;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};

type PropertyItem = {
    id: string;
    name: string;
    location: string | null;
    units: UnitItem[];
};

export default function GroupedUnitsList({
    properties = [],
}: {
    properties?: PropertyItem[];
}) {
    const [openPropertyId, setOpenPropertyId] = useState<string | null>(
        properties.length > 0 ? properties[0].id : null
    );

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sizeFilter, setSizeFilter] = useState("ALL");

    const filteredProperties = useMemo(() => {
        return properties.map((property) => ({
            ...property,
            units: property.units.filter((unit) => {
                const matchesStatus =
                    statusFilter === "ALL" || unit.status === statusFilter;

                const matchesSize =
                    sizeFilter === "ALL" || unit.unitSize === sizeFilter;

                return matchesStatus && matchesSize;
            }),
        }));
    }, [properties, statusFilter, sizeFilter]);

    return (
        <div className="mt-8 space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Filter size={18} className="text-emerald-600" />
                    <h3 className="font-black text-slate-950">Filter Units</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="VACANT">Vacant</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                            Unit Size
                        </label>
                        <select
                            value={sizeFilter}
                            onChange={(e) => setSizeFilter(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="ALL">All Sizes</option>
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
            </div>

            {filteredProperties.map((property) => {
                const isOpen = openPropertyId === property.id;
                const vacant = property.units.filter((u) => u.status === "VACANT").length;
                const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
                const maintenance = property.units.filter(
                    (u) => u.status === "MAINTENANCE"
                ).length;

                return (
                    <div
                        key={property.id}
                        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                    >
                        <button
                            type="button"
                            onClick={() => setOpenPropertyId(isOpen ? null : property.id)}
                            className="flex w-full flex-col gap-4 p-6 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Building2 size={24} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-950">
                                        {property.name}
                                    </h2>
                                    <p className="text-sm font-semibold text-slate-500">
                                        {property.location || "No location"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge label="Units" value={property.units.length} />
                                <Badge label="Vacant" value={vacant} />
                                <Badge label="Occupied" value={occupied} />
                                <Badge label="Maintenance" value={maintenance} />

                                <ChevronDown
                                    size={22}
                                    className={`text-slate-500 transition ${isOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-slate-100 p-6">
                                <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                    <div>
                                        <h3 className="font-black text-slate-950">
                                            Units under {property.name}
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-500">
                                            Add, edit, delete and manage rent prices.
                                        </p>
                                    </div>

                                    <AddUnitModal properties={[property]} />
                                </div>

                                {property.units.length === 0 ? (
                                    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                        <DoorOpen size={26} className="mx-auto text-emerald-600" />
                                        <h3 className="mt-3 font-black text-slate-950">
                                            No units match this filter
                                        </h3>
                                    </div>
                                ) : (
                                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        {property.units.map((unit) => (
                                            <div
                                                key={unit.id}
                                                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                        <DoorOpen size={24} />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <EditUnitModal unit={unit} properties={[property]} />

                                                        <DeleteUnitButton
                                                            unitId={unit.id}
                                                            unitNumber={unit.unitNumber}
                                                        />

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle(
                                                                unit.status
                                                            )}`}
                                                        >
                                                            {unit.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h2 className="mt-5 text-xl font-black text-slate-950">
                                                    Unit {unit.unitNumber}
                                                </h2>

                                                {unit.unitSize && (
                                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                        <House size={14} />
                                                        {unit.unitSize}
                                                    </div>
                                                )}

                                                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                    <Home size={16} className="text-emerald-600" />
                                                    {property.name}
                                                </div>

                                                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-slate-400">
                                                            Monthly Rent
                                                        </p>
                                                        <p className="mt-1 text-2xl font-black text-slate-950">
                                                            KES {Number(unit.rentAmount).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <Wallet className="text-emerald-600" size={26} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function Badge({ label, value }: { label: string; value: number }) {
    return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {label}: {value}
        </span>
    );
}

function statusStyle(status: string) {
    if (status === "OCCUPIED") return "bg-blue-50 text-blue-700";
    if (status === "VACANT") return "bg-emerald-50 text-emerald-700";
    if (status === "MAINTENANCE") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
}