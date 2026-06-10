"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteTenantButton({ tenantId }: { tenantId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const ok = confirm("Delete this tenant and mark the unit as vacant?");

        if (!ok) return;

        setLoading(true);

        try {
            const res = await fetch("/api/tenants", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to delete tenant");
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
        >
            <Trash2 size={14} />
            {loading ? "Deleting..." : "Delete"}
        </button>
    );
}