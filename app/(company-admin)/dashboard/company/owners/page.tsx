import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import {
    Building2,
    IdCard,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";
import AddOwnerModal from "./AddOwnerModal";
import AssignPropertyModal from "./AssignPropertyModal";
import Link from "next/link";
import AddOwnerPayoutModal from "./AddOwnerPayoutModal";
import EditOwnerModal from "./EditOwnerModal";
import DeleteOwnerButton from "./DeleteOwnerButton";
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function OwnersPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/owners");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const [owners, properties] = await Promise.all([
        prisma.owner.findMany({
            where: { companyId: companyId },
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
            where: { companyId: companyId },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const activeOwners = owners.filter((owner) => owner.status === "ACTIVE");
    const inactiveOwners = owners.filter((owner) => owner.status !== "ACTIVE");

    const linkedProperties = owners.reduce(
        (sum, owner) => sum + owner.properties.length,
        0
    );

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Owner / Landlord Management
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Register property owners, landlords, contacts and ownership records.
                        </p>
                    </div>

                    <AddOwnerModal />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Owners" value={owners.length} />
                <SummaryCard
                    title="Active Owners"
                    value={activeOwners.length}
                    success
                />
                <SummaryCard title="Inactive Owners" value={inactiveOwners.length} />
                <SummaryCard title="Linked Properties" value={linkedProperties} success />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Owner List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Landlords and property owners registered under this company.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1150px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Owner
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Phone
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Email
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        ID Number
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Properties
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Status
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {owners.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center"
                                        >
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
                                        <tr
                                            key={owner.id}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                        <UserRound size={15} />
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {owner.name}
                                                        </p>

                                                        <p className="text-[11px] text-slate-500">
                                                            {owner.address || "No address"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone size={13} />
                                                    {owner.phone}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Mail size={13} />
                                                    {owner.email || "-"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <IdCard size={13} />
                                                    {owner.idNumber || "-"}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-slate-700">
                                                {owner.properties.length === 0 ? (
                                                    "-"
                                                ) : (
                                                    <div className="space-y-1">
                                                        {owner.properties.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700"
                                                            >
                                                                <Building2 size={13} />
                                                                {item.property.name} (
                                                                {Number(item.percentage)}%)
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(
                                                        owner.status
                                                    )}`}
                                                >
                                                    {owner.status}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <EditOwnerModal owner={owner} />

                                                    <DeleteOwnerButton
                                                        ownerId={owner.id}
                                                        ownerName={owner.name}
                                                        linkedProperties={owner.properties.length}
                                                    />

                                                    <AssignPropertyModal
                                                        ownerId={owner.id}
                                                        properties={properties}
                                                    />

                                                    <AddOwnerPayoutModal ownerId={owner.id} />

                                                    <Link
                                                        href={`/dashboard/company/owners/${owner.id}/statement`}
                                                        className="rounded bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white"
                                                    >
                                                        Statement
                                                    </Link>

                                                    <Link
                                                        href={`/dashboard/company/owners/${owner.id}/ledger`}
                                                        className="rounded bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
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
            </section>
        </main>
    );
}

function statusStyle(status: string) {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
    if (status === "INACTIVE") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-700";
}

function SummaryCard({
    title,
    value,
    success,
}: {
    title: string;
    value: number | string;
    success?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>

            <h2
                className={`mt-2 text-2xl font-black ${success ? "text-emerald-700" : "text-slate-950"
                    }`}
            >
                {value}
            </h2>
        </div>
    );
}