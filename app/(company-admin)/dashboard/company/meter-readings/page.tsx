import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Building2,
    CalendarDays,
    ChevronDown,
    Droplets,
    FileText,
    Gauge,
    MessageCircle,
    User,
    Zap,
} from "lucide-react";
import MeterReadingsClient from "./MeterReadingsClient";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";
import GenerateTenantInvoiceButton from "./GenerateTenantInvoiceButton";

export default async function MeterReadingsPage() {
    const { companyId } =
        await requireCompanyRouteAccess("/dashboard/company/meter-readings");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const [properties, tenants, readings, invoices] = await Promise.all([
        prisma.property.findMany({
            where: { companyId },
            orderBy: { name: "asc" },
        }),

        prisma.tenant.findMany({
            where: {
                companyId,
                status: { in: ["ACTIVE", "NOTICE"] },
                unitId: { not: null },
            },
            include: {
                unit: {
                    include: { property: true },
                },
            },
            orderBy: { name: "asc" },
        }),

        prisma.meterReading.findMany({
            where: { companyId },
            include: {
                tenant: true,
                unit: {
                    include: { property: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),

        prisma.invoice.findMany({
            where: {
                companyId,
                invoiceType: "UTILITY_ONLY",
            },
            include: {
                tenant: true,
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const totalAmount = readings.reduce(
        (sum, reading) => sum + Number(reading.amount || 0),
        0
    );

    const waterReadings = readings.filter((r) => r.type === "WATER").length;

    const electricityReadings = readings.filter(
        (r) => r.type === "ELECTRICITY"
    ).length;

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "";

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Meter Readings
                    </p>

                    <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                    <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                        Select property, filter tenants, record water and electricity usage,
                        then generate bills-only tenant invoice.
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Readings" value={readings.length} />
                <SummaryCard title="Water Readings" value={waterReadings} />
                <SummaryCard title="Electricity" value={electricityReadings} />
                <SummaryCard
                    title="Total Amount"
                    value={`KES ${totalAmount.toLocaleString()}`}
                    success
                />
            </div>

            {properties.length === 0 || tenants.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Gauge size={26} />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950">
                        No property or active tenant found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Add properties, units, and active tenants before recording meter
                        readings.
                    </p>
                </div>
            ) : (
                <>
                    <MeterReadingsClient
                        properties={properties}
                        tenants={tenants}
                        readings={readings}
                    />

                    <section className="mt-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">
                                        Filtered Bills
                                    </h2>

                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Bills grouped by property, tenant, and billing month.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {properties.map((property) => {
                                    const propertyReadings = readings.filter(
                                        (reading) => reading.unit.property.id === property.id
                                    );

                                    const billGroups =
                                        groupReadingsByTenantAndMonth(propertyReadings);

                                    const propertyTotalAmount = propertyReadings.reduce(
                                        (sum, reading) => sum + Number(reading.amount || 0),
                                        0
                                    );

                                    return (
                                        <details
                                            key={property.id}
                                            className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                                        >
                                            <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-slate-50">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                                            <Building2 size={17} />
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-black text-slate-950">
                                                                {property.name}
                                                            </h3>

                                                            <p className="text-xs font-semibold text-slate-500">
                                                                {billGroups.length} bill group(s) •{" "}
                                                                {propertyReadings.length} reading(s)
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                            Amount: KES{" "}
                                                            {propertyTotalAmount.toLocaleString()}
                                                        </div>

                                                        <ChevronDown
                                                            size={18}
                                                            className="text-slate-500 transition duration-300 group-open:rotate-180"
                                                        />
                                                    </div>
                                                </div>
                                            </summary>

                                            <div className="border-t border-slate-200 p-4">
                                                {billGroups.length === 0 ? (
                                                    <div className="rounded-xl bg-slate-50 px-6 py-8 text-center text-sm font-bold text-slate-500">
                                                        No meter bills for this property.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {billGroups.map((group) => {
                                                            const invoice = findInvoiceForBill({
                                                                invoices,
                                                                tenantId: group.tenantId,
                                                                unitId: group.unitId,
                                                                billingMonth: group.billingMonth,
                                                            });

                                                            const invoiceUrl = invoice
                                                                ? `${baseUrl}/api/public/invoices/${invoice.id}/download`
                                                                : "";


                                                            const whatsappMessage = buildWhatsappMessage({
                                                                tenantName: group.tenantName,
                                                                propertyName: property.name,
                                                                unitNumber: group.unitNumber,
                                                                billingMonth: group.billingMonth,
                                                                totalAmount: group.totalAmount,
                                                                invoiceUrl,
                                                                readings: group.readings,
                                                            });
                                                            return (
                                                                <div
                                                                    key={group.key}
                                                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                                >
                                                                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <User
                                                                                    size={15}
                                                                                    className="text-emerald-600"
                                                                                />

                                                                                <h4 className="text-sm font-black text-slate-950">
                                                                                    {group.tenantName}
                                                                                </h4>
                                                                            </div>

                                                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                                                Unit {group.unitNumber} •{" "}
                                                                                {group.billingMonth} •{" "}
                                                                                {group.readings.length} reading(s)
                                                                            </p>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                                                KES{" "}
                                                                                {group.totalAmount.toLocaleString()}
                                                                            </div>

                                                                            {invoice ? (
                                                                                <Link
                                                                                    href={`/dashboard/company/invoices/${invoice.id}/print`}
                                                                                    className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-600"
                                                                                >
                                                                                    <FileText size={14} />
                                                                                    Print
                                                                                </Link>
                                                                            ) : (
                                                                                <GenerateTenantInvoiceButton
                                                                                    tenantId={group.tenantId}
                                                                                    propertyId={property.id}
                                                                                    billingMonth={group.billingMonth}
                                                                                />
                                                                            )}

                                                                            <a
                                                                                href={`https://wa.me/${normalizePhone(
                                                                                    group.tenantPhone
                                                                                )}?text=${encodeURIComponent(
                                                                                    whatsappMessage
                                                                                )}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700"
                                                                            >
                                                                                <MessageCircle size={14} />
                                                                                WhatsApp
                                                                            </a>
                                                                        </div>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full min-w-[900px] border-collapse text-[12px]">
                                                                            <thead>
                                                                                <tr className="bg-slate-100 text-slate-900">
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Type
                                                                                    </th>
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Previous
                                                                                    </th>
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Current
                                                                                    </th>
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Units Used
                                                                                    </th>
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Rate
                                                                                    </th>
                                                                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                                                                        Amount
                                                                                    </th>
                                                                                    <th className="px-2 py-2 text-left font-bold">
                                                                                        Date
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>

                                                                            <tbody>
                                                                                {group.readings.map((reading: any) => (
                                                                                    <tr
                                                                                        key={reading.id}
                                                                                        className="border-b hover:bg-slate-50"
                                                                                    >
                                                                                        <td className="whitespace-nowrap px-2 py-2">
                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                                                                {reading.type === "WATER" ? (
                                                                                                    <Droplets size={13} />
                                                                                                ) : (
                                                                                                    <Zap size={13} />
                                                                                                )}
                                                                                                {reading.type}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                                            {Number(
                                                                                                reading.previousReading
                                                                                            ).toLocaleString()}
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                                            {Number(
                                                                                                reading.currentReading
                                                                                            ).toLocaleString()}
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                                                                                            {Number(
                                                                                                reading.unitsUsed
                                                                                            ).toLocaleString()}
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                                            KES{" "}
                                                                                            {Number(
                                                                                                reading.ratePerUnit
                                                                                            ).toLocaleString()}
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                                                            KES{" "}
                                                                                            {Number(
                                                                                                reading.amount
                                                                                            ).toLocaleString()}
                                                                                        </td>

                                                                                        <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                                                            <span className="inline-flex items-center gap-1">
                                                                                                <CalendarDays size={13} />
                                                                                                {new Date(
                                                                                                    reading.createdAt
                                                                                                ).toLocaleDateString("en-KE")}
                                                                                            </span>
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
    return invoices.find(
        (invoice) =>
            invoice.tenantId === tenantId &&
            invoice.unitId === unitId &&
            invoice.periodKey === billingMonth &&
            invoice.invoiceType === "UTILITY_ONLY"
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
    readings,
}: {
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    billingMonth: string;
    totalAmount: number;
    invoiceUrl: string;
    readings: any[];
}) {
    const readingLines = readings
        .map((reading) => {
            const billType = reading.type === "WATER" ? "Water" : "Electricity";
            const previous = Number(reading.previousReading || 0);
            const current = Number(reading.currentReading || 0);
            const consumption = Number(reading.unitsUsed || current - previous);
            const amount = Number(reading.amount || 0);

            return `Your ${billType} bill for the month ${billingMonth} is as follows;
Previous reading: ${previous.toLocaleString()}
Current reading: ${current.toLocaleString()}
Consumption: ${consumption.toLocaleString()}

Amount due: KES ${amount.toLocaleString()}`;
        })
        .join("\n\n");

    return `Hello ${tenantName}

Property: ${propertyName}
Unit: ${unitNumber}

${readingLines}

${readings.length > 1 ? `Total Amount Due: KES ${totalAmount.toLocaleString()}\n\n` : ""}${invoiceUrl
            ? `Download invoice PDF:
${invoiceUrl}`
            : "Kindly request your invoice copy from management."}

Thank You`;
}
function buildWhatsappMessage_({
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

${invoiceUrl ? `Download invoice PDF:
${invoiceUrl}` : "Kindly request your invoice copy from management."}

Thank you.`;
}

function SummaryCard({
    title,
    value,
    success,
}: {
    title: string;
    value: number | string;
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