"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";
import { deleteCompanyWithData } from "./actions";

export default function DeleteCompanyButton({
    companyId,
    companyName,
}: {
    companyId: string;
    companyName: string;
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            await deleteCompanyWithData(companyId);
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={pending}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                title="Delete company"
            >
                <Trash2 size={16} />
            </button>

            <ConfirmModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirm}
                loading={pending}
                danger
                title="Delete company and all data?"
                subtitle={`This will permanently delete "${companyName}" with all properties, owners, units, tenants, leases, invoices, payments, expenses, maintenance, inspections, bookings and company admins.`}
                confirmText="Delete Company"
            />
        </>
    );
}