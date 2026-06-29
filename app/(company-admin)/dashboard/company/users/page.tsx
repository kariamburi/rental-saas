import { prisma } from "@/lib/prisma";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";
import { Roles } from "@/lib/roles";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import AddUserModal from "./AddUserModal";


export default async function CompanyUsersPage() {
    const { companyId, user, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/users");

    const users = await prisma.user.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
    });

    const canManageUsers =
        isSuperAdmin || user.role === Roles.COMPANY_ADMIN || user.role === Roles.MANAGER;

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Company Users
                </p>

                <h1 className="mt-3 text-3xl font-black">User Management</h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                    Manage staff users and their access roles for this company.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            User Accounts
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Company Admin can add staff users, but not another admin.
                        </p>
                    </div>

                    {canManageUsers ? <AddUserModal companyId={companyId} /> : null}
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
                                            Add the first staff user for this company.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((item) => (
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        <td className="px-2 py-2">
                                            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                                <UserRound size={13} />
                                                {item.name}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2 text-slate-700">
                                            <span className="inline-flex items-center gap-1">
                                                <Mail size={13} />
                                                {item.email}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                <ShieldCheck size={13} />
                                                {item.role}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-bold ${item.status === "ACTIVE"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2 text-slate-600">
                                            {new Date(item.createdAt).toLocaleDateString("en-KE")}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}