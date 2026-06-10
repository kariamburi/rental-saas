"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

export default function CreateMaintenanceFromInspectionButton({
    inspectionId,
}: {
    inspectionId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function createRequest() {
        setLoading(true);

        try {
            const res = await fetch("/api/property-inspections/create-maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inspectionId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to create maintenance request");
                return;
            }

            router.push("/dashboard/company/maintenance");
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
            onClick={createRequest}
            disabled={loading}
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:opacity-60 print:hidden"
        >
            <span className="inline-flex items-center gap-2">
                <Wrench size={18} />
                {loading ? "Creating..." : "Create Maintenance"}
            </span>
        </button>
    );
}