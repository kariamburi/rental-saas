"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, AlertTriangle } from "lucide-react";

export default function ConvertBookingButton({
    bookingId,
}: {
    bookingId: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function convertBooking() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/unit-bookings/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Failed to convert booking");
                return;
            }

            setOpen(false);
            router.push(`/dashboard/company/leases?tenantId=${data.tenant.id}`);
            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white disabled:opacity-60"
            >
                <UserPlus size={14} />
                Convert
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    <UserPlus size={22} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-950">
                                        Convert Booking
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Create tenant from this booking
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle
                                        size={20}
                                        className="mt-0.5 shrink-0 text-amber-700"
                                    />
                                    <div>
                                        <p className="text-sm font-black text-amber-800">
                                            Confirm conversion
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-amber-700">
                                            This will create an active tenant, mark the unit as
                                            occupied, and mark this booking as converted.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                    className="flex-1 cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={convertBooking}
                                    disabled={loading}
                                    className="flex-1 cursor-pointer rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {loading ? "Converting..." : "Convert"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}