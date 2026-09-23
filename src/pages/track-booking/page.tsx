import { useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import {
  fetchBookingByReference,
  type BookingStatusView,
} from "@/lib/bookingsDb";
import { BookingStatusBadge, formatDate, statusMeta } from "@/pages/manage/bookings/components/bookingMeta";

const STEP_LABELS: Record<string, string> = {
  pending: "Booking Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  checked_in: "Checked In",
  completed: "Completed",
};

export default function TrackBooking() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<BookingStatusView | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBooking(null);
    setNotFound(false);
    if (!code.trim()) {
      setError("Please enter your Booking ID.");
      return;
    }
    setLoading(true);
    try {
      const result = await fetchBookingByReference(code.trim().toUpperCase());
      if (result) setBooking(result);
      else setNotFound(true);
    } catch (err) {
      setError((err as Error).message || "Could not look up your booking.");
    } finally {
      setLoading(false);
    }
  };

  const timeline = booking?.tracking?.length
    ? booking.tracking
    : booking
      ? [{ status: booking.status, at: booking.created_at, by: null }]
      : [];

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      <main className="pt-28 pb-20 px-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500 flex items-center justify-center">
              <i className="ri-search-eye-line text-background-50 text-3xl"></i>
            </div>
            <h1 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              Track My Booking
            </h1>
            <p className="mt-2 text-sm text-foreground-600 max-w-md mx-auto">
              Enter the Booking ID you received after submitting your reservation to see its
              approval status.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-background-50 border border-background-200 rounded-2xl p-5 md:p-6"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <i className="ri-ticket-2-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MGH-2026-000001"
                  className="w-full pl-9 pr-4 py-3 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {loading && <i className="ri-loader-4-line animate-spin"></i>}
                Track
              </button>
            </div>

            {error && (
              <div className="mt-3 text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </form>

          {notFound && !loading && (
            <div className="mt-8 text-center py-12 bg-background-50 border border-background-200 rounded-2xl">
              <i className="ri-inbox-line text-4xl block mb-3 text-foreground-400"></i>
              <p className="text-sm text-foreground-600">No booking found with that ID.</p>
              <p className="mt-1 text-xs text-foreground-500">
                Double-check the ID (e.g. MGH-2026-000001) and try again.
              </p>
            </div>
          )}

          {booking && (
            <div className="mt-8 bg-background-50 border border-background-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-background-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-heading text-lg font-bold text-foreground-950">
                    {booking.reference}
                  </span>
                  <BookingStatusBadge status={booking.status} />
                  <span className="ml-auto text-xs text-foreground-500 whitespace-nowrap">
                    Submitted {formatDate(booking.created_at)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-background-100 rounded-md p-4">
                    <div className="text-[11px] uppercase tracking-wide text-foreground-400">
                      Hostel
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground-900">
                      {booking.hostel_name}
                    </div>
                  </div>
                  <div className="bg-background-100 rounded-md p-4">
                    <div className="text-[11px] uppercase tracking-wide text-foreground-400">
                      Room
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground-900">
                      {booking.room_number} · Floor {booking.floor}
                    </div>
                  </div>
                  <div className="bg-background-100 rounded-md p-4">
                    <div className="text-[11px] uppercase tracking-wide text-foreground-400">
                      Bed
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground-900">
                      Bed {booking.bed_number}
                    </div>
                  </div>
                  <div className="bg-background-100 rounded-md p-4">
                    <div className="text-[11px] uppercase tracking-wide text-foreground-400">
                      Status
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground-900 capitalize">
                      {statusMeta[booking.status]?.label ?? booking.status}
                    </div>
                  </div>
                </div>

                {booking.fee_amount ? (
                  <div className="mt-4 bg-background-100 rounded-md p-4 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-foreground-400">
                      Monthly Fee
                    </span>
                    <span className="text-sm font-bold text-primary-700">
                      PKR {Number(booking.fee_amount).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {(booking.approved_by || booking.rejected_by) && (
                  <div className="mt-4">
                    {booking.approved_by && (
                      <div className="bg-primary-100 text-primary-800 rounded-md px-4 py-3 text-sm">
                        <i className="ri-checkbox-circle-line mr-1.5"></i>
                        Approved by {booking.approved_by}
                        {booking.approved_at ? ` on ${formatDate(booking.approved_at)}` : ""}
                      </div>
                    )}
                    {booking.rejected_by && (
                      <div className="bg-secondary-100 text-secondary-900 rounded-md px-4 py-3 text-sm">
                        <i className="ri-close-circle-line mr-1.5"></i>
                        Rejected by {booking.rejected_by}
                        {booking.rejected_at ? ` on ${formatDate(booking.rejected_at)}` : ""}
                        {booking.reason ? (
                          <span className="block mt-1 text-xs">Reason: {booking.reason}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-foreground-500 mb-4">
                    Progress
                  </h4>
                  <div className="space-y-0">
                    {timeline.map((s, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3.5 h-3.5 rounded-full mt-0.5 ${
                              i === timeline.length - 1
                                ? "bg-primary-500"
                                : "bg-background-300"
                            }`}
                          ></div>
                          {i < timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-background-200 my-0.5"></div>
                          )}
                        </div>
                        <div className="pb-5">
                          <div className="text-sm font-semibold text-foreground-900">
                            {STEP_LABELS[s.status] ?? s.status}
                          </div>
                          <div className="text-xs text-foreground-500">
                            {new Date(s.at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {s.by ? ` · ${s.by}` : ""}
                          </div>
                          {s.note && (
                            <div className="text-xs text-secondary-800 mt-0.5">{s.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs text-foreground-500">
                  {booking.status === "pending" &&
                    "Your request is awaiting review by the hostel team. You'll hear back shortly."}
                  {booking.status === "under_review" &&
                    "Your request is being reviewed by the hostel team."}
                  {booking.status === "approved" &&
                    "Great news — your booking has been approved and your bed is reserved for you. Please visit the hostel to complete your fee and check in."}
                  {booking.status === "rejected" &&
                    "Unfortunately this request was not approved. Please contact the hostel for details."}
                  {booking.status === "checked_in" &&
                    "You have been checked in — welcome to your hostel!"}
                  {booking.status === "completed" &&
                    "Your stay has been completed. Thank you for choosing Mubarak Hostels."}
                </p>
              </div>
            </div>
          )}

          {!booking && !notFound && !loading && (
            <p className="mt-6 text-center text-sm text-foreground-500">
              Haven't booked yet?{" "}
              <Link
                to="/booking"
                className="text-primary-600 font-semibold cursor-pointer hover:underline"
              >
                Book a room
              </Link>
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}