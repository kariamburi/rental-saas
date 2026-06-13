"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteMeterReadingButton({
    readingId,
    label,
}: {
    readingId: string;
    label: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const confirmed = window.confirm(
            `Delete meter reading ${label}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/meter-readings", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ readingId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete meter reading");
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
            onClick={handleDelete}
            disabled={loading}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            title="Delete reading"
        >
            <Trash2 size={16} />
        </button>
    );
}