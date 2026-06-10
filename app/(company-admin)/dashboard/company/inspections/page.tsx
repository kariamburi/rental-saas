import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ClipboardCheck,
    DoorOpen,
    User,
} from "lucide-react";
import AddInspectionModal from "./AddInspectionModal";
import Link from "next/link";
import UpdateInspectionStatus from "./UpdateInspectionStatus";


export default async function InspectionsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const [properties, units, tenants, inspections] = await Promise.all([
        prisma.property.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: "desc" },
        }),

        prisma.unit.findMany({
            where: { companyId: user.companyId },
            include: { property: true },
            orderBy: { createdAt: "desc" },
        }),

        prisma.tenant.findMany({
            where: { companyId: user.companyId },
            include: {
                unit: {
                    include: { property: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),

        prisma.propertyInspection.findMany({
            where: { companyId: user.companyId },
            include: {
                property: true,
                unit: true,
                tenant: true,
                items: true,
            },
            orderBy: { inspectionDate: "desc" },
        }),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Inspections
                        </p>
                        <h1 className="mt-3 text-3xl font-black">Inspection Reports</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
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

            <div className="grid gap-5 md:grid-cols-4">
                <SummaryCard title="Total Inspections" value={inspections.length} />
                <SummaryCard
                    title="Pending"
                    value={inspections.filter((i) => i.status === "PENDING").length}
                />
                <SummaryCard
                    title="Completed"
                    value={inspections.filter((i) => i.status === "COMPLETED").length}
                />
                <SummaryCard
                    title="Issues Found"
                    value={inspections.filter((i) => i.status === "ISSUES_FOUND").length}
                />
            </div>

            <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Inspection List
                    </h2>
                    <p className="text-sm text-slate-500">
                        Property and unit inspection records
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Inspected By</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {inspections.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <ClipboardCheck size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No inspections yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add the first property or unit inspection.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                inspections.map((inspection) => (
                                    <tr
                                        key={inspection.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Building2 size={16} className="text-emerald-600" />
                                                {inspection.property.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {inspection.unit
                                                    ? `Unit ${inspection.unit.unitNumber}`
                                                    : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <User size={16} className="text-emerald-600" />
                                                {inspection.tenant ? inspection.tenant.name : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-black text-slate-700">
                                            {inspection.type}
                                        </td>

                                        <td className="px-6 py-4">

                                            <UpdateInspectionStatus
                                                inspectionId={inspection.id}
                                                currentStatus={inspection.status}
                                            />
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            {inspection.items.length}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {new Date(
                                                    inspection.inspectionDate
                                                ).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {inspection.inspectedBy || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/company/inspections/${inspection.id}`}
                                                className="rounded-xl cursor-pointer bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                            >
                                                View Report
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

function statusStyle(status: string) {
    if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
    if (status === "ISSUES_FOUND") return "bg-red-50 text-red-700";
    if (status === "PENDING") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
}

function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: number | string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}