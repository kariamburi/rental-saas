import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DoorOpen, Home, Wallet } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import AddUnitModal from "@/app/(company-admin)/dashboard/company/units/AddUnitModal";
import EditUnitModal from "@/app/(company-admin)/dashboard/company/units/EditUnitModal";
import DeleteUnitButton from "@/app/(company-admin)/dashboard/company/units/DeleteUnitButton";

export default async function PropertyUnitsPage({
    params,
}: {
    params: { propertyId: string };
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const property = await prisma.property.findFirst({
        where: {
            id: params.propertyId,
            companyId: user.companyId,
        },
        include: {
            units: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!property) notFound();

    const properties = [property];

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <Link
                            href="/dashboard/company/properties"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to Properties
                        </Link>

                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Units
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{property.name}</h1>

                        <p className="mt-2 max-w-2xl text-slate-300">
                            Manage units only for this property.
                        </p>
                    </div>

                    <AddUnitModal properties={properties} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Units" value={property.units.length} />
                <SummaryCard
                    title="Vacant Units"
                    value={property.units.filter((u) => u.status === "VACANT").length}
                />
                <SummaryCard
                    title="Occupied Units"
                    value={property.units.filter((u) => u.status === "OCCUPIED").length}
                />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {property.units.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm md:col-span-2 xl:col-span-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <DoorOpen size={26} />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-slate-950">
                            No units yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Add units under {property.name}.
                        </p>
                    </div>
                ) : (
                    property.units.map((unit) => (
                        <div
                            key={unit.id}
                            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <DoorOpen size={24} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <EditUnitModal unit={unit} properties={properties} />

                                    <DeleteUnitButton
                                        unitId={unit.id}
                                        unitNumber={unit.unitNumber}
                                    />

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle(
                                            unit.status
                                        )}`}
                                    >
                                        {unit.status}
                                    </span>
                                </div>
                            </div>

                            <h2 className="mt-5 text-xl font-black text-slate-950">
                                Unit {unit.unitNumber}
                            </h2>

                            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <Home size={16} className="text-emerald-600" />
                                {property.name}
                            </div>

                            <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400">
                                        Monthly Rent
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-slate-950">
                                        KES {Number(unit.rentAmount).toLocaleString()}
                                    </p>
                                </div>
                                <Wallet className="text-emerald-600" size={26} />
                            </div>
                        </div>
                    ))
                )}
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

function statusStyle(status: string) {
    if (status === "OCCUPIED") return "bg-blue-50 text-blue-700";
    if (status === "VACANT") return "bg-emerald-50 text-emerald-700";
    if (status === "MAINTENANCE") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
}