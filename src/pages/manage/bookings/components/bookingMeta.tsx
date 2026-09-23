import { type Booking, type BookingStatus } from "@/lib/booking";

// eslint-disable-next-line react-refresh/only-export-components
export const statusMeta: Record<
  BookingStatus,
  { label: string; cls: string; icon: string }
> = {
  pending: { label: "Pending", cls: "bg-accent-100 text-accent-900", icon: "ri-time-line" },
  under_review: { label: "Under Review", cls: "bg-secondary-100 text-secondary-900", icon: "ri-search-eye-line" },
  approved: { label: "Approved", cls: "bg-primary-100 text-primary-700", icon: "ri-checkbox-circle-line" },
  rejected: { label: "Rejected", cls: "bg-secondary-100 text-secondary-900", icon: "ri-close-circle-line" },
  cancelled: { label: "Cancelled", cls: "bg-background-200 text-foreground-500", icon: "ri-forbid-line" },
  checked_in: { label: "Checked In", cls: "bg-primary-100 text-primary-700", icon: "ri-login-box-line" },
  completed: { label: "Completed", cls: "bg-background-200 text-foreground-600", icon: "ri-check-double-line" },
};

// eslint-disable-next-line react-refresh/only-export-components
export const BOOKING_STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
];

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${meta.cls}`}
    >
      <i className={meta.icon}></i>
      {meta.label}
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function matchesQuery(b: Booking, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    b.id.toLowerCase().includes(q) ||
    b.applicant.fullName.toLowerCase().includes(q) ||
    b.applicant.cnic.toLowerCase().includes(q) ||
    b.roomLabel.toLowerCase().includes(q) ||
    String(b.bedNumber).includes(q) ||
    b.hostelName.toLowerCase().includes(q)
  );
}