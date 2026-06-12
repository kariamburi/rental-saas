"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeletePropertyButton({
    propertyId,
    propertyName,
    unitCount,
}: {
    propertyId: string;
    propertyName: string;
    unitCount: number;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (unitCount > 0) {
            alert("You cannot delete this property because it has units. Delete or move the units first.");
            return;
        }

        const confirmed = window.confirm(
            `Delete ${propertyName}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/properties", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete property");
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            title="Delete property"
        >
            <Trash2 size={16} />
        </button>
    );
}