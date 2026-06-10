"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteExpenseButton({
    expenseId,
}: {
    expenseId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const confirmed = window.confirm(
            "Are you sure you want to delete this expense?"
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch("/api/expenses", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    expenseId,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete expense");
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
            <Trash2 size={14} />
            {loading ? "Deleting..." : "Delete"}
        </button>
    );
}