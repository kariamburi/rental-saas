"use client";

import Link from "next/link";
import {
    AlertTriangle,
    BarChart3,
    BedDouble,
    CalendarCheck,
    ClipboardCheck,
    DoorOpen,
    FileSignature,
    FileText,
    Gauge,
    HandCoins,
    Home,
    Menu,
    ReceiptText,
    UserRound,
    Users,
    WalletCards,
    Wrench,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/app/components/LogoutButton";

const links = [
    { label: "Dashboard", href: "/dashboard/company", icon: Gauge },
    { label: "Properties", href: "/dashboard/company/properties", icon: Home },
    { label: "Owners", href: "/dashboard/company/owners", icon: UserRound },
    { label: "Owner Payouts", href: "/dashboard/company/owner-payouts", icon: HandCoins },
    { label: "Units", href: "/dashboard/company/units", icon: DoorOpen },
    { label: "Vacancies", href: "/dashboard/company/vacancies", icon: BedDouble },
    { label: "Bookings", href: "/dashboard/company/bookings", icon: CalendarCheck },
    { label: "Tenants", href: "/dashboard/company/tenants", icon: Users },
    { label: "Leases", href: "/dashboard/company/leases", icon: FileSignature },
    { label: "Meter Readings", href: "/dashboard/company/meter-readings", icon: Gauge },
    { label: "Invoices", href: "/dashboard/company/invoices", icon: FileText },
    { label: "Payments", href: "/dashboard/company/payments", icon: WalletCards },
    { label: "Expenses", href: "/dashboard/company/expenses", icon: ReceiptText },
    { label: "Maintenance", href: "/dashboard/company/maintenance", icon: Wrench },
    { label: "Inspections", href: "/dashboard/company/inspections", icon: ClipboardCheck },
    { label: "Reports", href: "/dashboard/company/reports", icon: BarChart3 },
    { label: "Arrears", href: "/dashboard/company/arrears", icon: AlertTriangle },
];

export default function CompanyMobileMenu() {
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
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                    Company Admin
                                </p>
                                <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                                    Property Manager
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <SidebarLinks onClick={() => setOpen(false)} />

                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <LogoutButton />
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

export function SidebarContent() {
    return (
        <>
            <div className="mb-8 rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Company Admin
                </p>
                <h2 className="mt-2 text-2xl font-black">Property Manager</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Manage properties, tenants and billing.
                </p>
            </div>

            <SidebarLinks />

            <div className="mt-6 border-t border-slate-100 pt-4">
                <LogoutButton />
            </div>
        </>
    );
}

function SidebarLinks({ onClick }: { onClick?: () => void }) {
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