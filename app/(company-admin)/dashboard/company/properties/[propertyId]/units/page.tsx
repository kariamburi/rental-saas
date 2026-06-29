import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    DoorOpen,
    Home,
    House,
    Wallet,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import AddUnitModal from "@/app/(company-admin)/dashboard/company/units/AddUnitModal";
import EditUnitModal from "@/app/(company-admin)/dashboard/company/units/EditUnitModal";
import DeleteUnitButton from "@/app/(company-admin)/dashboard/company/units/DeleteUnitButton";

export default async function PropertyUnitsPage({
    params,
}: {
    params: Promise<{ propertyId: string }>;
}) {
    const { propertyId } = await params;

    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            companyId: user.companyId,
        },
        include: {
            units: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!property) notFound();

    const properties = [property];

    const vacantUnits = property.units.filter((u) => u.status === "VACANT").length;
    const occupiedUnits = property.units.filter(
        (u) => u.status === "OCCUPIED"
    ).length;
    const maintenanceUnits = property.units.filter(
        (u) => u.status === "MAINTENANCE"
    ).length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <Link
                            href="/dashboard/company/properties"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to Properties
                        </Link>

                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Units
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{property.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Manage units only for this property.
                        </p>
                    </div>

                    <AddUnitModal properties={properties} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Units" value={property.units.length} />
                <SummaryCard title="Vacant Units" value={vacantUnits} success />
                <SummaryCard title="Occupied Units" value={occupiedUnits} />
                <SummaryCard title="Maintenance" value={maintenanceUnits} warning />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Units List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Units registered under {property.name}.
                            </p>
                        </div>
                    </div>

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
                                {property.units.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center"
                                        >
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                <DoorOpen size={26} />
                                            </div>

                                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                                No units yet
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Add units under {property.name}.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    property.units.map((unit) => (
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
                                                        properties={properties}
                                                    />

                                                    <DeleteUnitButton
                                                        unitId={unit.id}
                                                        unitNumber={unit.unitNumber}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    success,
    warning,
}: {
    title: string;
    value: number;
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
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}

function statusStyle(status: string) {
    if (status === "OCCUPIED") return "bg-blue-50 text-blue-700";
    if (status === "VACANT") return "bg-emerald-50 text-emerald-700";
    if (status === "MAINTENANCE") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
}