import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CalendarDays, DoorOpen, Gauge, User, Wallet } from "lucide-react";
import AddMeterReadingModal from "./AddMeterReadingModal";

export default async function MeterReadingsPage({
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
        where: {
            companyId: id,
            status: { in: ["ACTIVE", "NOTICE"] },
        },
        include: {
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const readings = await prisma.meterReading.findMany({
        where: { companyId: id },
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
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Meter Readings
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Record water and electricity readings for variable tenant billing.
                        </p>
                    </div>

                    <AddMeterReadingModal companyId={company.id} tenants={tenants} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
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

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Reading List</h2>
                    <p className="text-sm text-slate-500">
                        Meter readings that can be included in monthly invoices
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4">Previous</th>
                                <th className="px-6 py-4">Current</th>
                                <th className="px-6 py-4">Used</th>
                                <th className="px-6 py-4">Rate</th>
                                <th className="px-6 py-4">Amount</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {readings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <Gauge size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No meter readings yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add water or electricity readings before generating invoices.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                readings.map((reading) => (
                                    <tr key={reading.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <User size={16} className="text-emerald-600" />
                                                {reading.tenant.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {reading.unit.property.name} - Unit{" "}
                                                {reading.unit.unitNumber}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {reading.type}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {reading.billingMonth}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            {Number(reading.previousReading).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            {Number(reading.currentReading).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-black text-slate-700">
                                            {Number(reading.unitsUsed).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            KES {Number(reading.ratePerUnit).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(reading.amount).toLocaleString()}
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