"use client";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="rounded-xl cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-black text-white print:hidden"
        >
            Print
        </button>
    );
}