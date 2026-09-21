import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { useWardens } from "@/hooks/useWardens";
import { useHostels } from "@/hooks/useHostels";
import { COMPLAINT_STATUSES, type Complaint } from "@/lib/complaints";
import ComplaintStatusBadge from "./components/ComplaintStatusBadge";
import ComplaintDetailModal from "./components/ComplaintDetailModal";
import DataState from "@/pages/manage/components/DataState";

const priorityTone: Record<string, string> = {
  Low: "text-foreground-500",
  Normal: "text-secondary-600",
  High: "text-accent-700",
  Urgent: "text-accent-700 font-bold",
};

export default function Complaints() {
  const { user } = useAuth();
  const { wardens } = useWardens();
  const { hostels } = useHostels();
  const isWarden = user?.role === "warden";

  const [hostelId, setHostelId] = useState("");
  const [status, setStatus] = useState("");
  const [wardenId, setWardenId] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);

  const filters = useMemo(
    () => ({
      hostelId: isWarden ? null : hostelId ? Number(hostelId) : null,
      wardenId: wardenId || null,
      status: status || null,
    }),
    [isWarden, hostelId, wardenId, status]
  );

  const { complaints, loading, error, reload, update } = useComplaints(filters);

  const hostelName = (id: number | null) => hostels.find((h) => h.id === id)?.name ?? null;
  const wardenName = (id: string | null) => wardens.find((w) => w.id === id)?.name ?? null;

  const canManage = user?.role !== "student";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">Complaints</h2>
          <p className="text-sm text-foreground-600 mt-1">
            {isWarden
              ? "Complaints raised by students of your hostel."
              : "Track and resolve complaints across all hostels."}
          </p>
        </div>
        <Link
          to="/complaint"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          <i className="ri-add-line"></i> Submit a Complaint
        </Link>
      </div>

      <div className="bg-background-50 border border-background-200 rounded-lg p-4 flex flex-wrap items-end gap-3">
        {!isWarden && (
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">Hostel</label>
            <select
              value={hostelId}
              onChange={(e) => setHostelId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="">All hostels</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="min-w-[170px]">
          <label className="block text-xs font-medium text-foreground-500 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="">All statuses</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {!isWarden && (
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">Warden</label>
            <select
              value={wardenId}
              onChange={(e) => setWardenId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="">All wardens</option>
              {wardens.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DataState loading={loading} error={error} onRetry={reload}>
        {complaints.length === 0 ? (
          <div className="bg-background-50 border border-background-200 rounded-lg py-16 px-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-tools-line text-2xl text-foreground-400"></i>
            </div>
            <p className="mt-4 text-sm text-foreground-600">
              {isWarden
                ? "No complaints found for your hostel."
                : "No complaints match the current filters."}
            </p>
          </div>
        ) : (
          <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-background-100 text-[11px] uppercase tracking-wider text-foreground-500 font-semibold">
              <div className="col-span-2">ID</div>
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Hostel / Room</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Priority</div>
            </div>
            <ul className="divide-y divide-background-100">
              {complaints.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className="w-full text-left grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 hover:bg-background-100/60 cursor-pointer transition"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground-900">{c.code ?? `#${c.id}`}</span>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <div className="text-sm text-foreground-900 truncate">{c.student_name ?? "—"}</div>
                      <div className="text-xs text-foreground-500 truncate">{c.student_code ?? ""}</div>
                    </div>
                    <div className="col-span-2 text-sm text-foreground-700 truncate">
                      {hostelName(c.hostel_id) ?? "—"}
                      {c.room ? ` · ${c.room}` : ""}
                    </div>
                    <div className="col-span-2 text-sm text-foreground-700 truncate">{c.category}</div>
                    <div className="col-span-2">
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                    <div className={`col-span-1 text-sm md:text-right ${priorityTone[c.priority] ?? ""}`}>
                      {c.priority}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DataState>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          hostelName={hostelName(selected.hostel_id)}
          wardenName={wardenName(selected.warden_id)}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onSave={async (patch) => {
            const res = await update(selected.id, patch);
            if (!res.error) {
              setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
            }
            return res;
          }}
        />
      )}
    </div>
  );
}