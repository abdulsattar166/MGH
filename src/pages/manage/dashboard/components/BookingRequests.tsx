import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useHostels } from "@/hooks/useHostels";
import { BookingStatusBadge, formatDate } from "@/pages/manage/bookings/components/bookingMeta";

export default function BookingRequests() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const { bookings } = useBookings();

  const scoped = user?.role === "warden" ? bookings.filter((b) => b.hostelId === user.hostelId) : bookings;

  const pending = scoped
    .filter((b) => b.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const hostelName = (id: number) => hostels.find((h) => h.id === id)?.name ?? "";

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-bold text-foreground-950">
            New Booking Requests
          </h3>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-900 text-xs font-semibold">
              {pending.length}
            </span>
          )}
        </div>
        <Link
          to="/manage/bookings"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
        >
          View all
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="py-8 text-center">
          <i className="ri-inbox-2-line text-3xl text-foreground-300"></i>
          <p className="mt-2 text-sm text-foreground-500">No pending booking requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((b) => (
            <Link
              key={b.id}
              to="/manage/bookings"
              className="flex items-center gap-3 rounded-md border border-background-200 px-3 py-2.5 hover:bg-background-100 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-xs font-bold shrink-0">
                {b.applicant.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground-900 truncate">
                  {b.applicant.fullName}
                </p>
                <p className="text-xs text-foreground-500 truncate">
                  {hostelName(b.hostelId)} · Room {b.roomLabel} · Bed {b.bedNumber}
                </p>
              </div>
              <div className="text-right shrink-0">
                <BookingStatusBadge status={b.status} />
                <div className="text-[11px] text-foreground-400 mt-1">{formatDate(b.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}