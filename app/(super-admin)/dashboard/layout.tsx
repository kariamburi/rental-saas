import { ShieldCheck } from "lucide-react";
import SuperAdminMobileMenu, { SuperAdminSidebarContent } from "./SuperAdminMobileMenu";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-900 md:flex">
            <aside className="sticky top-0 z-20 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-5 shadow-sm md:block">
                <SuperAdminSidebarContent />
            </aside>

            <section className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <SuperAdminMobileMenu />

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                    Craft Inventors
                                </p>
                                <h1 className="text-lg font-black text-slate-900">
                                    Rental Management System
                                </h1>
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white sm:flex">
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