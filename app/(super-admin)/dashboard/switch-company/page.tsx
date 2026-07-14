import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect } from "next/navigation";
import { switchCompany } from "./actions";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function SwitchCompanyPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");
    if (user.role !== Roles.SUPER_ADMIN) redirect("/dashboard");

    const companies = await prisma.company.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <main className="p-6">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <p className="text-sm font-black text-slate-500">Super Admin</p>
                <h1 className="mt-1 text-3xl font-black text-slate-950">
                    Switch Company
                </h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                    Select the company you want to manage.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3">
                    {companies.map((company) => (
                        <form key={company.id} action={switchCompany}>
                            <input type="hidden" name="companyId" value={company.id} />

                            <button className="w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
                                <p className="font-black text-slate-950">{company.name}</p>
                                <p className="text-sm font-semibold text-slate-500">
                                    {company.email || "No email"}
                                </p>
                            </button>
                        </form>
                    ))}
                </div>
            </div>
        </main>
    );
}