"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateBookingStatus({
    bookingId,
    currentStatus,
}: {
    bookingId: string;
    currentStatus: string;
}) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);

    async function updateStatus(value: string) {
        setStatus(value);
        setLoading(true);

        try {
            const res = await fetch("/api/unit-bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    status: value,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to update booking");
                setStatus(currentStatus);
                return;
            }

            router.refresh();
        } catch {
            alert("Something went wrong");
            setStatus(currentStatus);
        } finally {
            setLoading(false);
        }
    }

    return (
        <select
            value={status}
            disabled={loading}
            onChange={(e) => updateStatus(e.target.value)}
            className={`rounded-xl px-3 py-2 text-xs font-black outline-none ${statusStyle(
                status
            )}`}
        >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CONVERTED">Converted</option>
        </select>
    );
}

function statusStyle(status: string) {
    if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700";
    if (status === "PENDING") return "bg-amber-50 text-amber-700";
    if (status === "CANCELLED") return "bg-red-50 text-red-700";
    if (status === "CONVERTED") return "bg-blue-50 text-blue-700";

    return "bg-slate-100 text-slate-700";
}