import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, DoorOpen, MapPin } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import AddPropertyModal from "./AddPropertyModal";
import EditPropertyModal from "./EditPropertyModal";
import DeletePropertyButton from "./DeletePropertyButton";
import Link from "next/link";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function CompanyPropertiesPage() {

    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/properties");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: companyId },
        include: { units: true },
        orderBy: { createdAt: "desc" },
    });

    const totalUnits = properties.reduce(
        (sum, property) => sum + property.units.length,
        0
    );

    const averageUnits = properties.length
        ? Math.round(totalUnits / properties.length)
        : 0;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Property Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Manage all rental properties for your company.
                        </p>
                    </div>

                    <AddPropertyModal />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Total Properties" value={properties.length} />
                <SummaryCard title="Total Units" value={totalUnits} success />
                <SummaryCard title="Average Units" value={averageUnits} />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Property List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Properties registered under this company.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Property
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Location
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Units
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
                                {properties.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center"
                                        >
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                <Building2 size={26} />
                                            </div>

                                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                                No properties yet
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Add the first rental property for this company.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    properties.map((property) => (
                                        <tr
                                            key={property.id}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <td className="px-2 py-2">
                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                    <Building2 size={13} />
                                                    {property.name}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin size={13} />
                                                    {property.location || "No location"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <DoorOpen size={13} />
                                                    {property.units.length}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                    ACTIVE
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <EditPropertyModal property={property} />

                                                    {isSuperAdmin ? (
                                                        <DeletePropertyButton
                                                            propertyId={property.id}
                                                            propertyName={property.name}
                                                            unitCount={property.units.length}
                                                            canDeleteAll={isSuperAdmin}
                                                        />
                                                    ) : null}
                                                    <Link
                                                        href={`/dashboard/company/properties/${property.id}/units`}
                                                        className="rounded bg-slate-950 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-emerald-600"
                                                    >
                                                        Units
                                                    </Link>

                                                    <Link
                                                        href={`/dashboard/company/properties/${property.id}/units?add=1`}
                                                        className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                    >
                                                        Add Unit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    success,
}: {
    title: string;
    value: number;
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