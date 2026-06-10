import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { Users } from "lucide-react";

async function createCompanyAdmin(formData: FormData) {
    "use server";

    const user = await getAuthUser();

    if (!user || user.role !== Roles.SUPER_ADMIN) {
        redirect("/login");
    }

    const companyId = String(formData.get("companyId") || "");
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!companyId || !name || !email || !password) {
        throw new Error("All fields are required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            companyId,
            name,
            email,
            password: hashedPassword,
            role: Roles.COMPANY_ADMIN,
            status: "ACTIVE",
        },
    });

    redirect("/dashboard/company-admins");
}

export default async function CompanyAdminsPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== Roles.SUPER_ADMIN) {
        redirect("/dashboard/company");
    }

    const [companies, admins] = await Promise.all([
        prisma.company.findMany({
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
            where: { role: Roles.COMPANY_ADMIN },
            include: { company: true },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <main className="p-6">
            <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Super Admin
                </p>
                <h2 className="mt-3 text-3xl font-black">Company Admins</h2>
                <p className="mt-2 max-w-2xl text-slate-300">
                    Create and manage admins assigned to registered property companies.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Users size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-950">
                                Add Company Admin
                            </h3>
                            <p className="text-sm text-slate-500">
                                Assign admin to a company
                            </p>
                        </div>
                    </div>

                    <form action={createCompanyAdmin} className="space-y-4">
                        <select
                            name="companyId"
                            required
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="">Select company</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>

                        <input
                            name="name"
                            placeholder="Admin name"
                            required
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                        />

                        <input
                            name="email"
                            type="email"
                            placeholder="Admin email"
                            required
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                        />

                        <input
                            name="password"
                            type="password"
                            placeholder="Temporary password"
                            required
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                        />

                        <button className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                            Create Admin
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-6">
                        <h3 className="text-lg font-black text-slate-950">
                            Existing Company Admins
                        </h3>
                        <p className="text-sm text-slate-500">
                            Admin users currently assigned to companies
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {admins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {admin.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {admin.email}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {admin.company?.name ?? "Not assigned"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                {admin.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}