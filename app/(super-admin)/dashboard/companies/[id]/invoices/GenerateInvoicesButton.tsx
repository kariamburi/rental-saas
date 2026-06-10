"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus2 } from "lucide-react";

export default function GenerateInvoicesButton({
    companyId,
}: {
    companyId: string;
}) {
    const router = useRouter();
    const now = new Date();

    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function generate() {
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId, year, month }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setMessage(data.error || "Failed to generate invoices");
                return;
            }

            setMessage(
                `Created ${data.created} invoice(s), skipped ${data.skipped}.`
            );

            router.refresh();
        } catch {
            setMessage("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
                <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Year"
                />

                <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                >
                    {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2000, i, 1).toLocaleString("en-US", {
                                month: "long",
                            })}
                        </option>
                    ))}
                </select>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                >
                    <FilePlus2 size={18} />
                    {loading ? "Generating..." : "Generate Invoices"}
                </button>
            </div>

            {message && (
                <p className="mt-4 text-sm font-bold text-emerald-700">{message}</p>
            )}
        </div>
    );
}