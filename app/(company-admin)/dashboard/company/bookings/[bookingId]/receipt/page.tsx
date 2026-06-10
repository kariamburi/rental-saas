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
        <main className="min-h-screen bg-slate-100 p-6 print:bg-white">
            <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm print:shadow-none">
                <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                            Booking Receipt
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Unit Reservation Slip
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            Receipt No: {booking.id}
                        </p>
                    </div>

                    <PrintButton />
                </div>

                <section className="mt-8 grid gap-5 md:grid-cols-2">
                    <Info title="Company" value={booking.company.name} />
                    <Info title="Status" value={booking.status} />
                    <Info title="Customer Name" value={booking.customerName} />
                    <Info title="Phone" value={booking.phone} />
                    <Info title="Email" value={booking.email || "-"} />
                    <Info title="ID Number" value={booking.idNumber || "-"} />
                    <Info title="Property" value={booking.property.name} />
                    <Info title="Unit" value={`Unit ${booking.unit.unitNumber}`} />
                    <Info
                        title="Booking Date"
                        value={new Date(booking.bookingDate).toLocaleDateString()}
                    />
                    <Info
                        title="Expected Move-in"
                        value={
                            booking.expectedMoveIn
                                ? new Date(booking.expectedMoveIn).toLocaleDateString()
                                : "-"
                        }
                    />
                </section>

                <section className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6">
                    <p className="text-sm font-bold text-emerald-700">
                        Amount Paid
                    </p>
                    <h2 className="mt-2 text-4xl font-black text-emerald-800">
                        KES {Number(booking.amountPaid).toLocaleString()}
                    </h2>
                </section>

                {booking.notes && (
                    <section className="mt-8">
                        <h3 className="text-sm font-black uppercase text-slate-400">
                            Notes
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm font-semibold text-slate-600">
                            {booking.notes}
                        </p>
                    </section>
                )}

                <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs font-semibold text-slate-400">
                    Powered by Craft Inventors
                </div>
            </div>
        </main>
    );
}

function Info({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase text-slate-400">{title}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
        </div>
    );
}