"use client";

import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
    open,
    title,
    subtitle,
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    loading = false,
    onClose,
    onConfirm,
}: {
    open: boolean;
    title: string;
    subtitle?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div className="flex gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                                }`}
                        >
                            <AlertTriangle size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-slate-950">
                                {title}
                            </h2>

                            {subtitle ? (
                                <p className="mt-1 max-w-full whitespace-normal break-words text-sm font-semibold leading-6 text-slate-500">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl cursor-pointer bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-xl cursor-pointer px-4 py-2 text-sm font-black text-white transition disabled:opacity-60 ${danger
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                    >
                        {loading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}