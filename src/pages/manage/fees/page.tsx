import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import {
  useFees,
  currentMonth,
  shiftMonth,
  formatMonth,
} from "@/hooks/useFees";
import { useHostels } from "@/hooks/useHostels";
import type { Student } from "@/mocks/management/students";
import DataState from "@/pages/manage/components/DataState";
import RecordPaymentModal from "./components/RecordPaymentModal";

type Row = {
  student: Student;
  paid: boolean;
  amount: number;
  method: string | null;
  paidAt: string | null;
};

export default function Fees() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useStudents();

  const [month, setMonth] = useState(currentMonth());
  const {
    records,
    loading: feesLoading,
    error: feesError,
    reload: reloadFees,
    recordPayment,
    markUnpaid,
  } = useFees(month);

  const isWarden = user?.role === "warden";
  const scopedHostelId = isWarden ? (user?.hostelId ?? null) : null;

  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [paying, setPaying] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const loading = studentsLoading || feesLoading;
  const loadError = studentsError || feesError;
  const reload = () => {
    reloadStudents();
    reloadFees();
  };

  const joined = useMemo<Row[]>(() => {
    return students
      .filter((s) => s.status !== "Left")
      .filter((s) => scopedHostelId === null || s.hostelId === scopedHostelId)
      .map((s) => {
        const rec = records.find((r) => r.studentId === s.id);
        return {
          student: s,
          paid: rec?.paid ?? false,
          amount: rec?.amount ?? s.monthlyFee,
          method: rec?.method ?? null,
          paidAt: rec?.paidAt ?? null,
        };
      });
  }, [students, records, scopedHostelId]);

  const visible = useMemo(() => {
    return joined.filter((row) => {
      if (hostelFilter !== "all" && String(row.student.hostelId) !== hostelFilter) return false;
      if (statusFilter === "paid" && !row.paid) return false;
      if (statusFilter === "unpaid" && row.paid) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${row.student.name} ${row.student.cnic} ${row.student.room} ${row.student.program}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [joined, hostelFilter, statusFilter, query]);

  const expected = joined.reduce((s, r) => s + r.student.monthlyFee, 0);
  const collected = joined.reduce((s, r) => s + (r.paid ? r.amount : 0), 0);
  const outstanding = expected - collected;
  const rate = expected ? Math.round((collected / expected) * 100) : 0;

  const handleRecord = async (amount: number, method: string) => {
    if (!paying) return;
    setSaving(true);
    const err = await recordPayment(paying.id, amount, method);
    setSaving(false);
    if (err) {
      setActionError(err);
      return;
    }
    setPaying(null);
  };

  const handleUnpaid = async (student: Student) => {
    const err = await markUnpaid(student.id, student.monthlyFee);
    if (err) setActionError(err);
  };

  const statItems = [
    { label: "Expected", display: `PKR ${expected.toLocaleString()}`, icon: "ri-wallet-3-line", tone: "text-foreground-700" },
    { label: "Collected", display: `PKR ${collected.toLocaleString()}`, icon: "ri-check-double-line", tone: "text-primary-600" },
    { label: "Outstanding", display: `PKR ${outstanding.toLocaleString()}`, icon: "ri-time-line", tone: "text-accent-600" },
    { label: "Collection Rate", display: `${rate}%`, icon: "ri-pie-chart-line", tone: "text-secondary-600" },
  ];

  return (
    <DataState loading={loading} error={loadError} onRetry={reload}>
      <div className="space-y-5">
        {/* Header + month selector */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-500">
              {formatMonth(month)} · {visible.length} resident{visible.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="w-10 h-10 rounded-md border border-background-300 bg-background-50 text-foreground-700 hover:bg-background-100 flex items-center justify-center cursor-pointer transition"
              aria-label="Previous month"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <span className="px-4 py-2 rounded-md bg-background-100 text-foreground-900 text-sm font-semibold whitespace-nowrap">
              {formatMonth(month)}
            </span>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="w-10 h-10 rounded-md border border-background-300 bg-background-50 text-foreground-700 hover:bg-background-100 flex items-center justify-center cursor-pointer transition"
              aria-label="Next month"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>
        </div>

        {actionError && (
          <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-md bg-background-100 flex items-center justify-center ${s.tone}`}>
                <i className={`${s.icon} text-lg`}></i>
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground-950 truncate">
                  {s.display}
                </div>
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
              { key: "paid", label: "Paid" },
              { key: "unpaid", label: "Unpaid" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as typeof statusFilter)}
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
                placeholder="Search residents…"
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
              <i className="ri-money-rupee-circle-line text-4xl block mb-3"></i>
              No residents match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background-100 text-left text-xs uppercase tracking-wide text-foreground-500">
                    <th className="px-4 py-3 font-semibold">Resident</th>
                    <th className="px-4 py-3 font-semibold">Hostel</th>
                    <th className="px-4 py-3 font-semibold">Room / Bed</th>
                    <th className="px-4 py-3 font-semibold">Fee</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.student.id} className="border-t border-background-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0">
                            {row.student.name.charAt(0)}
                          </div>
                          <div className="leading-tight">
                            <div className="font-semibold text-foreground-900">{row.student.name}</div>
                            <div className="text-xs text-foreground-500">{row.student.program}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {hostels.find((h) => h.id === row.student.hostelId)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        {row.student.room} · Bed {row.student.bed}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                        PKR {row.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                              row.paid
                                ? "bg-primary-100 text-primary-800"
                                : "bg-accent-100 text-accent-800"
                            }`}
                          >
                            {row.paid ? "Paid" : "Unpaid"}
                          </span>
                          {row.paid && row.method && (
                            <span className="text-[11px] text-foreground-400">
                              {row.method} · {row.paidAt ?? ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!row.paid ? (
                            <button
                              onClick={() => setPaying(row.student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                            >
                              <i className="ri-add-line"></i> Record
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpaid(row.student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background-100 hover:bg-background-200 text-foreground-600 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                              title="Mark as unpaid"
                            >
                              <i className="ri-arrow-go-back-line"></i> Undo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <RecordPaymentModal
          open={Boolean(paying)}
          student={paying}
          saving={saving}
          onClose={() => setPaying(null)}
          onSave={handleRecord}
        />
      </div>
    </DataState>
  );
}