import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useVisitors, type NewVisitor, type Visitor } from "@/hooks/useVisitors";
import { useHostels } from "@/hooks/useHostels";
import DataState from "@/pages/manage/components/DataState";
import CheckInModal from "./components/CheckInModal";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

type StatusFilter = "all" | "inside" | "out";

export default function Visitors() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const isWarden = user?.role === "warden";
  const scopedHostelId = isWarden ? (user?.hostelId ?? 0) : 0;

  const {
    visitors,
    loading,
    error,
    reload,
    checkIn,
    checkOut,
  } = useVisitors();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useStudents();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const scopedStudents = isWarden
    ? students.filter((s) => s.hostelId === user?.hostelId)
    : students;

  const loadingAll = loading || studentsLoading;
  const loadError = error || studentsError;
  const retry = () => {
    reload();
    reloadStudents();
  };

  const currentlyInside = visitors.filter((v) => !v.checkOut).length;
  const checkedInToday = visitors.filter((v) => isToday(v.checkIn)).length;

  const visible = useMemo(() => {
    return visitors.filter((v) => {
      if (hostelFilter !== "all" && String(v.hostelId) !== hostelFilter) return false;
      if (statusFilter === "inside" && v.checkOut) return false;
      if (statusFilter === "out" && !v.checkOut) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${v.name} ${v.cnic} ${v.visitingStudent} ${v.purpose}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visitors, hostelFilter, statusFilter, query]);

  const handleSave = async (v: NewVisitor) => {
    setSaving(true);
    const err = await checkIn(v);
    setSaving(false);
    if (err) {
      setActionError(err);
      return;
    }
    setOpen(false);
  };

  const handleCheckOut = async (v: Visitor) => {
    setActionError("");
    const err = await checkOut(v.id);
    if (err) setActionError(err);
    setConfirmingId(null);
  };

  return (
    <DataState loading={loadingAll} error={loadError} onRetry={retry}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-500">
              {currentlyInside} visitor{currentlyInside !== 1 ? "s" : ""} currently inside ·{" "}
              {checkedInToday} checked in today
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-user-add-line text-lg"></i> Check-in Visitor
          </button>
        </div>

        {actionError && (
          <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Currently Inside", value: currentlyInside, icon: "ri-user-received-line", tone: "text-accent-600" },
            { label: "Checked in Today", value: checkedInToday, icon: "ri-login-box-line", tone: "text-primary-600" },
            { label: "Total Visits", value: visitors.length, icon: "ri-group-line", tone: "text-secondary-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-md bg-background-100 flex items-center justify-center ${s.tone}`}>
                <i className={`${s.icon} text-lg`}></i>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-foreground-950">{s.value}</div>
                <div className="text-xs text-foreground-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "inside", label: "Inside" },
              { key: "out", label: "Checked out" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as StatusFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  statusFilter === f.key
                    ? "bg-primary-500 text-background-50"
                    : "bg-background-100 text-foreground-600 hover:bg-background-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visitors…"
                className="w-full pl-9 pr-4 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            {!isWarden && (
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="all">All Hostels</option>
                {hostels.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
          {visible.length === 0 ? (
            <div className="py-16 text-center text-foreground-500">
              <i className="ri-user-received-line text-4xl block mb-3"></i>
              No visitors match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background-100 text-left text-xs uppercase tracking-wide text-foreground-500">
                    <th className="px-4 py-3 font-semibold">Visitor</th>
                    <th className="px-4 py-3 font-semibold">Hostel</th>
                    <th className="px-4 py-3 font-semibold">Visiting</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Check-in</th>
                    <th className="px-4 py-3 font-semibold">Check-out</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((v) => (
                    <tr key={v.id} className="border-t border-background-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0">
                            {v.name.charAt(0)}
                          </div>
                          <div className="leading-tight">
                            <div className="font-semibold text-foreground-900">{v.name}</div>
                            <div className="text-xs text-foreground-500">{v.cnic || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {hostels.find((h) => h.id === v.hostelId)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {v.visitingStudent || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {v.purpose || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {formatDateTime(v.checkIn)}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {v.checkOut ? formatDateTime(v.checkOut) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            v.checkOut
                              ? "bg-background-200 text-foreground-500"
                              : "bg-accent-100 text-accent-800"
                          }`}
                        >
                          {v.checkOut ? "Checked out" : "Inside"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          {!v.checkOut &&
                            (confirmingId === v.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCheckOut(v)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-accent-500 hover:bg-accent-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmingId(null)}
                                  className="px-2.5 py-1.5 rounded-md bg-background-100 hover:bg-background-200 text-foreground-600 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmingId(v.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background-100 hover:bg-background-200 text-foreground-700 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                              >
                                <i className="ri-logout-box-r-line"></i> Check out
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <CheckInModal
          open={open}
          isWarden={isWarden}
          defaultHostelId={scopedHostelId}
          hostels={hostels}
          students={scopedStudents}
          saving={saving}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      </div>
    </DataState>
  );
}