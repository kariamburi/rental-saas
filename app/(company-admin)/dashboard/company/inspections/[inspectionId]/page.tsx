import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect, notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import CreateMaintenanceFromInspectionButton from "./CreateMaintenanceFromInspectionButton";


export default async function InspectionReportPage({
    params,
}: {
    params: Promise<{ inspectionId: string }>;
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const { inspectionId } = await params;

    const inspection = await prisma.propertyInspection.findFirst({
        where: {
            id: inspectionId,
            companyId: user.companyId,
        },
        include: {
            company: true,
            property: true,
            unit: true,
            tenant: true,
            items: true,
        },
    });

    if (!inspection) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
            <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-xl print:max-w-none print:rounded-none print:p-6 print:shadow-none">
                <div className="mb-4 flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-1 text-2xl font-black text-slate-950">
                            Property Inspection Report
                        </h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Report No: INS-{inspection.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <div className="text-right">
                        <PrintButton />
                        <CreateMaintenanceFromInspectionButton inspectionId={inspection.id} />
                        <p className="mt-2 text-sm font-black text-slate-950 print:mt-0">
                            {inspection.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {inspection.company.phone || ""}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Info title="Property" value={inspection.property.name} />
                    <Info
                        title="Unit"
                        value={inspection.unit ? `Unit ${inspection.unit.unitNumber}` : "-"}
                    />
                    <Info
                        title="Tenant"
                        value={inspection.tenant ? inspection.tenant.name : "-"}
                    />
                    <Info title="Type" value={inspection.type} />
                    <Info title="Status" value={inspection.status} />
                    <Info
                        title="Inspection Date"
                        value={new Date(inspection.inspectionDate).toLocaleDateString()}
                    />
                    <Info title="Inspected By" value={inspection.inspectedBy || "-"} />
                    <Info
                        title="Generated On"
                        value={new Date().toLocaleDateString()}
                    />
                </div>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="bg-slate-950 px-4 py-3 text-white">
                        <h2 className="text-sm font-black uppercase tracking-wider">
                            Inspection Checklist
                        </h2>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Area</th>
                                <th className="px-4 py-3">Condition</th>
                                <th className="px-4 py-3">Notes</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {inspection.items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-8 text-center font-semibold text-slate-500"
                                    >
                                        No checklist items recorded.
                                    </td>
                                </tr>
                            ) : (
                                inspection.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-bold text-slate-800">
                                            {item.area}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${conditionStyle(
                                                    item.condition
                                                )}`}
                                            >
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-600">
                                            {item.notes || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>

                {inspection.overallNotes && (
                    <section className="mt-5 rounded-2xl border border-slate-200 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Overall Notes
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm font-semibold text-slate-700">
                            {inspection.overallNotes}
                        </p>
                    </section>
                )}

                <div className="mt-6 grid grid-cols-2 gap-6 text-xs">
                    <div>
                        <p className="font-black text-slate-700">Inspected By</p>
                        <div className="mt-8 border-t border-slate-400 pt-1 text-slate-500">
                            Signature
                        </div>
                    </div>

                    <div>
                        <p className="font-black text-slate-700">
                            Tenant / Representative
                        </p>
                        <div className="mt-8 border-t border-slate-400 pt-1 text-slate-500">
                            Signature
                        </div>
                    </div>
                </div>

                <p className="mt-5 border-t border-slate-200 pt-3 text-center text-[10px] font-semibold text-slate-400">
                    Powered by Craft Inventors
                </p>
            </div>
        </main>
    );
}

function Info({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 p-3 print:p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {title}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
        </div>
    );
}

function conditionStyle(condition: string) {
    if (condition === "GOOD") return "bg-emerald-50 text-emerald-700";
    if (condition === "FAIR") return "bg-blue-50 text-blue-700";
    if (condition === "POOR") return "bg-amber-50 text-amber-700";
    if (condition === "DAMAGED") return "bg-red-50 text-red-700";
    if (condition === "NEEDS_REPAIR") return "bg-red-50 text-red-700";
    return "bg-slate-100 text-slate-700";
}