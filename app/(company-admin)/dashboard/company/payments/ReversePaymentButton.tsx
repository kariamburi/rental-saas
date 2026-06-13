"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export default function ReversePaymentButton({
    paymentId,
}: {
    paymentId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleReverse() {
        const reason = window.prompt(
            "Enter reason for reversing this payment:",
            "Wrong payment entry"
        );

        if (!reason) return;

        const confirmed = window.confirm(
            "Are you sure you want to reverse this payment? This will update the invoice balance."
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/payments/reverse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId,
                    reason,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to reverse payment");
                return;
            }

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
            onClick={handleReverse}
            disabled={loading}
            className="rounded-xl cursor-pointer bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
        >
            <span className="inline-flex items-center gap-1">
                <RotateCcw size={14} />
                {loading ? "..." : "Reverse"}
            </span>
        </button>
    );
}