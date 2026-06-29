"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";
import { deleteSubscriptionPlan } from "./actions";

export default function DeletePlanButton({
    planId,
    planName,
}: {
    planId: string;
    planName: string;
}) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded cursor-pointer bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-700 hover:bg-red-600 hover:text-white"
            >
                <Trash2 size={13} />
            </button>

            <ConfirmModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() =>
                    startTransition(async () => {
                        await deleteSubscriptionPlan(planId);
                        setOpen(false);
                    })
                }
                loading={pending}
                danger
                title="Delete subscription plan?"
                subtitle={`This will permanently delete "${planName}" if it is not assigned to any company.`}
                confirmText="Delete Plan"
            />
        </>
    );
}