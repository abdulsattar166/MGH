import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHostels } from "@/hooks/useHostels";
import { api } from "@/lib/api";
import DataState from "@/pages/manage/components/DataState";

export type Improvement = {
  id: number;
  code: string;
  studentName: string | null;
  hostelId: number | null;
  wardenId: number | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
};

const STATUSES = ["Submitted", "Reviewing", "Accepted", "Implemented", "Rejected"];

const statusTone: Record<string, string> = {
  Submitted: "bg-accent-100 text-accent-900",
  Reviewing: "bg-secondary-100 text-secondary-900",
  Accepted: "bg-primary-100 text-primary-700",
  Implemented: "bg-primary-100 text-primary-700",
  Rejected: "bg-background-200 text-foreground-500",
};

export default function Improvements() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const isWarden = user?.role === "warden";

  const [items, setItems] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Improvement | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post<{ ok: boolean; improvements: Improvement[] }>("/improvements/list", {});
      setItems(res.improvements ?? []);
    } catch (e) {
      setError((e as Error).message || "Could not load improvements. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (t: string) => {
    setMessage(t);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setError("");
    try {
      const res = await api.post<{ ok: boolean; improvement: Improvement }>("/improvements/update", {
        id: editing.id,
        status: newStatus,
        remarks,
      });
      setItems((prev) => prev.map((i) => (i.id === editing.id ? res.improvement : i)));
      setEditing(null);
      flash(`Improvement ${editing.code} updated to ${newStatus}.`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const visible = useMemo(() => {
    return items
      .filter((i) => (statusFilter ? i.status === statusFilter : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [items, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-500">
            {visible.length} suggestion{visible.length !== 1 ? "s" : ""} submitted by students
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              statusFilter === "" ? "bg-primary-500 text-background-50" : "bg-background-100 text-foreground-600"
            }`}
          >
            All ({items.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                statusFilter === s ? "bg-primary-500 text-background-50" : "bg-background-100 text-foreground-600"
              }`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="bg-primary-100 text-primary-800 border border-primary-200 rounded-md px-4 py-3 text-sm">
          <i className="ri-check-line mr-1.5"></i>{message}
        </div>
      )}

      <DataState loading={loading} error={error} onRetry={load}>
        {visible.length === 0 ? (
          <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
            <i className="ri-lightbulb-line text-4xl text-foreground-300"></i>
            <p className="mt-3 text-sm text-foreground-500">No improvement suggestions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((i) => (
              <div key={i.id} className="bg-background-50 border border-background-200 rounded-lg p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground-400">{i.code}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[i.status] ?? ""}`}>
                        {i.status}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-100 text-[11px] text-foreground-500">
                        <i className="ri-price-tag-3-line"></i>{i.category}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-heading text-base font-bold text-foreground-950">{i.subject}</h3>
                    <p className="mt-1 text-sm text-foreground-700">{i.description}</p>
                    <div className="mt-2 text-xs text-foreground-500">
                      <i className="ri-user-line mr-1"></i>
                      {i.studentName ?? "Anonymous"}
                      {i.hostelId ? (
                        <>
                          <span className="mx-1">·</span>
                          <i className="ri-building-2-line mr-1"></i>
                          {hostels.find((h) => h.id === i.hostelId)?.name ?? `Hostel #${i.hostelId}`}
                        </>
                      ) : null}
                      <span className="mx-1">·</span>
                      {new Date(i.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    {i.remarks && (
                      <div className="mt-3 bg-background-100 rounded-md px-4 py-3 text-sm text-foreground-700">
                        <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wide">Remarks: </span>
                        {i.remarks}
                      </div>
                    )}
                  </div>
                  {((user?.role === "admin") || isWarden) && (
                    <button
                      onClick={() => {
                        setEditing(i);
                        setNewStatus(i.status);
                        setRemarks(i.remarks ?? "");
                        setError("");
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold hover:bg-background-100 cursor-pointer transition"
                    >
                      <i className="ri-edit-line"></i> Update
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataState>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-950/50" onClick={() => setEditing(null)}></div>
          <div className="relative w-full max-w-lg bg-background-50 rounded-2xl border border-background-200 p-6">
            <h3 className="font-heading text-lg font-bold text-foreground-950">Update suggestion</h3>
            <p className="mt-1 text-sm text-foreground-500">{editing.code} · {editing.subject}</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                placeholder="Notes for the student / record"
              />
            </div>
            {error && <div className="mt-3 text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold hover:bg-background-100 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleUpdate()}
                className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold cursor-pointer transition"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}