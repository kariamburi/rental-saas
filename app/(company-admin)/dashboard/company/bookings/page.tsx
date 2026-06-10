import NextLink from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    CalendarCheck,
    CalendarDays,
    DoorOpen,
    Home,
    Phone,
    User,
    Wallet,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import AddBookingModal from "./AddBookingModal";
import UpdateBookingStatus from "./UpdateBookingStatus";
import ConvertBookingButton from "./ConvertBookingButton";

export default async function UnitBookingsPage() {
    const user = await getAuthUser();

    if (!user) redirect("/login");

    if (user.role !== Roles.COMPANY_ADMIN) redirect("/dashboard");

    if (!user.companyId) redirect("/dashboard");

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
    });

    if (!company) redirect("/dashboard");

    const [units, bookings] = await Promise.all([
        prisma.unit.findMany({
            where: {
                companyId: user.companyId,
                status: "VACANT",
            },
            include: { property: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.unitBooking.findMany({
            where: { companyId: user.companyId },
            include: {
                property: true,
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const totalPaid = bookings.reduce((sum, b) => sum + Number(b.amountPaid), 0);

    return (
        <main className="p-6">
            <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Unit Booking / Reservations
                        </p>
                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Reserve vacant units for prospective tenants before lease creation.
                        </p>
                    </div>

                    <AddBookingModal units={units} />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-4">
                <SummaryCard title="Total Bookings" value={bookings.length} />
                <SummaryCard title="Pending" value={pending} />
                <SummaryCard title="Confirmed" value={confirmed} />
                <SummaryCard
                    title="Booking Deposits"
                    value={`KES ${totalPaid.toLocaleString()}`}
                />
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-black text-slate-950">
                        Booking List
                    </h2>
                    <p className="text-sm text-slate-500">
                        Reservations for vacant rental units
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Expected Move-in</th>
                                <th className="px-6 py-4">Amount Paid</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                            <CalendarCheck size={26} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-slate-950">
                                            No bookings yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add a reservation for a vacant unit.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="transition hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <User size={16} className="text-emerald-600" />
                                                <div>
                                                    <p className="font-black text-slate-900">
                                                        {booking.customerName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {booking.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Phone size={16} className="text-emerald-600" />
                                                {booking.phone}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Home size={16} className="text-emerald-600" />
                                                {booking.property.name}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <DoorOpen size={16} className="text-emerald-600" />
                                                Unit {booking.unit.unitNumber}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <CalendarDays size={16} className="text-emerald-600" />
                                                {booking.expectedMoveIn
                                                    ? new Date(booking.expectedMoveIn).toLocaleDateString()
                                                    : "-"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                <Wallet size={16} className="text-emerald-600" />
                                                KES {Number(booking.amountPaid).toLocaleString()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <UpdateBookingStatus
                                                bookingId={booking.id}
                                                currentStatus={booking.status}
                                            />
                                        </td>

                                        <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <NextLink
                                                    href={`/dashboard/company/bookings/${booking.id}/receipt`}
                                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                >
                                                    Receipt
                                                </NextLink>

                                                {booking.status === "CONFIRMED" ? (
                                                    <ConvertBookingButton bookingId={booking.id} />
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: number | string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
        </div>
    );
}