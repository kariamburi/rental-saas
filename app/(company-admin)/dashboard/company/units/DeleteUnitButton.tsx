"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteUnitButton({
    unitId,
    unitNumber,
}: {
    unitId: string;
    unitNumber: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const confirmed = window.confirm(
            `Delete Unit ${unitNumber}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/units", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    unitId,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete unit");
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
            title="Delete Unit"
        >
            <Trash2 size={16} />
        </button>
    );
}