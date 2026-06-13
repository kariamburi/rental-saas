import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import GoBackButton from "./GoBackButton";

export default async function InvoicePrintPage({
    params,
}: {
    params: Promise<{ id: string; invoiceId: string }>;
}) {
    const { id, invoiceId } = await params;

    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, companyId: id },
        include: {
            company: true,
            tenant: true,
            unit: { include: { property: true } },
            items: true,
        },
    });

    if (!invoice) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-8 print:shadow-none">
                <div className="mb-6 flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Rent Invoice
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Invoice No: {invoice.invoiceNo}
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="mb-3 flex items-center justify-end gap-2 print:hidden">
                            {/**  <GoBackButton />*/}
                            <PrintButton />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-950 print:mt-0">
                            {invoice.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {invoice.company.phone || ""}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info title="Tenant" value={invoice.tenant.name} />
                    <Info title="Phone" value={invoice.tenant.phone} />
                    <Info
                        title="Property / Unit"
                        value={`${invoice.unit.property.name} - Unit ${invoice.unit.unitNumber}`}
                    />
                    <Info title="Status" value={invoice.status} />
                    <Info
                        title="Invoice Date"
                        value={new Date(invoice.invoiceDate).toLocaleDateString()}
                    />
                    <Info
                        title="Due Date"
                        value={new Date(invoice.dueDate).toLocaleDateString()}
                    />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                            <tr>
                                <th className="p-4">Description</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {invoice.items.length > 0 ? (
                                invoice.items.map((item) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="p-4 font-bold">{item.description}</td>
                                        <td className="p-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-black">
                                            KES {Number(item.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-t">
                                    <td className="p-4 font-bold">Monthly Rent</td>
                                    <td className="p-4">
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                            RENT
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black">
                                        KES {Number(invoice.amount).toLocaleString()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 ml-auto max-w-sm space-y-3">
                    <AmountRow label="Invoice Amount" value={Number(invoice.amount)} />
                    <AmountRow label="Paid Amount" value={Number(invoice.paidAmount)} />
                    <AmountRow label="Balance" value={Number(invoice.balance)} strong />
                </div>

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

function AmountRow({
    label,
    value,
    strong,
}: {
    label: string;
    value: number;
    strong?: boolean;
}) {
    return (
        <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-500">{label}</span>
            <span className={strong ? "text-xl font-black" : "font-black"}>
                KES {value.toLocaleString()}
            </span>
        </div>
    );
}