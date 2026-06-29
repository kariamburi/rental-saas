"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { canAccessCompanyRoute } from "@/lib/company-access-map";

const links = [
    { label: "Dashboard", href: "/dashboard/company", icon: Gauge, exact: true },
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
    { label: "Users", href: "/dashboard/company/users", icon: Users },
];

export default function CompanyMobileMenu({ role }: { role: string }) {
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
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-emerald-700 md:hidden"
            >
                <Menu size={22} />
            </button>

            {open ? (
                <div className="fixed inset-0 z-[9999] md:hidden">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    <aside className="absolute left-0 top-0 z-[10000] h-dvh w-[92vw] max-w-[360px] overflow-y-auto bg-white p-5 shadow-2xl">
                        <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                                        Company Workspace
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black leading-tight">
                                        Property Manager
                                    </h2>
                                    <p className="mt-2 text-sm font-semibold text-slate-300">
                                        Manage rental operations.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <SidebarLinks role={role} onClick={() => setOpen(false)} />

                        <div className="mt-6 border-t border-slate-200 pt-4">
                            <LogoutButton />
                        </div>
                    </aside>
                </div>
            ) : null}
        </>
    );
}

export function SidebarContent({ role }: { role: string }) {
    return (
        <>
            <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Company Workspace
                </p>
                <h2 className="mt-2 text-2xl font-black">Property Manager</h2>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                    Manage properties, tenants and billing.
                </p>
            </div>

            <SidebarLinks role={role} />

            <div className="lg:hidden mt-4 border-t border-slate-200 pt-4">
                <LogoutButton />
            </div>
        </>
    );
}

function SidebarLinks({
    role,
    onClick,
}: {
    role: string;
    onClick?: () => void;
}) {
    const pathname = usePathname();

    const allowedLinks = links.filter((link) =>
        canAccessCompanyRoute(role, link.href)
    );

    return (
        <nav className="space-y-1">
            {allowedLinks.map(({ label, href, icon: Icon, exact }) => {
                const active = exact
                    ? pathname === href
                    : pathname === href || pathname.startsWith(`${href}/`);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClick}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${active
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                    >
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${active
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-50 text-emerald-600 group-hover:bg-white"
                                }`}
                        >
                            <Icon size={17} />
                        </span>

                        <span className="min-w-0 flex-1 truncate">{label}</span>

                        {active ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        ) : null}
                    </Link>
                );
            })}
        </nav>
    );
}