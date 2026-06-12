import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessageCircle, User, Wallet, DoorOpen } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import Link from "next/link";

function cleanPhone(phone: string) {
    let value = phone.replace(/\D/g, "");

    if (value.startsWith("0")) {
        value = `254${value.slice(1)}`;
    }

    if (value.startsWith("7") || value.startsWith("1")) {
        value = `254${value}`;
    }

    return value;
}

export default async function InvoiceWhatsappPage({
    searchParams,
}: {
    searchParams: { period?: string };
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const period = searchParams.period;

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: user.companyId,
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
            ...(period
                ? {
                    invoiceNo: {
                        contains: period.replace("-", ""),
                    },
                }
                : {}),
        },
        include: {
            tenant: true,
            unit: {
                include: { property: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main className="p-6">
            <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    WhatsApp Invoices
                </p>
                <h1 className="mt-3 text-3xl font-black">
                    Share Tenant Invoices
                </h1>
                <p className="mt-2 text-slate-300">
                    Open WhatsApp messages for all pending invoices.
                </p>
            </div>

            <div className="mb-5">
                <Link
                    href="/dashboard/company/invoices"
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-950 hover:text-white"
                >
                    Back to Invoices
                </Link>
            </div>

            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
                        <h3 className="text-lg font-black text-slate-950">
                            No pending invoices found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Generate invoices first or check the selected month.
                        </p>
                    </div>
                ) : (
                    invoices.map((invoice) => {
                        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/company/invoices/${invoice.id}/print`;

                        const message = `Hello ${invoice.tenant.name},

Your rent invoice ${invoice.invoiceNo} is ready.

Property: ${invoice.unit.property.name}
Unit: ${invoice.unit.unitNumber}
Amount Due: KES ${Number(invoice.balance).toLocaleString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

View invoice:
${invoiceUrl}

Thank you.`;

                        const whatsappUrl = `https://wa.me/${cleanPhone(
                            invoice.tenant.phone
                        )}?text=${encodeURIComponent(message)}`;

                        return (
                            <div
                                key={invoice.id}
                                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                    <div>
                                        <h2 className="font-black text-slate-950">
                                            {invoice.invoiceNo}
                                        </h2>

                                        <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                                <User size={16} className="text-emerald-600" />
                                                {invoice.tenant.name}
                                            </span>

                                            <span className="inline-flex items-center gap-2">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                {invoice.unit.property.name} - Unit{" "}
                                                {invoice.unit.unitNumber}
                                            </span>

                                            <span className="inline-flex items-center gap-2">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(invoice.balance).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                                    >
                                        <MessageCircle size={18} />
                                        Send WhatsApp
                                    </a>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}