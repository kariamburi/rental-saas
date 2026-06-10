import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { BedDouble, DoorOpen, Home, Percent, Wrench } from "lucide-react";

export default async function VacanciesPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN) {
        redirect("/dashboard");
    }

    if (!user.companyId) {
        redirect("/dashboard");
    }

    const units = await prisma.unit.findMany({
        where: { companyId: user.companyId },
        include: { property: true },
        orderBy: { createdAt: "desc" },
    });

    const totalUnits = units.length;
    const vacantUnits = units.filter((u) => u.status === "VACANT");
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED");
    const maintenanceUnits = units.filter((u) => u.status === "MAINTENANCE");

    const occupancyRate =
        totalUnits > 0 ? Math.round((occupiedUnits.length / totalUnits) * 100) : 0;

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Vacancy Management
                </p>

                <h1 className="mt-3 text-3xl font-black">Vacant Units</h1>

                <p className="mt-2 max-w-2xl text-slate-300">
                    Track available units, occupied rooms and units under maintenance.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard title="Total Units" value={totalUnits} icon={DoorOpen} />
                <SummaryCard title="Vacant Units" value={vacantUnits.length} icon={BedDouble} />
                <SummaryCard title="Occupied Units" value={occupiedUnits.length} icon={Home} />
                <SummaryCard title="Maintenance" value={maintenanceUnits.length} icon={Wrench} />
                <SummaryCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={Percent} />
            </div>

            <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                    <h2 className="text-lg font-black text-slate-950">
                        Available Units
                    </h2>
                    <p className="text-sm text-slate-500">
                        Units ready for tenant assignment and lease creation.
                    </p>
                </div>

                {vacantUnits.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <BedDouble size={26} />
                        </div>

                        <h3 className="mt-4 text-lg font-black text-slate-950">
                            No vacant units
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            All units are currently occupied or unavailable.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Unit</th>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Rent</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {vacantUnits.map((unit) => (
                                    <tr key={unit.id}>
                                        <td className="px-6 py-4 font-black text-slate-900">
                                            Unit {unit.unitNumber}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {unit.property.name}
                                        </td>

                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            KES {Number(unit.rentAmount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {unit.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/company/tenants?unitId=${unit.id}`}
                                                className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-600"
                                            >
                                                Create Tenant / Lease
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon size={20} />
                </span>
            </div>

            <h2 className="mt-4 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}