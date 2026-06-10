import Link from "next/link";
import { FileText, Home, ReceiptText, User } from "lucide-react";
import TenantLogoutButton from "./TenantLogoutButton";

export default function TenantPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const links = [
        { label: "Dashboard", href: "/tenant/dashboard", icon: Home },
        { label: "Profile", href: "/tenant/profile", icon: User },
        { label: "Lease Agreement", href: "/tenant/lease-agreement", icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-100 md:flex">
            <aside className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white p-3 shadow-sm md:fixed md:left-0 md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r md:p-4">
                <div className="rounded-2xl bg-slate-950 p-4 text-white md:p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 md:h-12 md:w-12">
                        <ReceiptText size={24} />
                    </div>

                    <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300 md:mt-4">
                        Tenant Portal
                    </p>
                    <h2 className="mt-1 text-lg font-black md:mt-2 md:text-xl">
                        My Tenancy
                    </h2>
                    <p className="mt-1 text-xs text-slate-300 md:text-sm">
                        Rent, payments and maintenance
                    </p>
                </div>

                <nav className="mt-3 grid grid-cols-3 gap-2 md:mt-5 md:grid-cols-1">
                    {links.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center text-[11px] font-bold text-slate-600 hover:bg-slate-950 hover:text-white md:flex-row md:justify-start md:gap-3 md:px-4 md:text-sm"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-white/15 group-hover:text-emerald-300 md:h-9 md:w-9">
                                <Icon size={18} />
                            </span>
                            <span className="leading-tight">{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-3 md:mt-5">
                    <TenantLogoutButton />
                </div>
            </aside>

            <section className="flex-1 md:ml-72">{children}</section>
        </div>
    );
}