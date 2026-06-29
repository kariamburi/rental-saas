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
import { getActiveCompany } from "@/lib/get-active-company";
import { requireCompanyRouteAccess } from "@/lib/company-permissions";

export default async function UnitBookingsPage() {
    const { companyId, isSuperAdmin } =
        await requireCompanyRouteAccess("/dashboard/company/bookings");


    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) redirect("/dashboard");

    const [units, bookings] = await Promise.all([
        prisma.unit.findMany({
            where: {
                companyId: companyId,
                status: "VACANT",
            },
            include: { property: true },
            orderBy: { createdAt: "desc" },
        }),

        prisma.unitBooking.findMany({
            where: { companyId: companyId },
            include: {
                property: true,
                unit: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

    const totalPaid = bookings.reduce(
        (sum, booking) => sum + Number(booking.amountPaid || 0),
        0
    );

    return (
        <main className="p-6">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Unit Booking / Reservations
                        </p>

                        <h1 className="mt-3 text-3xl font-black">{company.name}</h1>

                        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-300">
                            Reserve vacant units for prospective tenants before lease creation.
                        </p>
                    </div>

                    <AddBookingModal units={units} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Bookings" value={bookings.length} />
                <SummaryCard title="Pending" value={pending} warning />
                <SummaryCard title="Confirmed" value={confirmed} success />
                <SummaryCard
                    title="Booking Deposits"
                    value={`KES ${totalPaid.toLocaleString()}`}
                    success
                />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-1">
                <SummaryCard title="Cancelled" value={cancelled} danger />
            </div>

            <section className="mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-950">
                                Booking List
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Reservations for vacant rental units.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Customer
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Phone
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Property
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Unit
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Expected Move-in
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Amount Paid
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Status
                                    </th>
                                    <th className="border-r border-slate-200 px-2 py-2 text-left font-bold">
                                        Created
                                    </th>
                                    <th className="px-2 py-2 text-left font-bold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-5 py-12 text-center"
                                        >
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
                                        <tr
                                            key={booking.id}
                                            className="border-b hover:bg-slate-50"
                                        >
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                        <User size={15} />
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {booking.customerName}
                                                        </p>

                                                        <p className="text-[11px] text-slate-500">
                                                            {booking.email || "No email"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone size={13} />
                                                    {booking.phone}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Home size={13} />
                                                    {booking.property.name}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <DoorOpen size={13} />
                                                    Unit {booking.unit.unitNumber}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays size={13} />
                                                    {booking.expectedMoveIn
                                                        ? new Date(
                                                            booking.expectedMoveIn
                                                        ).toLocaleDateString("en-KE")
                                                        : "-"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 font-black text-emerald-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Wallet size={13} />
                                                    KES{" "}
                                                    {Number(
                                                        booking.amountPaid || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <UpdateBookingStatus
                                                    bookingId={booking.id}
                                                    currentStatus={booking.status}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays size={13} />
                                                    {new Date(
                                                        booking.createdAt
                                                    ).toLocaleDateString("en-KE")}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <NextLink
                                                        href={`/dashboard/company/bookings/${booking.id}/receipt`}
                                                        className="rounded bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                                    >
                                                        Receipt
                                                    </NextLink>

                                                    {booking.status === "CONFIRMED" ? (
                                                        <ConvertBookingButton
                                                            bookingId={booking.id}
                                                        />
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-400">
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
            </section>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    success,
    warning,
    danger,
}: {
    title: string;
    value: number | string;
    success?: boolean;
    warning?: boolean;
    danger?: boolean;
}) {
    const valueClass = danger
        ? "text-red-700"
        : warning
            ? "text-amber-700"
            : success
                ? "text-emerald-700"
                : "text-slate-950";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h2 className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</h2>
        </div>
    );
}