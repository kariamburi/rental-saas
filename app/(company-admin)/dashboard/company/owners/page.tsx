import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import { Building2, IdCard, Mail, Phone, UserRound } from "lucide-react";
import AddOwnerModal from "./AddOwnerModal";
import AssignPropertyModal from "./AssignPropertyModal";
import Link from "next/link";
import AddOwnerPayoutModal from "./AddOwnerPayoutModal";
import EditOwnerModal from "./EditOwnerModal";
import DeleteOwnerButton from "./DeleteOwnerButton";


export default async function OwnersPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
    });

    if (!company) redirect("/dashboard");

    const [owners, properties] = await Promise.all([
        prisma.owner.findMany({
            where: { companyId: user.companyId },
            include: {
                properties: {
                    include: {
                        property: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),

        prisma.property.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: "desc" },
        }),
    ]);
    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Owner / Landlord Management
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Register property owners, landlords, contacts and ownership records.
                        </p>
                    </div>

                    <AddOwnerModal />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="Total Owners" value={owners.length} />
                <SummaryCard
                    title="Active Owners"
                    value={owners.filter((o) => o.status === "ACTIVE").length}
                />
                <SummaryCard
                    title="Linked Properties"
                    value={owners.reduce((sum, o) => sum + o.properties.length, 0)}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">Owner List</h2>
                    <p className="text-sm text-slate-500">
                        Landlords and property owners registered under this company
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">ID Number</th>
                                <th className="px-6 py-4">Properties</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {owners.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <UserRound size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No owners yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add the first landlord or property owner.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                owners.map((owner) => (
                                    <tr key={owner.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                    <UserRound size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-950">
                                                        {owner.name}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-400">
                                                        {owner.address || "No address"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                                <Phone size={16} className="text-emerald-600" />
                                                {owner.phone}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail size={16} className="text-emerald-600" />
                                                {owner.email || "-"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                                <IdCard size={16} className="text-emerald-600" />
                                                {owner.idNumber || "-"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                                <Building2 size={16} className="text-emerald-600" />
                                                {owner.properties.length === 0 ? (
                                                    "-"
                                                ) : (
                                                    <div className="space-y-1">
                                                        {owner.properties.map((item) => (
                                                            <div key={item.id}>
                                                                {item.property.name} ({Number(item.percentage)}%)
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {owner.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <EditOwnerModal owner={owner} />

                                                <DeleteOwnerButton
                                                    ownerId={owner.id}
                                                    ownerName={owner.name}
                                                    linkedProperties={owner.properties.length}
                                                />

                                                <AssignPropertyModal ownerId={owner.id} properties={properties} />
                                                <AddOwnerPayoutModal ownerId={owner.id} />

                                                <Link
                                                    href={`/dashboard/company/owners/${owner.id}/statement`}
                                                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
                                                >
                                                    Statement
                                                </Link>

                                                <Link
                                                    href={`/dashboard/company/owners/${owner.id}/ledger`}
                                                    className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                                >
                                                    Ledger
                                                </Link>
                                            </div>
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

function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: number | string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}