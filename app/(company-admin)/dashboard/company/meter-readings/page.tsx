import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Gauge } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import MeterReadingsClient from "./MeterReadingsClient";

export default async function MeterReadingsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");
    if (user.role !== Roles.COMPANY_ADMIN) redirect("/dashboard");
    if (!user.companyId) redirect("/dashboard");

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
    });

    if (!company) redirect("/dashboard");

    const properties = await prisma.property.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: "asc" },
    });

    const tenants = await prisma.tenant.findMany({
        where: {
            companyId: user.companyId,
            status: { in: ["ACTIVE", "NOTICE"] },
            unitId: { not: null },
        },
        include: {
            unit: {
                include: { property: true },
            },
        },
        orderBy: { name: "asc" },
    });

    const readings = await prisma.meterReading.findMany({
        where: { companyId: user.companyId },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const totalAmount = readings.reduce(
        (sum, reading) => sum + Number(reading.amount),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Meter Readings
                    </p>
                    <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                    <p className="mt-2 max-w-2xl text-slate-300">
                        Select property, filter tenants, record water and electricity usage,
                        then generate tenant invoice.
                    </p>
                </div>
            </div>

            <div className="mb-8 grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Readings" value={readings.length} />
                <SummaryCard
                    title="Water Readings"
                    value={readings.filter((r) => r.type === "WATER").length}
                />
                <SummaryCard
                    title="Total Amount"
                    value={`KES ${totalAmount.toLocaleString()}`}
                />
            </div>

            {properties.length === 0 || tenants.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Gauge size={26} />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">
                        No property or active tenant found
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Add properties, units, and active tenants before recording meter readings.
                    </p>
                </div>
            ) : (
                <MeterReadingsClient
                    properties={properties}
                    tenants={tenants}
                    readings={readings}
                />
            )}
        </main>
    );
}

function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: number | string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}