import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function ReceiptPage({
    params,
}: {
    params: Promise<{ id: string; paymentId: string }>;
}) {
    const { id, paymentId } = await params;

    const payment = await prisma.payment.findFirst({
        where: { id: paymentId, companyId: id },
        include: {
            tenant: true,
            invoice: {
                include: {
                    unit: { include: { property: true } },
                },
            },
            company: true,
        },
    });

    if (!payment) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-8 print:shadow-none">
                <div className="mb-6 flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Payment Receipt
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Receipt No: RCT-{payment.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <div className="text-right">
                        <PrintButton />
                        <p className="mt-3 text-sm font-black text-slate-950 print:mt-0">
                            {payment.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {payment.company.phone || ""}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info title="Tenant" value={payment.tenant.name} />
                    <Info title="Phone" value={payment.tenant.phone} />
                    <Info title="Invoice No" value={payment.invoice.invoiceNo} />
                    <Info title="Payment Method" value={payment.method} />
                    <Info
                        title="Property / Unit"
                        value={`${payment.invoice.unit.property.name} - Unit ${payment.invoice.unit.unitNumber}`}
                    />
                    <Info title="Reference" value={payment.reference || "-"} />
                    <Info
                        title="Payment Date"
                        value={new Date(payment.paymentDate).toLocaleDateString()}
                    />
                    <Info title="Received By" value={payment.receivedBy || "-"} />
                </div>

                <div className="mt-6 rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-5">
                    <p className="text-sm font-black uppercase text-emerald-700">
                        Amount Paid
                    </p>
                    <h2 className="mt-1 text-4xl font-black text-emerald-800">
                        KES {Number(payment.amount).toLocaleString()}
                    </h2>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p className="font-black text-slate-700">Received By</p>
                        <div className="mt-8 border-t border-slate-400 pt-2 text-slate-500">
                            Signature
                        </div>
                    </div>

                    <div>
                        <p className="font-black text-slate-700">Tenant Signature</p>
                        <div className="mt-8 border-t border-slate-400 pt-2 text-slate-500">
                            Signature
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs font-semibold text-slate-400">
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