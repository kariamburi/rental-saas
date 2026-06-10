import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function LeaseAgreementPage({
    params,
}: {
    params: Promise<{ id: string; leaseId: string }>;
}) {
    const { id, leaseId } = await params;

    const lease = await prisma.lease.findFirst({
        where: { id: leaseId, companyId: id },
        include: {
            company: true,
            tenant: true,
            unit: {
                include: { property: true },
            },
        },
    });

    if (!lease) notFound();

    const totalMonthly =
        Number(lease.monthlyRent) +
        Number(lease.garbageCharge) +
        Number(lease.securityCharge) +
        Number(lease.serviceCharge);

    return (
        <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
            <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-8 print:shadow-none">
                <div className="mb-6 flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Lease Agreement
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Agreement Ref: LSE-{lease.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <div className="text-right">
                        <PrintButton />
                        <p className="mt-3 text-sm font-black text-slate-950 print:mt-0">
                            {lease.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {lease.company.phone || ""}
                        </p>
                    </div>
                </div>

                <section className="grid grid-cols-2 gap-3 text-sm">
                    <Info title="Landlord / Agent" value={lease.company.name} />
                    <Info title="Tenant" value={lease.tenant.name} />
                    <Info title="Tenant Phone" value={lease.tenant.phone} />
                    <Info
                        title="Property / Unit"
                        value={`${lease.unit.property.name} - Unit ${lease.unit.unitNumber}`}
                    />
                    <Info
                        title="Start Date"
                        value={new Date(lease.startDate).toLocaleDateString()}
                    />
                    <Info
                        title="End Date"
                        value={
                            lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "-"
                        }
                    />
                    <Info title="Status" value={lease.status} />
                    <Info
                        title="Deposit"
                        value={`KES ${Number(lease.depositAmount).toLocaleString()}`}
                    />
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                            <tr>
                                <th className="p-4">Monthly Charge</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Charge label="Monthly Rent" value={Number(lease.monthlyRent)} />
                            <Charge
                                label="Garbage Collection"
                                value={Number(lease.garbageCharge)}
                            />
                            <Charge label="Security" value={Number(lease.securityCharge)} />
                            <Charge label="Service Charge" value={Number(lease.serviceCharge)} />

                            <tr className="border-t bg-emerald-50">
                                <td className="p-4 font-black text-emerald-800">
                                    Total Monthly Payable
                                </td>
                                <td className="p-4 text-right font-black text-emerald-800">
                                    KES {totalMonthly.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-700">
                    <h2 className="mb-3 text-lg font-black text-slate-950">
                        Terms and Conditions
                    </h2>

                    <div className="whitespace-pre-line">
                        {lease.agreementTerms ||
                            `1. The tenant agrees to occupy the above unit and pay the monthly rent and applicable charges on or before the agreed rent due day.

2. The tenant shall keep the property in good condition and report any maintenance issues promptly to the landlord or property manager.

3. The tenant shall not sublet, damage, or misuse the premises. Any damages caused by negligence may be recovered from the tenant.

4. The landlord or property manager reserves the right to take lawful action where rent remains unpaid or where the agreement terms are breached.`}
                    </div>
                </section>

                <section className="mt-10 grid grid-cols-2 gap-10 text-sm">
                    <Signature title="Landlord / Agent Signature" />
                    <Signature title="Tenant Signature" />
                </section>

                <p className="mt-8 text-center text-xs font-semibold text-slate-400">
                    Powered by Craft Inventors
                </p>
            </div>
        </main>
    );
}

function Info({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 p-3 print:p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {title}
            </p>
            <p className="mt-1 font-bold text-slate-800">{value}</p>
        </div>
    );
}

function Charge({ label, value }: { label: string; value: number }) {
    return (
        <tr className="border-t">
            <td className="p-4 font-bold">{label}</td>
            <td className="p-4 text-right font-black">
                KES {value.toLocaleString()}
            </td>
        </tr>
    );
}

function Signature({ title }: { title: string }) {
    return (
        <div>
            <p className="font-black text-slate-700">{title}</p>
            <div className="mt-10 border-t border-slate-400 pt-2 text-slate-500">
                Signature / Date
            </div>
        </div>
    );
}