import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    ClipboardCheck,
    DoorOpen,
    User,
} from "lucide-react";
import AddInspectionModal from "./AddInspectionModal";
import Link from "next/link";
import UpdateInspectionStatus from "./UpdateInspectionStatus";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function InspectionsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/inspections");

    const [properties, units, tenants, inspections] = await Promise.all([
        prisma.property.findMany({
            where: { companyId: companyId },
            orderBy: { name: "asc" },
        }),

        prisma.unit.findMany({
            where: { companyId: companyId },
            include: { property: true },
            orderBy: { createdAt: "desc" },
        }),

        prisma.tenant.findMany({
            where: { companyId: companyId },
            include: {
                unit: {
                    include: { property: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),

        prisma.propertyInspection.findMany({
            where: { companyId: companyId },
            include: {
                property: true,
                unit: true,
                tenant: true,
                items: true,
            },
            orderBy: { inspectionDate: "desc" },
        }),
    ]);

    const totalInspections = inspections.length;
    const pendingInspections = inspections.filter(
        (inspection) => inspection.status === "PENDING"
    ).length;
    const completedInspections = inspections.filter(
        (inspection) => inspection.status === "COMPLETED"
    ).length;
    const issuesFoundInspections = inspections.filter(
        (inspection) => inspection.status === "ISSUES_FOUND"
    ).length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Inspections
                        </p>
                        <h1 className="mt-3 text-3xl font-black">
                            Inspection Reports
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Record property condition, unit checks, tenant move-in/move-out
                            inspections and routine reports.
                        </p>
                    </div>

                    <AddInspectionModal
                        properties={properties}
                        units={units}
                        tenants={tenants}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Inspections" value={totalInspections} />
                <SummaryCard title="Pending" value={pendingInspections} />
                <SummaryCard title="Completed" value={completedInspections} />
                <SummaryCard title="Issues Found" value={issuesFoundInspections} danger />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Inspection List
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Inspections grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {inspections.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <ClipboardCheck size={26} />
                            </div>
                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No inspections yet
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Add the first property or unit inspection.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyInspections = inspections.filter(
                                    (inspection) => inspection.propertyId === property.id
                                );

                                const pending = propertyInspections.filter(
                                    (inspection) => inspection.status === "PENDING"
                                ).length;

                                const completed = propertyInspections.filter(
                                    (inspection) => inspection.status === "COMPLETED"
                                ).length;

                                const issuesFound = propertyInspections.filter(
                                    (inspection) => inspection.status === "ISSUES_FOUND"
                                ).length;

                                const totalItems = propertyInspections.reduce(
                                    (sum, inspection) => sum + inspection.items.length,
                                    0
                                );

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                                        <Building2 size={17} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-950">
                                                            {property.name}
                                                        </h3>

                                                        <p className="text-xs font-semibold text-slate-500">
                                                            {propertyInspections.length} inspection(s) •{" "}
                                                            {pending} pending • {completed} completed •{" "}
                                                            {issuesFound} issues found
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Items: {totalItems}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1050px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Type
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Items
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Date
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Inspected By
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyInspections.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={8}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No inspections for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyInspections.map((inspection) => (
                                                            <tr
                                                                key={inspection.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        {inspection.unit
                                                                            ? `Unit ${inspection.unit.unitNumber}`
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="px-2 py-2">
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                                        <User size={13} />
                                                                        {inspection.tenant
                                                                            ? inspection.tenant.name
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                    {inspection.type}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <UpdateInspectionStatus
                                                                        inspectionId={inspection.id}
                                                                        currentStatus={inspection.status}
                                                                    />
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    {inspection.items.length}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            inspection.inspectionDate
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    {inspection.inspectedBy || "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <Link
                                                                        href={`/dashboard/company/inspections/${inspection.id}`}
                                                                        className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                    >
                                                                        View
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
    danger,
}: {
    title: string;
    value: number | string;
    danger?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2
                className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}