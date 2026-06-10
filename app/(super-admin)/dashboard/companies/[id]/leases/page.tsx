import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CalendarDays, DoorOpen, FileText, User, Wallet } from "lucide-react";
import AddLeaseModal from "./AddLeaseModal";
import EditLeaseModal from "./EditLeaseModal";
import EndLeaseButton from "./EndLeaseButton";
import Link from "next/link";

export default async function CompanyLeasesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
    });

    if (!company) notFound();

    const tenants = await prisma.tenant.findMany({
        where: { companyId: id, status: { in: ["ACTIVE", "NOTICE"] } },
        include: {
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const leases = await prisma.lease.findMany({
        where: { companyId: id },
        include: {
            tenant: true,
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
                            Lease Management
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Create and manage tenant lease agreements.
                        </p>
                    </div>

                    <AddLeaseModal companyId={company.id} tenants={tenants} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Leases" value={leases.length} />
                <SummaryCard
                    title="Active Leases"
                    value={leases.filter((l) => l.status === "ACTIVE").length}
                />
                <SummaryCard
                    title="Ended Leases"
                    value={leases.filter((l) => l.status === "ENDED").length}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Lease List</h2>
                    <p className="text-sm text-slate-500">
                        Tenant leases and rent agreement details
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Monthly Rent</th>
                                <th className="px-6 py-4">Charges</th>
                                <th className="px-6 py-4">Deposit</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">End Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {leases.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <FileText size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No leases yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Create the first lease for a tenant.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                leases.map((lease) => (
                                    <tr key={lease.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-950">
                                                        {lease.tenant.name}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-400">
                                                        {lease.tenant.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {lease.unit.property.name} - Unit {lease.unit.unitNumber}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(lease.monthlyRent).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            <div>Garbage: KES {Number(lease.garbageCharge).toLocaleString()}</div>
                                            <div>Security: KES {Number(lease.securityCharge).toLocaleString()}</div>
                                            <div>Service: KES {Number(lease.serviceCharge).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            KES {Number(lease.depositAmount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {new Date(lease.startDate).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {lease.endDate
                                                ? new Date(lease.endDate).toLocaleDateString()
                                                : "-"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle(
                                                    lease.status
                                                )}`}
                                            >
                                                {lease.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/dashboard/companies/${id}/leases/${lease.id}/agreement`}
                                                    className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                                >
                                                    Agreement
                                                </Link>
                                                <EditLeaseModal lease={lease} />
                                                {lease.status === "ACTIVE" && <EndLeaseButton leaseId={lease.id} />}
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
    if (status === "ENDED") return "bg-slate-100 text-slate-600";
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