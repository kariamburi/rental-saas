"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilePlus2, MessageCircle } from "lucide-react";

type PropertyItem = {
    id: string;
    name: string;
};

type TenantItem = {
    id: string;
    name: string;
    propertyId: string;
    unitNumber: string;
};

export default function GenerateInvoicesButton({
    properties,
    tenants,
}: {
    properties: PropertyItem[];
    tenants: TenantItem[];
}) {
    const router = useRouter();
    const now = new Date();

    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [propertyId, setPropertyId] = useState("ALL");
    const [tenantId, setTenantId] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const filteredTenants = useMemo(() => {
        if (propertyId === "ALL") return [];
        return tenants.filter((tenant) => tenant.propertyId === propertyId);
    }, [propertyId, tenants]);

    async function generate() {
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year,
                    month,
                    propertyId: propertyId === "ALL" ? null : propertyId,
                    tenantId: tenantId === "ALL" ? null : tenantId,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setMessage(data.error || "Failed to generate invoices");
                return;
            }

            setMessage(`Created ${data.created} invoice(s), skipped ${data.skipped}.`);
            router.refresh();
        } catch {
            setMessage("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    const period = `${year}-${String(month).padStart(2, "0")}`;

    return (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-5">
                <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Year"
                />

                <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                >
                    {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2000, i, 1).toLocaleString("en-US", {
                                month: "long",
                            })}
                        </option>
                    ))}
                </select>

                <select
                    value={propertyId}
                    onChange={(e) => {
                        setPropertyId(e.target.value);
                        setTenantId("ALL");
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                >
                    <option value="ALL">All Properties</option>
                    {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                            {property.name}
                        </option>
                    ))}
                </select>

                <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    disabled={propertyId === "ALL"}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="ALL">
                        {propertyId === "ALL" ? "Select property first" : "All Tenants"}
                    </option>

                    {filteredTenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                            {tenant.name} - Unit {tenant.unitNumber}
                        </option>
                    ))}
                </select>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                >
                    <FilePlus2 size={18} />
                    {loading ? "Generating..." : "Generate"}
                </button>
            </div>

            <div className="mt-4">
                <a
                    href={`/dashboard/company/invoices/whatsapp?period=${period}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                >
                    <MessageCircle size={18} />
                    Share Generated Invoices on WhatsApp
                </a>
            </div>

            {message && (
                <p className="mt-4 text-sm font-bold text-emerald-700">{message}</p>
            )}
        </div>
    );
}