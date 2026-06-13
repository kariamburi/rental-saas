"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";

export default function GenerateTenantInvoiceButton({
    tenantId,
    propertyId,
    billingMonth,
}: {
    tenantId: string;
    propertyId: string;
    billingMonth: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        setLoading(true);

        try {
            const [year, month] = billingMonth.split("-");

            const res = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    propertyId,
                    year: Number(year),
                    month: Number(month),
                    utilitiesOnly: true,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to generate invoice");
                return;
            }

            const invoiceId = data.invoice?.id || data.invoices?.[0]?.id;

            if (!invoiceId) {
                alert("Invoice generated but invoice ID was not returned");
                router.refresh();
                return;
            }

            window.open(`/dashboard/company/invoices/${invoiceId}/print`, "_blank");
            router.refresh();
        } catch {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2  cursor-pointer rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
            <Printer size={15} />
            {loading ? "..." : "Invoice"}
        </button>
    );
}