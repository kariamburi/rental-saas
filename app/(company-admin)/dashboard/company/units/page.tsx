import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DoorOpen } from "lucide-react";
import AddUnitModal from "./AddUnitModal";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import GroupedUnitsList from "./GroupedUnitsList";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyUnitsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/units");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        include: {
            units: {
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const units = properties.flatMap((property) => property.units);

    const vacantUnits = units.filter((u) => u.status === "VACANT").length;
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
    const maintenanceUnits = units.filter(
        (u) => u.status === "MAINTENANCE"
    ).length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Unit Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Manage rental units grouped by property, size, rent and
                            occupancy status.
                        </p>
                    </div>

                    <AddUnitModal
                        properties={properties.map((property) => ({
                            id: property.id,
                            name: property.name,
                        }))}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Units" value={units.length} />
                <SummaryCard title="Vacant Units" value={vacantUnits} success />
                <SummaryCard title="Occupied Units" value={occupiedUnits} />
                <SummaryCard title="Maintenance" value={maintenanceUnits} warning />
            </div>

            {properties.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <DoorOpen size={26} />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950">
                        No properties yet
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Add properties first, then add units.
                    </p>
                </div>
            ) : (
                <GroupedUnitsList properties={properties} />
            )}
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