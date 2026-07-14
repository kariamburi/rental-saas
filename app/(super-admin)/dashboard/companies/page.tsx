import { prisma } from "@/lib/prisma";
import { Building2, Mail, Phone, Plus, ShieldCheck } from "lucide-react";
import AddCompanyModal from "./AddCompanyModal";
import Link from "next/link";
import DeleteCompanyButton from "./DeleteCompanyButton";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function CompaniesPage() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Client Management
                        </p>
                        <h1 className="mt-3 text-3xl font-black">Companies</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Manage property management companies subscribed to your rental
                            SaaS platform.
                        </p>
                    </div>

                    <AddCompanyModal />
                </div>
            </div>

            <div className="mb-6 grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Companies" value={companies.length} />
                <SummaryCard
                    title="Active Companies"
                    value={companies.filter((c) => c.status === "ACTIVE").length}
                />
                <SummaryCard
                    title="Inactive Companies"
                    value={companies.filter((c) => c.status !== "ACTIVE").length}
                />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Company List</h2>
                    <p className="text-sm text-slate-500">
                        Registered clients and subscription accounts
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <Building2 size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No companies yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add your first property management client.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/dashboard/companies/${company.id}`}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-950">{company.name}</p>
                                                        <p className="text-xs font-semibold text-slate-400">
                                                            ID: {company.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Mail size={16} className="text-emerald-600" />
                                                {company.email || "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Phone size={16} className="text-emerald-600" />
                                                {company.phone || "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                <ShieldCheck size={14} />
                                                {company.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {new Date(company.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <DeleteCompanyButton
                                                companyId={company.id}
                                                companyName={company.name}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}