const tones: Record<string, string> = {
  Pending: "bg-accent-100 text-accent-700",
  "Under Review": "bg-secondary-100 text-secondary-700",
  Assigned: "bg-secondary-100 text-secondary-700",
  "In Progress": "bg-primary-100 text-primary-700",
  Resolved: "bg-primary-100 text-primary-800",
  Rejected: "bg-background-100 text-foreground-600",
};

export default function ComplaintStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        tones[status] ?? "bg-background-100 text-foreground-600"
      }`}
    >
      {status}
    </span>
  );
}