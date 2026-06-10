import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect, notFound } from "next/navigation";
import PrintButton from "./PrintButton";


export default async function OwnerPayoutReceiptPage({
    params,
}: {
    params: Promise<{ payoutId: string }>;
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const { payoutId } = await params;

    const payout = await prisma.ownerPayout.findFirst({
        where: {
            id: payoutId,
            companyId: user.companyId,
        },
        include: {
            company: true,
            owner: true,
        },
    });

    if (!payout) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
            <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl print:max-w-none print:rounded-none print:p-6 print:shadow-none">
                <div className="mb-4 flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-1 text-2xl font-black text-slate-950">
                            Owner Payout Receipt
                        </h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Receipt No: OPR-{payout.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <div className="text-right">
                        <PrintButton />
                        <p className="mt-2 text-sm font-black text-slate-950 print:mt-0">
                            {payout.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {payout.company.phone || ""}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200">
                    <Row label="Owner" value={payout.owner.name} />
                    <Row label="Phone" value={payout.owner.phone} />
                    <Row label="Method" value={payout.method} />
                    <Row label="Reference" value={payout.reference || "-"} />
                    <Row
                        label="Payout Date"
                        value={new Date(payout.payoutDate).toLocaleDateString()}
                    />
                    <Row label="Paid By" value={payout.paidBy || "-"} />
                </div>

                <div className="mt-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-700">
                        Amount Paid to Owner
                    </p>
                    <h2 className="mt-1 text-3xl font-black text-emerald-800">
                        KES {Number(payout.amount).toLocaleString()}
                    </h2>
                </div>

                {payout.notes && (
                    <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Notes
                        </p>
                        <p className="mt-1 whitespace-pre-line text-xs font-semibold text-slate-700">
                            {payout.notes}
                        </p>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-6 text-xs">
                    <div>
                        <p className="font-black text-slate-700">Paid By</p>
                        <div className="mt-8 border-t border-slate-400 pt-1 text-slate-500">
                            Signature
                        </div>
                    </div>

                    <div>
                        <p className="font-black text-slate-700">Owner Signature</p>
                        <div className="mt-8 border-t border-slate-400 pt-1 text-slate-500">
                            Signature
                        </div>
                    </div>
                </div>

                <p className="mt-5 border-t border-slate-200 pt-3 text-center text-[10px] font-semibold text-slate-400">
                    Powered by Craft Inventors
                </p>
            </div>
        </main>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-3 border-b border-slate-100 px-4 py-2 last:border-b-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p className="col-span-2 text-xs font-bold text-slate-800">{value}</p>
        </div>
    );
}