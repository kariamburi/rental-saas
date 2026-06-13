"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    CalendarDays,
    Gauge,
    Save,
    User,
    Wallet,
} from "lucide-react";
import EditMeterReadingModal from "./EditMeterReadingModal";
import DeleteMeterReadingButton from "./DeleteMeterReadingButton";
import GenerateTenantInvoiceButton from "./GenerateTenantInvoiceButton";

type PropertyItem = {
    id: string;
    name: string;
};

type TenantItem = {
    id: string;
    name: string;
    unitId: string | null;
    unit: {
        id: string;
        unitNumber: string;
        propertyId: string;
        property: {
            id: string;
            name: string;
        };
    } | null;
};

type ReadingItem = {
    id: string;
    tenantId: string;
    unitId: string;
    type: string;
    previousReading: any;
    currentReading: any;
    unitsUsed: any;
    ratePerUnit: any;
    amount: any;
    billingMonth: string;
    tenant: { name: string };
    unit: {
        unitNumber: string;
        propertyId: string;
        property: { name: string };
    };
};

export default function MeterReadingsClient({
    properties,
    tenants,
    readings,
}: {
    properties: PropertyItem[];
    tenants: TenantItem[];
    readings: ReadingItem[];
}) {
    const router = useRouter();

    const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
    const [billingMonth, setBillingMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const filteredTenants = useMemo(
        () => tenants.filter((tenant) => tenant.unit?.property.id === propertyId),
        [tenants, propertyId]
    );

    const [tenantId, setTenantId] = useState(filteredTenants[0]?.id || "");

    const selectedTenant = filteredTenants.find((t) => t.id === tenantId);

    const [waterPrevious, setWaterPrevious] = useState("");
    const [waterCurrent, setWaterCurrent] = useState("");
    const [waterRate, setWaterRate] = useState("");

    const [electricityPrevious, setElectricityPrevious] = useState("");
    const [electricityCurrent, setElectricityCurrent] = useState("");
    const [electricityRate, setElectricityRate] = useState("");

    const [error, setError] = useState("");
    const [savingType, setSavingType] = useState<"WATER" | "ELECTRICITY" | "">("");

    function changeProperty(id: string) {
        setPropertyId(id);

        const firstTenant = tenants.find((tenant) => tenant.unit?.property.id === id);
        setTenantId(firstTenant?.id || "");
    }

    const filteredReadings = useMemo(() => {
        return readings.filter((reading) => {
            const matchProperty = propertyId
                ? reading.unit.propertyId === propertyId
                : true;

            const matchTenant = tenantId ? reading.tenantId === tenantId : true;

            const matchMonth = billingMonth
                ? reading.billingMonth === billingMonth
                : true;

            return matchProperty && matchTenant && matchMonth;
        });
    }, [readings, propertyId, tenantId, billingMonth]);

    const waterAmount =
        Math.max(Number(waterCurrent || 0) - Number(waterPrevious || 0), 0) *
        Number(waterRate || 0);

    const electricityAmount =
        Math.max(
            Number(electricityCurrent || 0) - Number(electricityPrevious || 0),
            0
        ) * Number(electricityRate || 0);

    async function saveReading(type: "WATER" | "ELECTRICITY") {
        setError("");

        if (!selectedTenant?.unitId) {
            setError("Please select a tenant with an assigned unit.");
            return;
        }

        const isWater = type === "WATER";

        const previousReading = isWater ? waterPrevious : electricityPrevious;
        const currentReading = isWater ? waterCurrent : electricityCurrent;
        const ratePerUnit = isWater ? waterRate : electricityRate;

        if (previousReading === "" || currentReading === "" || ratePerUnit === "") {
            setError(`${type}: previous, current and rate are required.`);
            return;
        }

        if (Number(currentReading) < Number(previousReading)) {
            setError(`${type}: current reading cannot be less than previous reading.`);
            return;
        }

        setSavingType(type);

        try {
            const res = await fetch("/api/meter-readings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    unitId: selectedTenant.unitId,
                    billingMonth,
                    readings: [
                        {
                            enabled: true,
                            type,
                            previousReading,
                            currentReading,
                            ratePerUnit,
                        },
                    ],
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || `Failed to save ${type} reading`);
                return;
            }

            if (isWater) {
                setWaterPrevious("");
                setWaterCurrent("");
                setWaterRate("");
            } else {
                setElectricityPrevious("");
                setElectricityCurrent("");
                setElectricityRate("");
            }

            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setSavingType("");
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">
                    Add Tenant Meter Readings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Save water and electricity readings separately for the selected tenant.
                </p>

                {error && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-6 grid gap-5 md:grid-cols-3">
                    <SelectBox
                        icon={Building2}
                        label="Property"
                        value={propertyId}
                        onChange={changeProperty}
                        options={properties.map((property) => ({
                            label: property.name,
                            value: property.id,
                        }))}
                    />

                    <SelectBox
                        icon={User}
                        label="Tenant"
                        value={tenantId}
                        onChange={setTenantId}
                        options={filteredTenants.map((tenant) => ({
                            label: `${tenant.name} - Unit ${tenant.unit?.unitNumber || ""}`,
                            value: tenant.id,
                        }))}
                    />

                    <InputBox
                        icon={CalendarDays}
                        label="Billing Month"
                        type="month"
                        value={billingMonth}
                        onChange={setBillingMonth}
                    />
                </div>

                {selectedTenant?.unit && (
                    <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                        {selectedTenant.unit.property.name} - Unit{" "}
                        {selectedTenant.unit.unitNumber}
                    </div>
                )}

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                    <ReadingCard
                        title="Water Reading"
                        previous={waterPrevious}
                        setPrevious={setWaterPrevious}
                        current={waterCurrent}
                        setCurrent={setWaterCurrent}
                        rate={waterRate}
                        setRate={setWaterRate}
                        amount={waterAmount}
                        loading={savingType === "WATER"}
                        onSave={() => saveReading("WATER")}
                    />

                    <ReadingCard
                        title="Electricity Reading"
                        previous={electricityPrevious}
                        setPrevious={setElectricityPrevious}
                        current={electricityCurrent}
                        setCurrent={setElectricityCurrent}
                        rate={electricityRate}
                        setRate={setElectricityRate}
                        amount={electricityAmount}
                        loading={savingType === "ELECTRICITY"}
                        onSave={() => saveReading("ELECTRICITY")}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Filtered Readings
                    </h2>
                    <p className="text-sm text-slate-500">
                        Edit, delete, or print one invoice for the selected tenant and month.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-4">Tenant</th>
                                <th className="px-4 py-4">Unit</th>
                                <th className="px-4 py-4">Type</th>
                                <th className="px-4 py-4">Month</th>
                                <th className="px-4 py-4">Prev</th>
                                <th className="px-4 py-4">Curr</th>
                                <th className="px-4 py-4">Used</th>
                                <th className="px-4 py-4">Rate</th>
                                <th className="px-4 py-4">Amount</th>
                                <th className="px-4 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredReadings.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center">
                                        <Gauge className="mx-auto text-emerald-600" size={30} />
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No readings found
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Save water or electricity reading first.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReadings.map((reading) => (
                                    <tr key={reading.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                                            {reading.tenant.name}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                            {reading.unit.property.name}
                                            <br />
                                            <span className="text-xs font-semibold text-slate-400">
                                                Unit {reading.unit.unitNumber}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {reading.type}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                            {reading.billingMonth}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                            {Number(reading.previousReading).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                            {Number(reading.currentReading).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-black text-slate-700">
                                            {Number(reading.unitsUsed).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                                            KES {Number(reading.ratePerUnit).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-black text-slate-700">
                                            KES {Number(reading.amount).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <EditMeterReadingModal
                                                    reading={reading}
                                                    tenants={filteredTenants}
                                                />

                                                <DeleteMeterReadingButton
                                                    readingId={reading.id}
                                                    label={`${reading.type} - ${reading.billingMonth}`}
                                                />

                                                <GenerateTenantInvoiceButton
                                                    tenantId={reading.tenantId}
                                                    propertyId={reading.unit.propertyId}
                                                    billingMonth={reading.billingMonth}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ReadingCard({
    title,
    previous,
    setPrevious,
    current,
    setCurrent,
    rate,
    setRate,
    amount,
    loading,
    onSave,
}: any) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-black text-slate-800">{title}</h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <InputBox
                    icon={Gauge}
                    label="Previous"
                    type="number"
                    value={previous}
                    onChange={setPrevious}
                />

                <InputBox
                    icon={Gauge}
                    label="Current"
                    type="number"
                    value={current}
                    onChange={setCurrent}
                />

                <InputBox
                    icon={Wallet}
                    label="Rate"
                    type="number"
                    value={rate}
                    onChange={setRate}
                />
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase text-slate-400">
                        Calculated Amount
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                        KES {Number(amount || 0).toLocaleString()}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    <Save size={17} />
                    {loading ? "Saving..." : `Save ${title.replace(" Reading", "")}`}
                </button>
            </div>
        </div>
    );
}

function SelectBox({ icon: Icon, label, value, onChange, options }: any) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Icon size={18} className="shrink-0 text-emerald-600" />

                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none"
                >
                    {options.length === 0 ? (
                        <option value="">No record found</option>
                    ) : (
                        options.map((option: any) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))
                    )}
                </select>
            </div>
        </div>
    );
}

function InputBox({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
}: any) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Icon size={18} className="shrink-0 text-emerald-600" />

                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
            </div>
        </div>
    );
}