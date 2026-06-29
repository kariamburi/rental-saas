"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";

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
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [messageOpen, setMessageOpen] = useState(false);
    const [message, setMessage] = useState("");

    function openDeleteModal() {
        if (linkedProperties > 0) {
            setMessage("You cannot delete this owner because they are linked to properties.");
            setMessageOpen(true);
            return;
        }

        setConfirmOpen(true);
    }

    async function handleDelete() {
        setLoading(true);

        try {
            const res = await fetch("/api/owners", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ownerId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setMessage(data.error || "Failed to delete owner");
                setMessageOpen(true);
                return;
            }

            setConfirmOpen(false);
            router.refresh();
        } catch {
            setMessage("Something went wrong");
            setMessageOpen(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={openDeleteModal}
                disabled={loading}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                title="Delete owner"
            >
                <Trash2 size={16} />
            </button>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                loading={loading}
                danger
                title="Delete owner?"
                subtitle={`This will permanently delete ${ownerName}. This action cannot be undone.`}
                confirmText="Delete Owner"
            />

            <ConfirmModal
                open={messageOpen}
                onClose={() => setMessageOpen(false)}
                onConfirm={() => setMessageOpen(false)}
                title="Unable to delete owner"
                subtitle={message}
                confirmText="Okay"
            />
        </>
    );
}