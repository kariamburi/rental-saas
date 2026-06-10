import Link from "next/link";
import {
    Building2,
    Gauge,
    Landmark,
    Settings,
    ShieldCheck,
    CreditCard,
    Users,
} from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const links = [
        { label: "Dashboard", href: "/dashboard", icon: Gauge },
        { label: "Companies", href: "/dashboard/companies", icon: Building2 },
        { label: "Company Admins", href: "/dashboard/company-admins", icon: Users },
        { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
        { label: "SaaS Settings", href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-900 md:flex">
            <aside className="sticky top-0 z-20 h-screen w-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-5 shadow-sm md:w-72">
                <div className="mb-8 rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-400">
                        <Landmark size={26} />
                    </div>

                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                        Super Admin
                    </div>

                    <h2 className="mt-2 text-2xl font-black">Rental SaaS</h2>

                    <p className="mt-2 text-sm text-slate-300">
                        Manage companies, admins and subscriptions.
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
                                Craft Inventors
                            </p>
                            <h1 className="text-lg font-black text-slate-900">
                                Rental Management System
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                            <ShieldCheck size={16} />
                            Super Admin
                        </div>
                    </div>
                </header>

                {children}
            </section>
        </div>
    );
}