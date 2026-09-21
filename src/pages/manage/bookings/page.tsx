import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useHostels } from "@/hooks/useHostels";
import { updateBookingStatusAsync, type Booking, type BookingStatus } from "@/lib/booking";
import BookingDetailModal from "./components/BookingDetailModal";
import { BookingStatusBadge, formatDate, matchesQuery } from "./components/bookingMeta";

const STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Bookings() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const { bookings, loading, error, reload } = useBookings();
  const [hostelFilter, setHostelFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState("");

  const isWarden = user?.role === "warden";

  const scoped = useMemo(() => {
    let list = bookings;
    if (isWarden && user?.hostelId) {
      list = list.filter((b) => b.hostelId === user.hostelId);
    }
    return list;
  }, [bookings, isWarden, user]);

  const filtered = useMemo(() => {
    return scoped
      .filter((b) => (hostelFilter === "all" ? true : b.hostelId === hostelFilter))
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter((b) => matchesQuery(b, query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scoped, hostelFilter, statusFilter, query]);

  const pendingCount = scoped.filter((b) => b.status === "pending").length;

  const handleStatus = async (id: string, status: BookingStatus) => {
    setActionError("");
    try {
      await updateBookingStatusAsync(id, status);
      setSelected(null);
      await reload();
    } catch (e) {
      setActionError((e as Error).message || "Could not update this booking.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-500">
            {isWarden
              ? "Room & bed booking requests for your hostel"
              : "All room & bed booking requests across every hostel"}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-900 text-sm font-semibold whitespace-nowrap">
            <i className="ri-notification-3-line"></i>
            {pendingCount} new request{pendingCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, CNIC, room, bed or booking ID…"
            className="w-full pl-9 pr-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {!isWarden && (
          <select
            value={hostelFilter}
            onChange={(e) =>
              setHostelFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">All Hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                statusFilter === s.value
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-accent-50 border border-accent-200 text-accent-900 rounded-md px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>
            <i className="ri-error-warning-line mr-1.5"></i>
            {error}
          </span>
          <button
            onClick={() => void reload()}
            className="text-accent-900 font-semibold whitespace-nowrap cursor-pointer hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-accent-50 border border-accent-200 text-accent-900 rounded-md px-4 py-3 text-sm">
          <i className="ri-error-warning-line mr-1.5"></i>
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {loading ? (
        <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
          <i className="ri-loader-4-line animate-spin text-3xl text-foreground-300"></i>
          <p className="mt-3 text-sm text-foreground-500">Loading bookings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
          <i className="ri-inbox-2-line text-4xl text-foreground-300"></i>
          <p className="mt-3 text-sm text-foreground-500">No bookings found.</p>
          <p className="text-xs text-foreground-400">
            Bookings submitted from the public website will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-background-200 bg-background-100">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Booking
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Hostel
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Room / Bed
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Joining
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-background-100 last:border-0 hover:bg-background-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground-900 whitespace-nowrap">{b.id}</div>
                      <div className="text-xs text-foreground-400">{formatDate(b.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground-900 whitespace-nowrap">
                        {b.applicant.fullName}
                      </div>
                      <div className="text-xs text-foreground-500">{b.applicant.cnic}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                      {b.hostelName}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                      {b.roomLabel} · Bed {b.bedNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                      {b.applicant.joiningDate || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(b)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-500 hover:bg-background-100 cursor-pointer"
                          title="View details"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {b.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatus(b.id, "approved")}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-primary-600 hover:bg-primary-100 cursor-pointer"
                              title="Approve"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => handleStatus(b.id, "rejected")}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-secondary-700 hover:bg-secondary-100 cursor-pointer"
                              title="Reject"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleStatus(selected.id, "approved")}
          onReject={() => handleStatus(selected.id, "rejected")}
        />
      )}
    </div>
  );
}