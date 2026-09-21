import type { Complaint } from "@/lib/complaints";
import type { ComplaintResponse } from "@/lib/complaintResponses";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-accent-100 text-accent-800",
  "Under Review": "bg-secondary-100 text-secondary-900",
  Assigned: "bg-secondary-100 text-secondary-900",
  "In Progress": "bg-primary-100 text-primary-800",
  Resolved: "bg-primary-100 text-primary-800",
  Rejected: "bg-background-200 text-foreground-600",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  superintendent: "Superintendent",
  warden: "Warden",
  student: "Student",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  complaint: Complaint;
  responses: ComplaintResponse[];
};

export default function ComplaintCard({ complaint, responses }: Props) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading font-bold text-foreground-950">
            {complaint.code ?? `#${complaint.id}`}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              STATUS_STYLES[complaint.status] ?? "bg-background-200 text-foreground-600"
            }`}
          >
            {complaint.status}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-900 whitespace-nowrap">
            {complaint.category}
          </span>
          {complaint.priority && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-background-100 text-foreground-600 whitespace-nowrap">
              {complaint.priority}
            </span>
          )}
          <span className="ml-auto text-xs text-foreground-500 whitespace-nowrap">
            {formatDate(complaint.created_at)}
          </span>
        </div>

        <p className="mt-3 text-sm text-foreground-700 whitespace-pre-line">
          {complaint.description}
        </p>

        {complaint.remarks && (
          <div className="mt-3 text-sm text-foreground-600 bg-background-100 rounded-md px-3 py-2">
            <span className="font-semibold text-foreground-800">Remarks: </span>
            {complaint.remarks}
          </div>
        )}
      </div>

      <div className="border-t border-background-100 px-5 py-4 bg-background-100/50">
        <div className="text-xs font-semibold uppercase tracking-wide text-foreground-500 mb-3">
          Warden replies ({responses.length})
        </div>

        {responses.length === 0 ? (
          <p className="text-sm text-foreground-500">
            No replies yet. The warden will respond soon.
          </p>
        ) : (
          <div className="space-y-3">
            {responses.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-xs font-bold shrink-0">
                  {(r.author_name ?? "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground-900">
                      {r.author_name ?? "Unknown"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-800 whitespace-nowrap">
                      {ROLE_LABEL[r.author_role ?? ""] ?? r.author_role ?? "Staff"}
                    </span>
                    <span className="ml-auto text-[11px] text-foreground-500 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-700">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}