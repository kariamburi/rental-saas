import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import {
    BedDouble,
    ChevronDown,
    DoorOpen,
    Home,
    Percent,
    Wrench,
} from "lucide-react";
import type { ElementType } from "react";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function VacanciesPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/vacancies");


    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const units = await prisma.unit.findMany({
        where: { companyId: companyId },
        include: { property: true },
        orderBy: { createdAt: "desc" },
    });

    const totalUnits = units.length;
    const vacantUnits = units.filter((u) => u.status === "VACANT");
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED");
    const maintenanceUnits = units.filter((u) => u.status === "MAINTENANCE");

    const occupancyRate =
        totalUnits > 0 ? Math.round((occupiedUnits.length / totalUnits) * 100) : 0;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Vacancy Management
                </p>

                <h1 className="mt-3 text-3xl font-black">Vacant Units</h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                    Track available units, occupied rooms and units under maintenance.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard title="Total Units" value={totalUnits} icon={DoorOpen} />
                <SummaryCard title="Vacant Units" value={vacantUnits.length} icon={BedDouble} success />
                <SummaryCard title="Occupied Units" value={occupiedUnits.length} icon={Home} />
                <SummaryCard title="Maintenance" value={maintenanceUnits.length} icon={Wrench} warning />
                <SummaryCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={Percent} success />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Available Units
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Vacant units grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {vacantUnits.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <BedDouble size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No vacant units
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                All units are currently occupied or unavailable.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyUnits = units.filter(
                                    (unit) => unit.propertyId === property.id
                                );

                                const propertyVacantUnits = propertyUnits.filter(
                                    (unit) => unit.status === "VACANT"
                                );

                                const propertyOccupiedUnits = propertyUnits.filter(
                                    (unit) => unit.status === "OCCUPIED"
                                );

                                const propertyMaintenanceUnits = propertyUnits.filter(
                                    (unit) => unit.status === "MAINTENANCE"
                                );

                                const propertyOccupancyRate =
                                    propertyUnits.length > 0
                                        ? Math.round(
                                            (propertyOccupiedUnits.length /
                                                propertyUnits.length) *
                                            100
                                        )
                                        : 0;

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                                        <Home size={17} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-950">
                                                            {property.name}
                                                        </h3>

                                                        <p className="text-xs font-semibold text-slate-500">
                                                            {propertyVacantUnits.length} vacant •{" "}
                                                            {propertyOccupiedUnits.length} occupied •{" "}
                                                            {propertyMaintenanceUnits.length} maintenance
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Occupancy: {propertyOccupancyRate}%
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[850px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Rent
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="px-2 py-2 text-right font-bold">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyVacantUnits.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No vacant units for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyVacantUnits.map((unit) => (
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

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        unit.rentAmount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                                        {unit.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-right">
                                                                    <Link
                                                                        href={`/dashboard/company/tenants?unitId=${unit.id}`}
                                                                        className="inline-flex rounded bg-slate-950 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-emerald-600"
                                                                    >
                                                                        Create Tenant / Lease
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    icon: Icon,
    success,
    warning,
}: {
    title: string;
    value: number | string;
    icon: ElementType;
    success?: boolean;
    warning?: boolean;
}) {
    const valueClass = success
        ? "text-emerald-700"
        : warning
            ? "text-amber-700"
            : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={18} />
                </span>
            </div>

            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}