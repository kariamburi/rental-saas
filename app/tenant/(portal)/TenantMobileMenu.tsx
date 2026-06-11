"use client";

import Link from "next/link";
import { FileText, Home, Menu, ReceiptText, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import TenantLogoutButton from "./TenantLogoutButton";

const links = [
    { label: "Dashboard", href: "/tenant/dashboard", icon: Home },
    { label: "Profile", href: "/tenant/profile", icon: User },
    { label: "Lease Agreement", href: "/tenant/lease-agreement", icon: FileText },
];

export default function TenantMobileMenu() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md md:hidden"
            >
                <Menu size={22} />
            </button>

            {open && (
                <div className="fixed inset-0 z-[9999] md:hidden">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-slate-950/60"
                    />

                    <aside className="absolute left-0 top-0 z-[10000] h-dvh w-[92vw] max-w-[360px] overflow-y-auto bg-white p-5 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300">
                                    <ReceiptText size={24} />
                                </div>

                                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                    Tenant Portal
                                </p>

                                <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                                    My Tenancy
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Rent, payments and maintenance
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <TenantSidebarLinks onClick={() => setOpen(false)} />

                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <TenantLogoutButton />
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

export function TenantSidebarContent() {
    return (
        <>
            <div className="mb-8 rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                    <ReceiptText size={24} />
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                    Tenant Portal
                </p>

                <h2 className="mt-2 text-2xl font-black">My Tenancy</h2>

                <p className="mt-2 text-sm text-slate-300">
                    Rent, payments and maintenance
                </p>
            </div>

            <TenantSidebarLinks />

            <div className="mt-6 border-t border-slate-100 pt-4">
                <TenantLogoutButton />
            </div>
        </>
    );
}

function TenantSidebarLinks({ onClick }: { onClick?: () => void }) {
    return (
        <nav className="space-y-1">
            {links.map(({ label, href, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    onClick={onClick}
                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-white/15 group-hover:text-emerald-300">
                        <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                        {label}
                    </span>
                </Link>
            ))}
        </nav>
    );
}