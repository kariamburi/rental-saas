import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DoorOpen } from "lucide-react";
import AddUnitModal from "./AddUnitModal";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import GroupedUnitsList from "./GroupedUnitsList";

export default async function CompanyUnitsPage() {
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

    const properties = await prisma.property.findMany({
        where: {
            companyId: user.companyId,
        },
        include: {
            units: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const units = properties.flatMap((property) => property.units);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Unit Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-slate-300">
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

            <div className="grid gap-5 md:grid-cols-4">
                <SummaryCard title="Total Units" value={units.length} />

                <SummaryCard
                    title="Vacant Units"
                    value={units.filter((u) => u.status === "VACANT").length}
                />

                <SummaryCard
                    title="Occupied Units"
                    value={units.filter((u) => u.status === "OCCUPIED").length}
                />

                <SummaryCard
                    title="Maintenance"
                    value={units.filter((u) => u.status === "MAINTENANCE").length}
                />
            </div>

            {properties.length === 0 ? (
                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
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

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}