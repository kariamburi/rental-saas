"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePropertyWithData } from "./actions";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function DeletePropertyButton({
    propertyId,
    propertyName,
    unitCount,
    canDeleteAll = false,
}: {
    propertyId: string;
    propertyName: string;
    unitCount: number;
    canDeleteAll?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [blockedOpen, setBlockedOpen] = useState(false);
    function handleOpen() {
        if (!canDeleteAll && unitCount > 0) {
            setBlockedOpen(true);
            return;
        }

        setOpen(true);
    }

    function handleConfirm() {
        startTransition(async () => {
            await deletePropertyWithData(propertyId);
        });
    }

    return (
        <>
            <button
                onClick={handleOpen}
                disabled={pending}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                title={canDeleteAll ? "Delete property and all data" : "Delete property"}
            >
                <Trash2 size={16} />
            </button>

            <ConfirmModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirm}
                loading={pending}
                danger
                title={canDeleteAll ? "Delete property and all data?" : "Delete property?"}
                subtitle={
                    canDeleteAll
                        ? `This will permanently delete "${propertyName}" with units, tenants, leases, invoices, payments, expenses, maintenance, meter readings, bookings, inspections and ownership records.`
                        : `This will permanently delete "${propertyName}". This action cannot be undone.`
                }
                confirmText={canDeleteAll ? "Delete All Data" : "Delete"}
            />
            <ConfirmModal
                open={blockedOpen}
                onClose={() => setBlockedOpen(false)}
                onConfirm={() => setBlockedOpen(false)}
                title="Property has units"
                subtitle="You cannot delete this property because it has units. Delete or move the units first."
                confirmText="Okay"
            />
        </>
    );
}