import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    DoorOpen,
    IdCard,
    Phone,
    User,
} from "lucide-react";
import AddTenantModal from "./AddTenantModal";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import EditTenantModal from "./EditTenantModal";
import DeleteTenantButton from "./DeleteTenantButton";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyTenantsPage({
    searchParams,
}: {
    searchParams: Promise<{ unitId?: string }>;
}) {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/tenants");


    const { unitId } = await searchParams;

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const units = await prisma.unit.findMany({
        where: { companyId: companyId },
        include: { property: true },
        orderBy: { createdAt: "desc" },
    });


    const tenants = await prisma.tenant.findMany({
        where: { companyId },
        include: {
            unit: {
                include: { property: true },
            },
            leases: {
                where: { status: "ACTIVE" },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const activeTenants = tenants.filter((tenant) => tenant.status === "ACTIVE");
    const noticeTenants = tenants.filter((tenant) => tenant.status === "NOTICE");
    const vacatedTenants = tenants.filter((tenant) => tenant.status === "VACATED");

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Tenant Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Register tenants, assign units, and track occupancy.
                        </p>
                    </div>

                    <AddTenantModal
                        properties={properties}
                        units={units}
                        selectedUnitId={unitId}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Tenants" value={tenants.length} />
                <SummaryCard title="Active Tenants" value={activeTenants.length} success />
                <SummaryCard title="On Notice" value={noticeTenants.length} warning />
                <SummaryCard title="Vacated" value={vacatedTenants.length} />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Tenant List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Tenants grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {tenants.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <User size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No tenants yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Add your first tenant and assign a vacant unit.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyTenants = tenants.filter(
                                    (tenant) => tenant.unit?.property?.id === property.id
                                );

                                const propertyActiveTenants = propertyTenants.filter(
                                    (tenant) => tenant.status === "ACTIVE"
                                );

                                const propertyNoticeTenants = propertyTenants.filter(
                                    (tenant) => tenant.status === "NOTICE"
                                );

                                const propertyVacatedTenants = propertyTenants.filter(
                                    (tenant) => tenant.status === "VACATED"
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
                                                            {propertyTenants.length} tenant(s) •{" "}
                                                            {propertyActiveTenants.length} active •{" "}
                                                            {propertyNoticeTenants.length} notice •{" "}
                                                            {propertyVacatedTenants.length} vacated
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Active: {propertyActiveTenants.length}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[950px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Phone
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            ID Number
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Move-in
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
                                                    {propertyTenants.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={7}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No tenants for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyTenants.map((tenant) => (
                                                            <tr
                                                                key={tenant.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                                            <User size={15} />
                                                                        </div>

                                                                        <div>
                                                                            <Link
                                                                                href={`/dashboard/company/tenants/${tenant.id}`}
                                                                                className="font-semibold text-slate-900 hover:text-emerald-600"
                                                                            >
                                                                                {tenant.name}
                                                                            </Link>

                                                                            <p className="text-[11px] text-slate-500">
                                                                                {tenant.email || "No email"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Phone size={13} />
                                                                        {tenant.phone}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <IdCard size={13} />
                                                                        {tenant.idNumber || "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        {tenant.unit
                                                                            ? `Unit ${tenant.unit.unitNumber}`
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {tenant.moveInDate
                                                                            ? new Date(
                                                                                tenant.moveInDate
                                                                            ).toLocaleDateString("en-KE")
                                                                            : "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(
                                                                            tenant.status
                                                                        )}`}
                                                                    >
                                                                        {tenant.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {tenant.leases.length === 0 ? (
                                                                            <Link
                                                                                href={`/dashboard/company/leases?tenantId=${tenant.id}`}
                                                                                className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                                            >
                                                                                Add Lease
                                                                            </Link>
                                                                        ) : (
                                                                            <Link
                                                                                href={`/dashboard/company/leases/${tenant.leases[0].id}/agreement`}
                                                                                className="rounded bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                                                            >
                                                                                Agreement
                                                                            </Link>
                                                                        )}
                                                                        <EditTenantModal
                                                                            tenant={tenant}
                                                                            units={units}
                                                                        />

                                                                        <DeleteTenantButton
                                                                            tenantId={tenant.id}
                                                                        />
                                                                    </div>
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

function statusStyle(status: string) {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
    if (status === "NOTICE") return "bg-amber-50 text-amber-700";
    if (status === "VACATED") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-700";
}

function SummaryCard({
    title,
    value,
    success,
    warning,
}: {
    title: string;
    value: number | string;
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