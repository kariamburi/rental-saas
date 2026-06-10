"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export default function UpdateMaintenanceStatus({
    requestId,
    currentStatus,
}: {
    requestId: string;
    currentStatus: string;
}) {
    const router = useRouter();

    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);

    async function updateStatus(value: string) {
        setStatus(value);
        setLoading(true);

        try {
            const res = await fetch("/api/maintenance", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requestId,
                    status: value,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to update status");
                setStatus(currentStatus);
                return;
            }

            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    const statusClass =
        status === "OPEN"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : status === "IN_PROGRESS"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : status === "RESOLVED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

    return (
        <div className="relative inline-block">
            <select
                value={status}
                disabled={loading}
                onChange={(e) => updateStatus(e.target.value)}
                className={`appearance-none rounded-full border px-4 py-2 pr-10 text-xs font-black transition outline-none ${statusClass}`}
            >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
            </select>

            {loading ? (
                <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
                />
            ) : (
                <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                />
            )}
        </div>
    );
}