"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function DeleteUnitButton({
    unitId,
    unitNumber,
}: {
    unitId: string;
    unitNumber: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleDelete() {
        setLoading(true);

        try {
            const res = await fetch("/api/units", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unitId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setErrorMessage(data.error || "Failed to delete unit");
                setErrorOpen(true);
                return;
            }

            setConfirmOpen(false);
            router.refresh();
        } catch {
            setErrorMessage("Something went wrong");
            setErrorOpen(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                title="Delete Unit"
            >
                <Trash2 size={16} />
            </button>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                loading={loading}
                danger
                title="Delete unit?"
                subtitle={`This will permanently delete Unit ${unitNumber}. This action cannot be undone.`}
                confirmText="Delete Unit"
            />

            <ConfirmModal
                open={errorOpen}
                onClose={() => setErrorOpen(false)}
                onConfirm={() => setErrorOpen(false)}
                title="Unable to delete unit"
                subtitle={errorMessage}
                confirmText="Okay"
            />
        </>
    );
}