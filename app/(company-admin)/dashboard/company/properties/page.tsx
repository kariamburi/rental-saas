import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, DoorOpen, MapPin } from "lucide-react";
import AddPropertyModal from "./AddPropertyModal";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";

export default async function CompanyPropertiesPage() {
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
        where: { companyId: user.companyId },
        include: { units: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Management
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Manage all rental properties for your company.
                        </p>
                    </div>

                    <AddPropertyModal />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Properties" value={properties.length} />
                <SummaryCard
                    title="Total Units"
                    value={properties.reduce((sum, p) => sum + p.units.length, 0)}
                />
                <SummaryCard
                    title="Average Units"
                    value={
                        properties.length
                            ? Math.round(
                                properties.reduce((sum, p) => sum + p.units.length, 0) /
                                properties.length
                            )
                            : 0
                    }
                />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {properties.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm md:col-span-2 xl:col-span-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Building2 size={26} />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-slate-950">
                            No properties yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Add the first rental property for this company.
                        </p>
                    </div>
                ) : (
                    properties.map((property) => (
                        <div
                            key={property.id}
                            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Building2 size={24} />
                                </div>

                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                    ACTIVE
                                </span>
                            </div>

                            <h2 className="mt-5 text-xl font-black text-slate-950">
                                {property.name}
                            </h2>

                            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <MapPin size={16} className="text-emerald-600" />
                                {property.location || "No location"}
                            </div>

                            <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400">
                                        Units
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-slate-950">
                                        {property.units.length}
                                    </p>
                                </div>
                                <DoorOpen className="text-emerald-600" size={26} />
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