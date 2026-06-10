"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, Pencil, Wallet, X } from "lucide-react";

type LeaseItem = {
    id: string;
    monthlyRent: unknown;
    depositAmount: unknown;
    garbageCharge: unknown;
    securityCharge: unknown;
    serviceCharge: unknown;
    startDate: Date | string;
    endDate: Date | string | null;
    billingDay: number;
    rentDueDay: number;
    gracePeriodDays: number;
    notes: string | null;
    agreementTerms: string | null;
    status: string;
};

export default function EditLeaseModal({ lease }: { lease: LeaseItem }) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [monthlyRent, setMonthlyRent] = useState(String(lease.monthlyRent));
    const [depositAmount, setDepositAmount] = useState(String(lease.depositAmount));
    const [garbageCharge, setGarbageCharge] = useState(
        String(lease.garbageCharge || 0)
    );
    const [securityCharge, setSecurityCharge] = useState(
        String(lease.securityCharge || 0)
    );
    const [serviceCharge, setServiceCharge] = useState(
        String(lease.serviceCharge || 0)
    );

    const [startDate, setStartDate] = useState(
        new Date(lease.startDate).toISOString().slice(0, 10)
    );
    const [endDate, setEndDate] = useState(
        lease.endDate ? new Date(lease.endDate).toISOString().slice(0, 10) : ""
    );
    const [billingDay, setBillingDay] = useState(String(lease.billingDay || 1));
    const [rentDueDay, setRentDueDay] = useState(String(lease.rentDueDay || 5));
    const [gracePeriodDays, setGracePeriodDays] = useState(
        String(lease.gracePeriodDays || 0)
    );
    const [notes, setNotes] = useState(lease.notes || "");
    const [status, setStatus] = useState(lease.status);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [agreementTerms, setAgreementTerms] = useState(
        lease.agreementTerms || ""
    );
    const totalMonthly =
        Number(monthlyRent || 0) +
        Number(garbageCharge || 0) +
        Number(securityCharge || 0) +
        Number(serviceCharge || 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/leases", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leaseId: lease.id,
                    monthlyRent,
                    depositAmount,
                    garbageCharge,
                    securityCharge,
                    serviceCharge,
                    startDate,
                    endDate,
                    billingDay,
                    rentDueDay,
                    gracePeriodDays,
                    notes,
                    agreementTerms,
                    status,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to update lease");
                return;
            }

            setOpen(false);
            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
                <Pencil size={14} />
                Edit
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Edit Lease
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Update rent, charges, billing dates and status
                                </p>
                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex-1 space-y-5 overflow-y-auto p-6"
                        >
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input
                                    icon={Wallet}
                                    label="Monthly Rent"
                                    value={monthlyRent}
                                    onChange={setMonthlyRent}
                                    type="number"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Deposit Amount"
                                    value={depositAmount}
                                    onChange={setDepositAmount}
                                    type="number"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Garbage Charge"
                                    value={garbageCharge}
                                    onChange={setGarbageCharge}
                                    type="number"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Security Charge"
                                    value={securityCharge}
                                    onChange={setSecurityCharge}
                                    type="number"
                                />

                                <Input
                                    icon={Wallet}
                                    label="Service Charge"
                                    value={serviceCharge}
                                    onChange={setServiceCharge}
                                    type="number"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Start Date"
                                    value={startDate}
                                    onChange={setStartDate}
                                    type="date"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="End Date"
                                    value={endDate}
                                    onChange={setEndDate}
                                    type="date"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Billing Day"
                                    value={billingDay}
                                    onChange={setBillingDay}
                                    type="number"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Rent Due Day"
                                    value={rentDueDay}
                                    onChange={setRentDueDay}
                                    type="number"
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Grace Period Days"
                                    value={gracePeriodDays}
                                    onChange={setGracePeriodDays}
                                    type="number"
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Status
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <FileText size={18} className="text-emerald-600" />
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="ENDED">Ended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-black uppercase text-slate-400">
                                    Monthly Charges Summary
                                </p>

                                <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                                    <Row label="Rent" value={Number(monthlyRent || 0)} />
                                    <Row label="Garbage" value={Number(garbageCharge || 0)} />
                                    <Row label="Security" value={Number(securityCharge || 0)} />
                                    <Row label="Service" value={Number(serviceCharge || 0)} />

                                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-950">
                                        <span>Total Monthly</span>
                                        <span>KES {totalMonthly.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Internal Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Agreement Terms & Conditions
                                </label>
                                <textarea
                                    value={agreementTerms}
                                    onChange={(e) => setAgreementTerms(e.target.value)}
                                    rows={10}
                                    className="min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                />
                            </div>
                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Updating..." : "Update Lease"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between">
            <span>{label}</span>
            <span>KES {value.toLocaleString()}</span>
        </div>
    );
}

function Input({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Icon size={18} className="text-emerald-600" />
                <input
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                />
            </div>
        </div>
    );
}