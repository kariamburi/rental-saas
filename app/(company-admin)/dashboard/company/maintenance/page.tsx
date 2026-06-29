import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    DoorOpen,
    User,
    Wrench,
} from "lucide-react";
import AddMaintenanceModal from "./AddMaintenanceModal";
import UpdateMaintenanceStatus from "./UpdateMaintenanceStatus";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function MaintenancePage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/maintenance");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const [properties, tenants, requests] = await Promise.all([
        prisma.property.findMany({
            where: { companyId: companyId },
            orderBy: { name: "asc" },
        }),

        prisma.tenant.findMany({
            where: { companyId: companyId },
            include: { unit: true },
            orderBy: { createdAt: "desc" },
        }),

        prisma.maintenanceRequest.findMany({
            where: { companyId: companyId },
            include: {
                tenant: true,
                property: true,
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const totalRequests = requests.length;
    const openRequests = requests.filter((r) => r.status === "OPEN").length;
    const inProgressRequests = requests.filter(
        (r) => r.status === "IN_PROGRESS"
    ).length;
    const resolvedRequests = requests.filter((r) => r.status === "RESOLVED").length;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Maintenance
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Track property repairs, tenant issues and maintenance progress.
                        </p>
                    </div>

                    <AddMaintenanceModal properties={properties} tenants={tenants} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Requests" value={totalRequests} />
                <SummaryCard title="Open" value={openRequests} danger />
                <SummaryCard title="In Progress" value={inProgressRequests} warning />
                <SummaryCard title="Resolved" value={resolvedRequests} success />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Maintenance Requests
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Requests grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {requests.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Wrench size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No maintenance requests yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Add repair requests and track their progress.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyRequests = requests.filter(
                                    (request) => request.propertyId === property.id
                                );

                                const propertyOpenRequests = propertyRequests.filter(
                                    (request) => request.status === "OPEN"
                                );

                                const propertyInProgressRequests = propertyRequests.filter(
                                    (request) => request.status === "IN_PROGRESS"
                                );

                                const propertyResolvedRequests = propertyRequests.filter(
                                    (request) => request.status === "RESOLVED"
                                );

                                const activeRequests =
                                    propertyOpenRequests.length +
                                    propertyInProgressRequests.length;

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
                                                            {propertyRequests.length} request(s) •{" "}
                                                            {propertyOpenRequests.length} open •{" "}
                                                            {propertyInProgressRequests.length} in progress •{" "}
                                                            {propertyResolvedRequests.length} resolved
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Active: {activeRequests}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1000px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Issue
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Created
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyRequests.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No maintenance requests for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyRequests.map((request) => (
                                                            <tr
                                                                key={request.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="px-2 py-2">
                                                                    <p className="font-semibold text-slate-900">
                                                                        {request.title}
                                                                    </p>

                                                                    <p className="mt-0.5 max-w-md text-[11px] font-semibold text-slate-500">
                                                                        {request.description}
                                                                    </p>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        {request.unit
                                                                            ? `Unit ${request.unit.unitNumber}`
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1 font-semibold">
                                                                        <User size={13} />
                                                                        {request.tenant
                                                                            ? request.tenant.name
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <UpdateMaintenanceStatus
                                                                        requestId={request.id}
                                                                        currentStatus={request.status}
                                                                    />
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            request.createdAt
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
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
    warning,
    success,
}: {
    title: string;
    value: number;
    danger?: boolean;
    warning?: boolean;
    success?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : warning
            ? "text-amber-700"
            : success
                ? "text-emerald-700"
                : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}