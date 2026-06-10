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
    ReceiptText,
    UserRound,
    Users,
    WalletCards,
    Wrench,
} from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";

export default function CompanyDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-900 md:flex">
            <aside className="sticky top-0 z-20 h-screen w-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-5 shadow-sm md:w-72">
                <div className="mb-8 rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                        Company Admin
                    </p>
                    <h2 className="mt-2 text-2xl font-black">Property Manager</h2>
                    <p className="mt-2 text-sm text-slate-300">
                        Manage properties, tenants and billing.
                    </p>
                </div>

                <nav className="space-y-1">
                    {links.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-950 hover:text-white"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-white/15 group-hover:text-emerald-300">
                                <Icon size={18} />
                            </span>
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-6 border-t border-slate-100 pt-4">
                    <LogoutButton />
                </div>
            </aside>

            <section className="min-w-0 flex-1">
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                Company Workspace
                            </p>
                            <h1 className="text-lg font-black text-slate-900">
                                Rental Management System
                            </h1>
                        </div>

                        <div className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                            Company Admin
                        </div>
                    </div>
                </header>

                {children}
            </section>
        </div>
    );
}