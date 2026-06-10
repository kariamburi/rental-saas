"use client";

import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { useState } from "react";

export default function EndLeaseButton({ leaseId }: { leaseId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleEnd() {
        const ok = confirm(
            "End this lease?\n\nTenant will be marked VACATED and unit will become VACANT."
        );

        if (!ok) return;

        setLoading(true);

        try {
            const res = await fetch("/api/leases", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leaseId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to end lease");
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
            onClick={handleEnd}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
        >
            <Ban size={14} />
            {loading ? "Ending..." : "End"}
        </button>
    );
}