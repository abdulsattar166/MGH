import { type Booking, type BookingStatus } from "@/lib/booking";

export const statusMeta: Record<
  BookingStatus,
  { label: string; cls: string; icon: string }
> = {
  pending: { label: "Pending", cls: "bg-accent-100 text-accent-900", icon: "ri-time-line" },
  approved: { label: "Approved", cls: "bg-primary-100 text-primary-700", icon: "ri-checkbox-circle-line" },
  rejected: { label: "Rejected", cls: "bg-secondary-100 text-secondary-900", icon: "ri-close-circle-line" },
  cancelled: { label: "Cancelled", cls: "bg-background-200 text-foreground-500", icon: "ri-forbid-line" },
};

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