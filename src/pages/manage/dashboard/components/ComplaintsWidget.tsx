import { useComplaints } from "@/hooks/useComplaints";

const groups = [
  { label: "Open", statuses: ["Pending"], color: "bg-accent-500" },
  { label: "In Progress", statuses: ["Under Review", "Assigned", "In Progress"], color: "bg-secondary-500" },
  { label: "Resolved", statuses: ["Resolved"], color: "bg-primary-500" },
];

export default function ComplaintsWidget() {
  const { complaints, loading } = useComplaints();

  const counts = groups.map((g) => ({
    ...g,
    count: complaints.filter((c) => g.statuses.includes(c.status)).length,
  }));
  const total = complaints.length;

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">
        Complaints &amp; Maintenance
      </h3>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-xl"></i>
          <span className="text-sm">Loading…</span>
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-foreground-500 py-8 text-center">
          No complaints found for your hostel.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-5">
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-foreground-950">{total}</div>
              <div className="text-xs text-foreground-500 mt-0.5">Total</div>
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-background-200 overflow-hidden flex">
              {counts.map((c) => (
                <div
                  key={c.label}
                  className={`h-full ${c.color}`}
                  style={{ width: `${(c.count / total) * 100}%` }}
                ></div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {counts.map((c) => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.color}`}></span>
                  {c.label}
                </span>
                <span className="text-sm font-semibold text-foreground-900">{c.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}