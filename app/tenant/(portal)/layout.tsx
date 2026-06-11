import TenantMobileMenu, { TenantSidebarContent } from "./TenantMobileMenu";

export default function TenantPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
            <aside className="sticky top-0 z-20 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-5 shadow-sm md:block">
                <TenantSidebarContent />
            </aside>

            <section className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6">
                    <div className="flex items-center gap-3">
                        <TenantMobileMenu />

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                Tenant Portal
                            </p>
                            <h1 className="text-lg font-black text-slate-900">
                                My Tenancy
                            </h1>
                        </div>
                    </div>
                </header>

                {children}
            </section>
        </div>
    );
}