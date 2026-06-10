import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { redirect, notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function BookingReceiptPage({
    params,
}: {
    params: Promise<{ bookingId: string }>;
}) {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        redirect("/dashboard");
    }

    const { bookingId } = await params;

    const booking = await prisma.unitBooking.findFirst({
        where: {
            id: bookingId,
            companyId: user.companyId,
        },
        include: {
            company: true,
            property: true,
            unit: true,
        },
    });

    if (!booking) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
            <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl print:max-w-none print:rounded-none print:p-6 print:shadow-none">
                <div className="mb-4 flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
                            Rental Management System
                        </p>
                        <h1 className="mt-1 text-2xl font-black text-slate-950">
                            Booking Receipt
                        </h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Receipt No: BKG-{booking.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <div className="text-right">
                        <PrintButton />
                        <p className="mt-2 text-sm font-black text-slate-950 print:mt-0">
                            {booking.company.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                            {booking.company.phone || ""}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200">
                    <Row label="Customer" value={booking.customerName} />
                    <Row label="Phone" value={booking.phone} />
                    <Row label="Email" value={booking.email || "-"} />
                    <Row label="ID Number" value={booking.idNumber || "-"} />
                    <Row label="Property" value={booking.property.name} />
                    <Row label="Unit" value={`Unit ${booking.unit.unitNumber}`} />
                    <Row label="Status" value={booking.status} />
                    <Row
                        label="Booking Date"
                        value={new Date(booking.bookingDate).toLocaleDateString()}
                    />
                    <Row
                        label="Expected Move-in"
                        value={
                            booking.expectedMoveIn
                                ? new Date(booking.expectedMoveIn).toLocaleDateString()
                                : "-"
                        }
                    />
                </div>

                <div className="mt-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-700">
                        Amount Paid
                    </p>
                    <h2 className="mt-1 text-3xl font-black text-emerald-800">
                        KES {Number(booking.amountPaid).toLocaleString()}
                    </h2>
                </div>

                {booking.notes && (
                    <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Notes
                        </p>
                        <p className="mt-1 whitespace-pre-line text-xs font-semibold text-slate-700">
                            {booking.notes}
                        </p>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-6 text-xs">
                    <div>
                        <p className="font-black text-slate-700">Received By</p>
                        <div className="mt-8 border-t border-slate-400 pt-1 text-slate-500">
                            Signature
                        </div>
                    </div>

                    <div>
                        <p className="font-black text-slate-700">Customer Signature</p>
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