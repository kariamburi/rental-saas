import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Building2,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import AddCompanyUserModal from "./AddCompanyUserModal";


export default async function CompanyDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const company = await prisma.company.findUnique({
        where: { id },
    });

    if (!company) notFound();

    const users = await prisma.user.findMany({
        where: { companyId: id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Company Users
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                            <Info icon={Mail} text={company.email || "No email"} />
                            <Info icon={Phone} text={company.phone || "No phone"} />
                            <Info icon={MapPin} text={company.address || "No address"} />
                        </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-300">
                        {company.status}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Company Users" value={users.length} />
                <SummaryCard
                    title="Active Users"
                    value={users.filter((u) => u.status === "ACTIVE").length}
                    success
                />
                <SummaryCard
                    title="Disabled Users"
                    value={users.filter((u) => u.status !== "ACTIVE").length}
                    danger
                />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                User Accounts
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Add and manage login users for this company only.
                            </p>
                        </div>

                        <AddCompanyUserModal companyId={company.id} />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        User
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Email
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Role
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Status
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Created
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                <UserRound size={26} />
                                            </div>

                                            <h3 className="mt-4 text-lg font-black text-slate-950">
                                                No users yet
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Add the first company admin login account.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-slate-50">
                                            <td className="px-2 py-2">
                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                    <UserRound size={13} />
                                                    {user.name}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-slate-700">
                                                {user.email}
                                            </td>

                                            <td className="px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                    <ShieldCheck size={13} />
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${user.status === "ACTIVE"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-red-50 text-red-700"
                                                        }`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-slate-600">
                                                {new Date(user.createdAt).toLocaleDateString(
                                                    "en-KE"
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}

function Info({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <Icon size={16} className="text-emerald-300" />
            {text}
        </span>
    );
}

function SummaryCard({
    title,
    value,
    success,
    danger,
}: {
    title: string;
    value: number;
    success?: boolean;
    danger?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : success
            ? "text-emerald-700"
            : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}