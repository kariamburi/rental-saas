import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, DoorOpen, User, Wrench } from "lucide-react";
import AddMaintenanceModal from "./AddMaintenanceModal";
import UpdateMaintenanceStatus from "./UpdateMaintenanceStatus";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export default async function MaintenancePage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN) {
        redirect("/dashboard");
    }

    if (!user.companyId) {
        redirect("/dashboard");
    }

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
    });

    if (!company) redirect("/dashboard");

    const [properties, tenants, requests] = await Promise.all([
        prisma.property.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.tenant.findMany({
            where: { companyId: user.companyId },
            include: {
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.maintenanceRequest.findMany({
            where: { companyId: user.companyId },
            include: {
                tenant: true,
                property: true,
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Maintenance
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Track property repairs, tenant issues and maintenance progress.
                        </p>
                    </div>

                    <AddMaintenanceModal properties={properties} tenants={tenants} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-4">
                <SummaryCard title="Total Requests" value={requests.length} />
                <SummaryCard
                    title="Open"
                    value={requests.filter((r) => r.status === "OPEN").length}
                />
                <SummaryCard
                    title="In Progress"
                    value={requests.filter((r) => r.status === "IN_PROGRESS").length}
                />
                <SummaryCard
                    title="Resolved"
                    value={requests.filter((r) => r.status === "RESOLVED").length}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Maintenance Requests
                    </h2>
                    <p className="text-sm text-slate-500">
                        Requests from tenants, caretakers and property managers
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Issue</th>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <Wrench size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No maintenance requests yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add repair requests and track their progress.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-950">
                                                {request.title}
                                            </p>
                                            <p className="mt-1 max-w-sm text-sm font-semibold text-slate-500">
                                                {request.description}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Building2 size={16} className="text-emerald-600" />
                                                {request.property.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {request.unit
                                                    ? `Unit ${request.unit.unitNumber}`
                                                    : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <User size={16} className="text-emerald-600" />
                                                {request.tenant ? request.tenant.name : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <UpdateMaintenanceStatus
                                                requestId={request.id}
                                                currentStatus={request.status}
                                            />
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {new Date(request.createdAt).toLocaleDateString()}
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

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}