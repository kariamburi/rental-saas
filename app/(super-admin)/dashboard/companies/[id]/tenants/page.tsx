import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DoorOpen, IdCard, Phone, User } from "lucide-react";
import AddTenantModal from "./AddTenantModal";
import DeleteTenantButton from "./DeleteTenantButton";
import EditTenantModal from "./EditTenantModal";
import Link from "next/link";

export default async function CompanyTenantsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
    });

    if (!company) notFound();

    const units = await prisma.unit.findMany({
        where: { companyId: id },
        include: { property: true },
        orderBy: { createdAt: "desc" },
    });

    const tenants = await prisma.tenant.findMany({
        where: { companyId: id },
        include: {
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Tenant Management
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Register tenants, assign units, and track occupancy.
                        </p>
                    </div>

                    <AddTenantModal companyId={company.id} units={units} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Tenants" value={tenants.length} />
                <SummaryCard
                    title="Active Tenants"
                    value={tenants.filter((t) => t.status === "ACTIVE").length}
                />
                <SummaryCard
                    title="On Notice"
                    value={tenants.filter((t) => t.status === "NOTICE").length}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Tenant List</h2>
                    <p className="text-sm text-slate-500">
                        All tenants registered under this company
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">ID Number</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Move-in</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <User size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No tenants yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add your first tenant and assign a vacant unit.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/dashboard/companies/${id}/tenants/${tenant.id}`}
                                                        className="font-black text-slate-950 hover:text-emerald-600"
                                                    >
                                                        {tenant.name}
                                                    </Link>
                                                    <p className="text-xs font-semibold text-slate-400">
                                                        {tenant.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Phone size={16} className="text-emerald-600" />
                                                {tenant.phone}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <IdCard size={16} className="text-emerald-600" />
                                                {tenant.idNumber || "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {tenant.unit
                                                    ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}`
                                                    : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {tenant.moveInDate
                                                ? new Date(tenant.moveInDate).toLocaleDateString()
                                                : "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle(
                                                    tenant.status
                                                )}`}
                                            >
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                <EditTenantModal tenant={tenant} units={units} />
                                                <DeleteTenantButton tenantId={tenant.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

function statusStyle(status: string) {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
    if (status === "NOTICE") return "bg-amber-50 text-amber-700";
    if (status === "VACATED") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-700";
}

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}