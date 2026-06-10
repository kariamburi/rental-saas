"use client";

export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="rounded-2xl cursor-pointer bg-slate-950 px-5 py-3 text-sm font-black text-white print:hidden"
        >
            Print
        </button>
    );
}