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

                const matchesSize = sizeFilter === "ALL" || unit.unitSize === sizeFilter;

                return matchesStatus && matchesSize;
            }),
        }));
    }, [properties, statusFilter, sizeFilter]);

    return (
        <section className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Unit List
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Units grouped by property. Filter by status or unit size.
                        </p>
                    </div>
                </div>

                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Filter size={16} className="text-emerald-600" />
                        <h3 className="text-sm font-black text-slate-950">
                            Filter Units
                        </h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="VACANT">Vacant</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>

                        <select
                            value={sizeFilter}
                            onChange={(e) => setSizeFilter(e.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

                <div className="space-y-3">
                    {filteredProperties.map((property) => {
                        const isOpen = openPropertyId === property.id;
                        const vacant = property.units.filter(
                            (u) => u.status === "VACANT"
                        ).length;
                        const occupied = property.units.filter(
                            (u) => u.status === "OCCUPIED"
                        ).length;
                        const maintenance = property.units.filter(
                            (u) => u.status === "MAINTENANCE"
                        ).length;

                        return (
                            <div
                                key={property.id}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenPropertyId(isOpen ? null : property.id)
                                    }
                                    className="flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                            <Building2 size={17} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-black text-slate-950">
                                                {property.name}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-500">
                                                {property.location || "No location"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge label="Units" value={property.units.length} />
                                        <Badge label="Vacant" value={vacant} success />
                                        <Badge label="Occupied" value={occupied} />
                                        <Badge label="Maintenance" value={maintenance} warning />

                                        <ChevronDown
                                            size={18}
                                            className={`text-slate-500 transition ${isOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-slate-200 p-4">
                                        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-950">
                                                    Units under {property.name}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500">
                                                    Add, edit, delete and manage rent prices.
                                                </p>
                                            </div>

                                            <AddUnitModal properties={[property]} />
                                        </div>

                                        {property.units.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                                                <DoorOpen
                                                    size={26}
                                                    className="mx-auto text-emerald-600"
                                                />
                                                <h3 className="mt-3 font-black text-slate-950">
                                                    No units match this filter
                                                </h3>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[900px] border-collapse text-[12px]">
                                                    <thead>
                                                        <tr className="bg-slate-100 text-slate-900">
                                                            <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                Unit
                                                            </th>
                                                            <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                Size
                                                            </th>
                                                            <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                Property
                                                            </th>
                                                            <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                Monthly Rent
                                                            </th>
                                                            <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                Status
                                                            </th>
                                                            <th className="px-2 py-2 text-left font-bold">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {property.units.map((unit) => (
                                                            <tr
                                                                key={unit.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-900">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        Unit {unit.unitNumber}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    {unit.unitSize ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                                            <House size={13} />
                                                                            {unit.unitSize}
                                                                        </span>
                                                                    ) : (
                                                                        "-"
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Home size={13} />
                                                                        {property.name}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Wallet size={13} />
                                                                        KES{" "}
                                                                        {Number(
                                                                            unit.rentAmount || 0
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(
                                                                            unit.status
                                                                        )}`}
                                                                    >
                                                                        {unit.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <EditUnitModal
                                                                            unit={unit}
                                                                            properties={[property]}
                                                                        />

                                                                        <DeleteUnitButton
                                                                            unitId={unit.id}
                                                                            unitNumber={unit.unitNumber}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function Badge({
    label,
    value,
    success,
    warning,
}: {
    label: string;
    value: number;
    success?: boolean;
    warning?: boolean;
}) {
    const cls = success
        ? "bg-emerald-50 text-emerald-700"
        : warning
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${cls}`}>
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