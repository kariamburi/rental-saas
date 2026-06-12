"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteOwnerButton({
    ownerId,
    ownerName,
    linkedProperties,
}: {
    ownerId: string;
    ownerName: string;
    linkedProperties: number;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (linkedProperties > 0) {
            alert("You cannot delete this owner because they are linked to properties.");
            return;
        }

        const confirmed = window.confirm(
            `Delete ${ownerName}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/owners", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ownerId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete owner");
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
            title="Delete owner"
        >
            <Trash2 size={16} />
        </button>
    );
}