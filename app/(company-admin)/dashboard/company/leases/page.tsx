import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    DoorOpen,
    FileText,
    User,
    Wallet,
} from "lucide-react";
import AddLeaseModal from "./AddLeaseModal";
import EditLeaseModal from "./EditLeaseModal";
import EndLeaseButton from "./EndLeaseButton";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyLeasesPage({
    searchParams,
}: {
    searchParams: Promise<{ tenantId?: string }>;
}) {
    const { tenantId } = await searchParams;
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/leases");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        orderBy: { name: "asc" },
    });

    const tenants = await prisma.tenant.findMany({
        where: {
            companyId: companyId,
            status: { in: ["ACTIVE", "NOTICE"] },
        },
        include: {
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const leases = await prisma.lease.findMany({
        where: { companyId: companyId },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const activeLeases = leases.filter((lease) => lease.status === "ACTIVE");
    const endedLeases = leases.filter((lease) => lease.status === "ENDED");

    const totalActiveRent = activeLeases.reduce(
        (sum, lease) => sum + Number(lease.monthlyRent || 0),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Lease Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Create and manage tenant lease agreements.
                        </p>
                    </div>

                    <AddLeaseModal
                        properties={properties}
                        tenants={tenants}
                        selectedTenantId={tenantId}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Leases" value={leases.length} />
                <SummaryCard title="Active Leases" value={activeLeases.length} success />
                <SummaryCard title="Ended Leases" value={endedLeases.length} />
                <SummaryCard
                    title="Active Monthly Rent"
                    value={`KES ${totalActiveRent.toLocaleString()}`}
                    success
                />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Lease List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Leases grouped by property. Click a property to expand.
                            </p>
                        </div>
                    </div>

                    {leases.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <FileText size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                No leases yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Create the first lease for a tenant.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => {
                                const propertyLeases = leases.filter(
                                    (lease) => lease.unit.property.id === property.id
                                );

                                const propertyActiveLeases = propertyLeases.filter(
                                    (lease) => lease.status === "ACTIVE"
                                );

                                const propertyEndedLeases = propertyLeases.filter(
                                    (lease) => lease.status === "ENDED"
                                );

                                const propertyMonthlyRent = propertyActiveLeases.reduce(
                                    (sum, lease) => sum + Number(lease.monthlyRent || 0),
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
                                                            {propertyLeases.length} lease(s) •{" "}
                                                            {propertyActiveLeases.length} active •{" "}
                                                            {propertyEndedLeases.length} ended
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                        Active Rent: KES{" "}
                                                        {propertyMonthlyRent.toLocaleString()}
                                                    </div>

                                                    <ChevronDown
                                                        size={18}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="overflow-x-auto border-t border-slate-200">
                                            <table className="w-full min-w-[1150px] border-collapse text-[12px]">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-900">
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Tenant
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Unit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Monthly Rent
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Charges
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Deposit
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Start Date
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            End Date
                                                        </th>
                                                        <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                            Status
                                                        </th>
                                                        <th className="px-2 py-2 text-left font-bold">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {propertyLeases.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={9}
                                                                className="px-5 py-8 text-center text-slate-500"
                                                            >
                                                                No leases for this property.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        propertyLeases.map((lease) => (
                                                            <tr
                                                                key={lease.id}
                                                                className="border-b hover:bg-slate-50"
                                                            >
                                                                <td className="px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                                            <User size={15} />
                                                                        </div>

                                                                        <div>
                                                                            <p className="font-semibold text-slate-900">
                                                                                {lease.tenant.name}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-500">
                                                                                {lease.tenant.phone}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <DoorOpen size={13} />
                                                                        Unit {lease.unit.unitNumber}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Wallet size={13} />
                                                                        KES{" "}
                                                                        {Number(
                                                                            lease.monthlyRent || 0
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <div>
                                                                        Garbage: KES{" "}
                                                                        {Number(
                                                                            lease.garbageCharge || 0
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                    <div>
                                                                        Security: KES{" "}
                                                                        {Number(
                                                                            lease.securityCharge || 0
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                    <div>
                                                                        Service: KES{" "}
                                                                        {Number(
                                                                            lease.serviceCharge || 0
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                    KES{" "}
                                                                    {Number(
                                                                        lease.depositAmount || 0
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <CalendarDays size={13} />
                                                                        {new Date(
                                                                            lease.startDate
                                                                        ).toLocaleDateString("en-KE")}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                    {lease.endDate
                                                                        ? new Date(
                                                                            lease.endDate
                                                                        ).toLocaleDateString("en-KE")
                                                                        : "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(
                                                                            lease.status
                                                                        )}`}
                                                                    >
                                                                        {lease.status}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Link
                                                                            href={`/dashboard/company/leases/${lease.id}/agreement`}
                                                                            className="rounded bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                                                        >
                                                                            Agreement
                                                                        </Link>

                                                                        <EditLeaseModal lease={lease} />

                                                                        {lease.status === "ACTIVE" && (
                                                                            <EndLeaseButton
                                                                                leaseId={lease.id}
                                                                            />
                                                                        )}
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
    if (status === "ENDED") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-700";
}

function SummaryCard({
    title,
    value,
    success,
}: {
    title: string;
    value: number | string;
    success?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2
                className={`mt-2 text-2xl font-black ${success ? "text-emerald-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}