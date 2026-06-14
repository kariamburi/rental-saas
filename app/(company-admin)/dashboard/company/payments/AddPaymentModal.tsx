"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    CalendarDays,
    FileText,
    Hash,
    Plus,
    User,
    Wallet,
    X,
} from "lucide-react";

type InvoiceItem = {
    id: string;
    invoiceNo: string;
    amount: unknown;
    paidAmount: unknown;
    balance: unknown;
    status: string;
    tenant: {
        name: string;
    };
    unit: {
        unitNumber: string;
        property: {
            name: string;
        };
    };
};

export default function AddPaymentModal({
    invoices,
}: {
    invoices: InvoiceItem[];
}) {
    const router = useRouter();

    const unpaidInvoices = invoices.filter((i) => Number(i.balance) > 0);

    const properties = useMemo(() => {
        const map = new Map<string, string>();

        unpaidInvoices.forEach((invoice) => {
            map.set(invoice.unit.property.name, invoice.unit.property.name);
        });

        return Array.from(map.values()).sort();
    }, [unpaidInvoices]);

    const [open, setOpen] = useState(false);
    const [propertyName, setPropertyName] = useState(properties[0] || "");

    const tenants = useMemo(() => {
        const map = new Map<string, string>();

        unpaidInvoices
            .filter((invoice) => invoice.unit.property.name === propertyName)
            .forEach((invoice) => {
                map.set(invoice.tenant.name, invoice.tenant.name);
            });

        return Array.from(map.values()).sort();
    }, [unpaidInvoices, propertyName]);

    const [tenantName, setTenantName] = useState(tenants[0] || "");

    const filteredInvoices = unpaidInvoices.filter(
        (invoice) =>
            invoice.unit.property.name === propertyName &&
            invoice.tenant.name === tenantName
    );

    const [invoiceId, setInvoiceId] = useState(filteredInvoices[0]?.id || "");

    const selectedInvoice = unpaidInvoices.find((i) => i.id === invoiceId);

    const [amount, setAmount] = useState(
        selectedInvoice ? String(selectedInvoice.balance) : ""
    );

    const [method, setMethod] = useState("CASH");
    const [reference, setReference] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handlePropertyChange(value: string) {
        setPropertyName(value);

        const nextTenants = unpaidInvoices
            .filter((invoice) => invoice.unit.property.name === value)
            .map((invoice) => invoice.tenant.name);

        const uniqueTenants = Array.from(new Set(nextTenants)).sort();
        const firstTenant = uniqueTenants[0] || "";

        setTenantName(firstTenant);

        const nextInvoice = unpaidInvoices.find(
            (invoice) =>
                invoice.unit.property.name === value &&
                invoice.tenant.name === firstTenant
        );

        setInvoiceId(nextInvoice?.id || "");
        setAmount(nextInvoice ? String(nextInvoice.balance) : "");
    }

    function handleTenantChange(value: string) {
        setTenantName(value);

        const nextInvoice = unpaidInvoices.find(
            (invoice) =>
                invoice.unit.property.name === propertyName &&
                invoice.tenant.name === value
        );

        setInvoiceId(nextInvoice?.id || "");
        setAmount(nextInvoice ? String(nextInvoice.balance) : "");
    }

    function handleInvoiceChange(value: string) {
        setInvoiceId(value);

        const invoice = unpaidInvoices.find((i) => i.id === value);
        setAmount(invoice ? String(invoice.balance) : "");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId,
                    amount,
                    method,
                    reference,
                    paymentDate,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to record payment");
                return;
            }

            setReference("");
            setMethod("CASH");
            setPaymentDate(new Date().toISOString().slice(0, 10));
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
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
                <Plus size={18} />
                Record Payment
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Record Payment
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Select property, tenant, then invoice
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

                            {unpaidInvoices.length === 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    No unpaid invoices available.
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <SelectBox
                                    icon={Building2}
                                    label="Property"
                                    value={propertyName}
                                    onChange={handlePropertyChange}
                                    disabled={unpaidInvoices.length === 0}
                                    options={properties.map((property) => ({
                                        value: property,
                                        label: property,
                                    }))}
                                />

                                <SelectBox
                                    icon={User}
                                    label="Tenant"
                                    value={tenantName}
                                    onChange={handleTenantChange}
                                    disabled={!propertyName || tenants.length === 0}
                                    options={tenants.map((tenant) => ({
                                        value: tenant,
                                        label: tenant,
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Invoice
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <FileText size={18} className="text-emerald-600" />
                                    <select
                                        value={invoiceId}
                                        onChange={(e) => handleInvoiceChange(e.target.value)}
                                        disabled={filteredInvoices.length === 0}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:opacity-50"
                                    >
                                        {filteredInvoices.length === 0 ? (
                                            <option value="">No unpaid invoice</option>
                                        ) : (
                                            filteredInvoices.map((invoice) => (
                                                <option key={invoice.id} value={invoice.id}>
                                                    {invoice.invoiceNo} - Balance KES{" "}
                                                    {Number(invoice.balance).toLocaleString()}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {selectedInvoice && (
                                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                                    {selectedInvoice.tenant.name} •{" "}
                                    {selectedInvoice.unit.property.name} Unit{" "}
                                    {selectedInvoice.unit.unitNumber} • Balance KES{" "}
                                    {Number(selectedInvoice.balance).toLocaleString()}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <Input
                                    icon={Wallet}
                                    label="Amount"
                                    value={amount}
                                    onChange={setAmount}
                                    type="number"
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Method
                                    </label>
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="MPESA">M-Pesa</option>
                                        <option value="BANK">Bank</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>

                                <Input
                                    icon={Hash}
                                    label="Reference"
                                    value={reference}
                                    onChange={setReference}
                                />

                                <Input
                                    icon={CalendarDays}
                                    label="Payment Date"
                                    value={paymentDate}
                                    onChange={setPaymentDate}
                                    type="date"
                                />
                            </div>

                            <button
                                disabled={loading || unpaidInvoices.length === 0 || !invoiceId}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Save Payment"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function SelectBox({
    icon: Icon,
    label,
    value,
    onChange,
    options,
    disabled = false,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Icon size={18} className="text-emerald-600" />
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:opacity-50"
                >
                    {options.length === 0 ? (
                        <option value="">No option available</option>
                    ) : (
                        options.map((option) => (
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
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus:ring-emerald-100">
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