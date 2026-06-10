"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Filter, X } from "lucide-react";

export default function StatementDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [from, setFrom] = useState(searchParams.get("from") || "");
    const [to, setTo] = useState(searchParams.get("to") || "");

    function applyFilter(e: React.FormEvent) {
        e.preventDefault();

        const params = new URLSearchParams();

        if (from) params.set("from", from);
        if (to) params.set("to", to);

        router.push(`?${params.toString()}`);
    }

    function clearFilter() {
        setFrom("");
        setTo("");
        router.push("?");
    }

    return (
        <form
            onSubmit={applyFilter}
            className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm print:hidden"
        >
            <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <CalendarDays size={18} className="text-emerald-600" />
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <CalendarDays size={18} className="text-emerald-600" />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                </div>

                <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                >
                    <Filter size={18} />
                    Apply Filter
                </button>

                <button
                    type="button"
                    onClick={clearFilter}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                    <X size={18} />
                    Clear
                </button>
            </div>
        </form>
    );
}