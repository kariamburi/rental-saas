import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    DoorOpen,
    Droplets,
    FileText,
    Gauge,
    MessageCircle,
    User,
    Zap,
} from "lucide-react";
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

    const invoices = await prisma.invoice.findMany({
        where: { companyId: user.companyId },
        include: {
            tenant: true,
            unit: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const totalAmount = readings.reduce(
        (sum, reading) => sum + Number(reading.amount),
        0
    );

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "";

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
                <>
                    <MeterReadingsClient
                        properties={properties}
                        tenants={tenants}
                        readings={readings}
                    />

                    <section className="mt-8">
                        <div className="mb-5">
                            <h2 className="text-lg font-black text-slate-950">
                                Filtered Bills
                            </h2>
                            <p className="text-sm text-slate-500">
                                Bills grouped by property, tenant, and billing month. Print or
                                share one invoice per tenant and month.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {properties.map((property) => {
                                const propertyReadings = readings.filter(
                                    (reading) => reading.unit.property.id === property.id
                                );

                                const billGroups = groupReadingsByTenantAndMonth(
                                    propertyReadings
                                );

                                const propertyTotalAmount = propertyReadings.reduce(
                                    (sum, reading) => sum + Number(reading.amount || 0),
                                    0
                                );

                                return (
                                    <details
                                        key={property.id}
                                        className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                                    >
                                        <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-slate-50">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                                        <Building2 size={18} />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-950">
                                                            {property.name}
                                                        </h3>
                                                        <p className="text-sm font-semibold text-slate-500">
                                                            {billGroups.length} bill group(s) •{" "}
                                                            {propertyReadings.length} reading(s)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                                                        Amount: KES{" "}
                                                        {propertyTotalAmount.toLocaleString()}
                                                    </div>

                                                    <ChevronDown
                                                        size={20}
                                                        className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                    />
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="border-t border-slate-100 p-4">
                                            {billGroups.length === 0 ? (
                                                <div className="rounded-2xl bg-slate-50 px-6 py-10 text-center text-sm font-bold text-slate-500">
                                                    No meter bills for this property.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {billGroups.map((group) => {
                                                        const invoice = findInvoiceForBill({
                                                            invoices,
                                                            tenantId: group.tenantId,
                                                            unitId: group.unitId,
                                                            billingMonth: group.billingMonth,
                                                        });

                                                        const invoiceUrl = invoice
                                                            ? `${baseUrl}/dashboard/company/invoices/${invoice.id}/print`
                                                            : "";

                                                        const whatsappMessage = buildWhatsappMessage({
                                                            tenantName: group.tenantName,
                                                            propertyName: property.name,
                                                            unitNumber: group.unitNumber,
                                                            billingMonth: group.billingMonth,
                                                            totalAmount: group.totalAmount,
                                                            invoiceUrl,
                                                        });

                                                        return (
                                                            <div
                                                                key={group.key}
                                                                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
                                                            >
                                                                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <User
                                                                                size={17}
                                                                                className="text-emerald-600"
                                                                            />
                                                                            <h4 className="font-black text-slate-950">
                                                                                {group.tenantName}
                                                                            </h4>
                                                                        </div>

                                                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                                                            Unit {group.unitNumber} •{" "}
                                                                            {group.billingMonth} •{" "}
                                                                            {group.readings.length} reading(s)
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                                                                            KES{" "}
                                                                            {group.totalAmount.toLocaleString()}
                                                                        </div>

                                                                        {invoice ? (
                                                                            <Link
                                                                                href={`/dashboard/company/invoices/${invoice.id}/print`}
                                                                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-600"
                                                                            >
                                                                                <FileText size={15} />
                                                                                Print Invoice
                                                                            </Link>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-400">
                                                                                <FileText size={15} />
                                                                                Invoice Not Generated
                                                                            </span>
                                                                        )}

                                                                        <a
                                                                            href={`https://wa.me/${normalizePhone(
                                                                                group.tenantPhone
                                                                            )}?text=${encodeURIComponent(
                                                                                whatsappMessage
                                                                            )}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                                                                        >
                                                                            <MessageCircle size={15} />
                                                                            Share WhatsApp
                                                                        </a>
                                                                    </div>
                                                                </div>

                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full min-w-[950px] text-left">
                                                                        <thead className="bg-white text-xs font-black uppercase tracking-wider text-slate-500">
                                                                            <tr>
                                                                                <th className="px-5 py-3">Type</th>
                                                                                <th className="px-5 py-3">Previous</th>
                                                                                <th className="px-5 py-3">Current</th>
                                                                                <th className="px-5 py-3">Units Used</th>
                                                                                <th className="px-5 py-3">Rate</th>
                                                                                <th className="px-5 py-3">Amount</th>
                                                                                <th className="px-5 py-3">Date</th>
                                                                            </tr>
                                                                        </thead>

                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {group.readings.map((reading: any) => (
                                                                                <tr
                                                                                    key={reading.id}
                                                                                    className="transition hover:bg-slate-50"
                                                                                >
                                                                                    <td className="px-5 py-3">
                                                                                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                                                            {reading.type === "WATER" ? (
                                                                                                <Droplets size={14} />
                                                                                            ) : (
                                                                                                <Zap size={14} />
                                                                                            )}
                                                                                            {reading.type}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                                                                                        {Number(
                                                                                            reading.previousReading
                                                                                        ).toLocaleString()}
                                                                                    </td>

                                                                                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                                                                                        {Number(
                                                                                            reading.currentReading
                                                                                        ).toLocaleString()}
                                                                                    </td>

                                                                                    <td className="px-5 py-3 text-sm font-black text-slate-700">
                                                                                        {Number(
                                                                                            reading.unitsUsed
                                                                                        ).toLocaleString()}
                                                                                    </td>

                                                                                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                                                                                        KES{" "}
                                                                                        {Number(
                                                                                            reading.ratePerUnit
                                                                                        ).toLocaleString()}
                                                                                    </td>

                                                                                    <td className="px-5 py-3 text-sm font-black text-slate-700">
                                                                                        KES{" "}
                                                                                        {Number(
                                                                                            reading.amount
                                                                                        ).toLocaleString()}
                                                                                    </td>

                                                                                    <td className="px-5 py-3">
                                                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                                                            <CalendarDays
                                                                                                size={16}
                                                                                                className="text-emerald-600"
                                                                                            />
                                                                                            {new Date(
                                                                                                reading.createdAt
                                                                                            ).toLocaleDateString()}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

function groupReadingsByTenantAndMonth(readings: any[]) {
    const map = new Map<string, any>();

    for (const reading of readings) {
        const key = `${reading.tenantId}-${reading.unitId}-${reading.billingMonth}`;

        if (!map.has(key)) {
            map.set(key, {
                key,
                tenantId: reading.tenantId,
                tenantName: reading.tenant.name,
                tenantPhone: reading.tenant.phone,
                unitId: reading.unitId,
                unitNumber: reading.unit.unitNumber,
                billingMonth: reading.billingMonth,
                readings: [],
                totalAmount: 0,
            });
        }

        const group = map.get(key);
        group.readings.push(reading);
        group.totalAmount += Number(reading.amount || 0);
    }

    return Array.from(map.values()).sort((a, b) =>
        b.billingMonth.localeCompare(a.billingMonth)
    );
}

function findInvoiceForBill({
    invoices,
    tenantId,
    unitId,
    billingMonth,
}: {
    invoices: any[];
    tenantId: string;
    unitId: string;
    billingMonth: string;
}) {
    const periodKey = billingMonth.replace("-", "");

    return (
        invoices.find(
            (invoice) =>
                invoice.tenantId === tenantId &&
                invoice.unitId === unitId &&
                invoice.invoiceNo?.includes(`UTIL-${periodKey}`)
        ) ||
        invoices.find(
            (invoice) =>
                invoice.tenantId === tenantId &&
                invoice.unitId === unitId &&
                invoice.invoiceNo?.includes(periodKey)
        )
    );
}

function normalizePhone(phone?: string | null) {
    const raw = String(phone || "").replace(/\D/g, "");

    if (!raw) return "";
    if (raw.startsWith("254")) return raw;
    if (raw.startsWith("0")) return `254${raw.slice(1)}`;
    if (raw.startsWith("7") || raw.startsWith("1")) return `254${raw}`;

    return raw;
}

function buildWhatsappMessage({
    tenantName,
    propertyName,
    unitNumber,
    billingMonth,
    totalAmount,
    invoiceUrl,
}: {
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    billingMonth: string;
    totalAmount: number;
    invoiceUrl: string;
}) {
    return `Hello ${tenantName},

Your utility bill for ${billingMonth} is ready.

Property: ${propertyName}
Unit: ${unitNumber}
Amount Due: KES ${totalAmount.toLocaleString()}

${invoiceUrl ? `View invoice:
${invoiceUrl}` : "Kindly request your invoice copy from management."}

Thank you.`;
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