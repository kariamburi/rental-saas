import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    DoorOpen,
    Home,
    IdCard,
    Mail,
    Phone,
    Shield,
    User,
} from "lucide-react";

export default async function TenantProfilePage() {
    const cookieStore = await cookies();

    const tenantId = cookieStore.get("tenant_id")?.value;
    const companyId = cookieStore.get("tenant_company_id")?.value;

    if (!tenantId || !companyId) {
        redirect("/tenant/login");
    }

    const tenant = await prisma.tenant.findFirst({
        where: {
            id: tenantId,
            companyId,
        },
        include: {
            company: true,
            unit: {
                include: { property: true },
            },
            leases: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!tenant) {
        redirect("/tenant/login");
    }

    const activeLease = tenant.leases.find((lease) => lease.status === "ACTIVE");

    return (
        <main className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/tenant/dashboard"
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                    >
                        Back
                    </Link>

                    <Link
                        href="/tenant/lease-agreement"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                    >
                        Lease Agreement
                    </Link>
                </div>

                <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Tenant Profile
                    </p>

                    <h1 className="mt-3 text-3xl font-black">{tenant.name}</h1>

                    <p className="mt-2 text-sm font-semibold text-slate-300">
                        {tenant.company.name}
                    </p>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <InfoCard icon={User} title="Full Name" value={tenant.name} />
                    <InfoCard icon={Phone} title="Phone" value={tenant.phone} />
                    <InfoCard icon={Mail} title="Email" value={tenant.email || "-"} />
                    <InfoCard
                        icon={IdCard}
                        title="National ID"
                        value={tenant.idNumber || "-"}
                    />
                    <InfoCard
                        icon={Shield}
                        title="Emergency Contact"
                        value={tenant.emergencyContact || "-"}
                    />
                    <InfoCard
                        icon={Home}
                        title="Company"
                        value={tenant.company.name}
                    />
                    <InfoCard
                        icon={DoorOpen}
                        title="Property / Unit"
                        value={
                            tenant.unit
                                ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}`
                                : "-"
                        }
                    />
                    <InfoCard
                        icon={Shield}
                        title="Tenant Status"
                        value={tenant.status}
                    />
                    <InfoCard
                        icon={Shield}
                        title="Lease Status"
                        value={activeLease ? activeLease.status : "No active lease"}
                    />
                    <InfoCard
                        icon={Shield}
                        title="Move-in Date"
                        value={
                            tenant.moveInDate
                                ? new Date(tenant.moveInDate).toLocaleDateString()
                                : "-"
                        }
                    />
                </div>
            </div>
        </main>
    );
}

function InfoCard({
    icon: Icon,
    title,
    value,
}: {
    icon: React.ElementType;
    title: string;
    value: string;
}) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon size={20} />
                </span>

                <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {title}
                    </p>
                    <p className="mt-1 font-black text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}