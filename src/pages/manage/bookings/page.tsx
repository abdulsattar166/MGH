import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { useHostels } from "@/hooks/useHostels";
import { useWardens } from "@/hooks/useWardens";
import {
  approveBookingAsync,
  rejectBookingAsync,
  type Booking,
  type BookingStatus,
} from "@/lib/booking";
import BookingDetailModal from "./components/BookingDetailModal";
import {
  BookingStatusBadge,
  BOOKING_STATUS_FILTERS,
  formatDate,
  matchesQuery,
} from "./components/bookingMeta";

export default function Bookings() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const { wardens } = useWardens();
  const { bookings, loading, error, reload } = useBookings();
  const [hostelFilter, setHostelFilter] = useState<number | "all">("all");
  const [wardenFilter, setWardenFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

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
      .filter((b) => (wardenFilter === "all" ? true : String(b.wardenId) === wardenFilter))
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter((b) => matchesQuery(b, query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scoped, hostelFilter, wardenFilter, statusFilter, query]);

  const pendingCount = scoped.filter((b) => b.status === "pending" || b.status === "under_review").length;

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError("");
    setWorking(true);
    try {
      await fn();
      setSelected(null);
      setRejecting(null);
      setRejectReason("");
      await reload();
    } catch (e) {
      setActionError((e as Error).message || "Could not update this booking.");
    } finally {
      setWorking(false);
    }
  };

  const handleApprove = (id: string) => runAction(() => approveBookingAsync(id));
  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      setActionError("Please provide a reason for the rejection.");
      return;
    }
    runAction(() => rejectBookingAsync(id, rejectReason.trim()));
  };

  const wardenNameFor = (b: Booking) => {
    if (b.wardenName) return b.wardenName;
    const w = wardens.find((x) => x.id === String(b.wardenId));
    return w?.name ?? null;
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

      {actionError && (
        <div className="bg-accent-50 border border-accent-200 text-accent-900 rounded-md px-4 py-3 text-sm">
          <i className="ri-error-warning-line mr-1.5"></i>
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
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

        {!isWarden && (
          <select
            value={wardenFilter}
            onChange={(e) => setWardenFilter(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">All Wardens</option>
            {wardens.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
          className="px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          {BOOKING_STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
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
                    Hostel / Warden
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Room / Bed
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-500 whitespace-nowrap">
                    Fee
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
                {filtered.map((b) => {
                  const actionable = b.status === "pending" || b.status === "under_review";
                  return (
                    <tr key={b.id} className="border-b border-background-100 last:border-0 hover:bg-background-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground-900 whitespace-nowrap">{b.id}</div>
                        <div className="text-xs text-foreground-400">{formatDate(b.createdAt)}</div>
                        {b.approvedBy && (
                          <div className="text-[11px] text-primary-700 mt-0.5">
                            ✓ by {b.approvedBy} · {b.approvedAt ? formatDate(b.approvedAt) : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground-900 whitespace-nowrap">
                          {b.applicant.fullName}
                        </div>
                        <div className="text-xs text-foreground-500">{b.applicant.cnic}</div>
                        <div className="text-[11px] text-foreground-400">{b.applicant.mobile}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                        <div>{b.hostelName}</div>
                        <div className="text-[11px] text-foreground-400">
                          {wardenNameFor(b) ? `Warden: ${wardenNameFor(b)}` : "No warden"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                        {b.roomLabel} · Bed {b.bedNumber}
                        <div className="text-[11px] text-foreground-400">Floor {b.floor}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-600 whitespace-nowrap">
                        {b.feeAmount ? `PKR ${Number(b.feeAmount).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={b.status} />
                        {b.reason && b.status === "rejected" && (
                          <div className="text-[11px] text-secondary-800 ml-1 mt-1 max-w-[160px] truncate" title={b.reason}>
                            {b.reason}
                          </div>
                        )}
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
                          {actionable && (
                            <>
                              <button
                                onClick={() => void handleApprove(b.id)}
                                disabled={working}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-primary-600 hover:bg-primary-100 cursor-pointer disabled:opacity-50"
                                title="Approve"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setRejecting(b);
                                  setRejectReason("");
                                  setActionError("");
                                }}
                                disabled={working}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-secondary-700 hover:bg-secondary-100 cursor-pointer disabled:opacity-50"
                                title="Reject"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onApprove={() => void handleApprove(selected.id)}
          onReject={() => setSelected(null)}
          wardenName={selected ? wardenNameFor(selected) : null}
        />
      )}

      {/* Reject dialog */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-950/50" onClick={() => !working && setRejecting(null)}></div>
          <div className="relative w-full max-w-md bg-background-50 rounded-2xl border border-background-200 p-6">
            <h3 className="font-heading text-lg font-bold text-foreground-950">Reject this booking?</h3>
            <p className="mt-1 text-sm text-foreground-500">
              Booking <span className="font-semibold text-foreground-900">{rejecting.id}</span> ·{" "}
              {rejecting.applicant.fullName} · Room {rejecting.roomLabel} · Bed {rejecting.bedNumber}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Rejection reason <span className="text-accent-600">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. No beds are currently available for the requested period."
                className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>
            {actionError && (
              <div className="mt-3 text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
                {actionError}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejecting(null)}
                disabled={working}
                className="px-5 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReject(rejecting.id)}
                disabled={working}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-secondary-700 hover:bg-secondary-800 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {working && <i className="ri-loader-4-line animate-spin"></i>}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}