import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useHostels } from "@/hooks/useHostels";
import { apiBaseUrl, apiMode, getToken } from "@/lib/api";
import { COMPLAINT_STATUSES } from "@/lib/complaints";
import StatCard from "@/pages/manage/dashboard/components/StatCard";
import DataState from "@/pages/manage/components/DataState";

export default function Reports() {
  const { user } = useAuth();
  const isWarden = user?.role === "warden";
  const { hostels } = useHostels();

  const [hostelId, setHostelId] = useState("");
  const [wardenId, setWardenId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const filters = useMemo(
    () => ({
      hostelId: isWarden ? null : hostelId ? Number(hostelId) : null,
      wardenId: wardenId || null,
      status: status || null,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
      to: to ? new Date(`${to}T23:59:59`).toISOString() : null,
    }),
    [isWarden, hostelId, wardenId, status, from, to]
  );

  const { data, loading, error, reload } = useReports(filters);
  const s = data?.summary;

  const resetFilters = () => {
    setHostelId("");
    setWardenId("");
    setStatus("");
    setFrom("");
    setTo("");
  };

  const downloadPdf = async () => {
    setDownloadError("");
    if (!apiMode) {
      window.print();
      return;
    }
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (hostelId) params.set("hostelId", String(hostelId));
      if (wardenId) params.set("wardenId", wardenId);
      if (status) params.set("status", status);
      if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) params.set("to", new Date(`${to}T23:59:59`).toISOString());
      const url = `${apiBaseUrl}/reports/pdf?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Could not generate the PDF.";
        try {
          msg = (JSON.parse(text) as { error?: string }).error ?? msg;
        } catch { /* keep default */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `MGH-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setDownloadError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">Reports</h2>
          <p className="text-sm text-foreground-600 mt-1">
            Live figures from the database
            {data?.generatedAt
              ? ` · updated ${new Date(data.generatedAt).toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <button
          onClick={() => void downloadPdf()}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
        >
          {downloading ? (
            <i className="ri-loader-4-line animate-spin"></i>
          ) : (
            <i className="ri-file-pdf-2-line"></i>
          )}
          Download A4 PDF Report
        </button>
      </div>

      {downloadError && (
        <div className="bg-accent-50 border border-accent-200 text-accent-900 rounded-md px-4 py-3 text-sm">
          <i className="ri-error-warning-line mr-1.5"></i>
          {downloadError}
        </div>
      )}

      <div className="bg-background-50 border border-background-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          {!isWarden && (
            <div className="min-w-[170px]">
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
          {!isWarden && (
            <div className="min-w-[170px]">
              <label className="block text-xs font-medium text-foreground-500 mb-1.5">Warden</label>
              <select
                value={wardenId}
                onChange={(e) => setWardenId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="">All wardens</option>
                {(data?.wardens ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">Complaint status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="">All statuses</option>
              {COMPLAINT_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
          >
            Reset
          </button>
        </div>
      </div>

      <DataState loading={loading} error={error} onRetry={reload}>
        {data && s && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={String(s.totalStudents)} icon="ri-group-line" tone="primary" sub={`${s.totalBeds} total beds`} />
              <StatCard label="Occupied Beds" value={String(s.occupiedBeds)} icon="ri-door-open-line" tone="secondary" sub={`${s.vacantBeds} vacant`} />
              <StatCard label="Occupancy" value={`${s.occupancy}%`} icon="ri-pie-chart-line" tone="secondary" sub="across shown hostels" />
              <StatCard label="Total Complaints" value={String(s.totalComplaints)} icon="ri-tools-line" tone="accent" sub={`${s.pendingComplaints} pending · ${s.resolvedComplaints} resolved`} />
            </div>

            {/* Fee & booking summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard label="Fee Collected" value={`PKR ${(s.feeCollected / 1000).toFixed(0)}K`} icon="ri-check-double-line" tone="primary" sub={`${s.paidStudents} students paid`} />
              <StatCard label="Fee Pending" value={`PKR ${(s.feePending / 1000).toFixed(0)}K`} icon="ri-time-line" tone="accent" sub={`${s.pendingFeeStudents} students due`} />
              <StatCard label="Collection Rate" value={`${s.collectionRate}%`} icon="ri-pie-chart-line" tone="secondary" sub={`${s.totalBookings} bookings`} />
              <StatCard label="Suggestions" value={String(s.totalImprovements)} icon="ri-lightbulb-line" tone="accent" sub={`${s.improvementsImplemented} implemented`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Complaints by status */}
              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">Complaints by Status</h3>
                <div className="space-y-3">
                  {COMPLAINT_STATUSES.map((st) => {
                    const count = data.byStatus[st] ?? 0;
                    const pct = s.totalComplaints ? (count / s.totalComplaints) * 100 : 0;
                    return (
                      <div key={st}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground-700">{st}</span>
                          <span className="font-semibold text-foreground-900">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-background-200 overflow-hidden">
                          <div className="h-full bg-primary-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complaints by hostel */}
              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">Complaints by Hostel</h3>
                {data.complaintsByHostel.length === 0 ? (
                  <p className="text-sm text-foreground-500">No hosted data available.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.complaintsByHostel.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground-700 truncate">{c.name}</span>
                        <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">
                          {c.total} <span className="text-xs font-normal text-foreground-500">({c.pending} pending)</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Fee collection + bookings + improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">Fee Collection</h3>
                <div className="space-y-3">
                  {[
                    { label: "Collected (fetched)", value: s.feeCollected, cls: "text-primary-700" },
                    { label: "Pending", value: s.feePending, cls: "text-accent-700" },
                    { label: "Overdue (unfetched)", value: s.feeOverdue, cls: "text-accent-600" },
                    { label: "Total expected", value: s.feeTotal, cls: "text-foreground-900" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-foreground-600">{r.label}</span>
                      <span className={`font-semibold ${r.cls}`}>PKR {r.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-background-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-600">Collection Percentage</span>
                      <span className="font-bold text-primary-700">{s.collectionRate}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-background-200 overflow-hidden">
                      <div className="h-full bg-primary-500" style={{ width: `${s.collectionRate}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">Booking Statistics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total bookings", value: s.totalBookings, cls: "text-foreground-900" },
                    { label: "Pending / review", value: s.pendingBookings, cls: "text-accent-700" },
                    { label: "Approved", value: s.approvedBookings, cls: "text-primary-700" },
                    { label: "Rejected", value: s.rejectedBookings, cls: "text-secondary-700" },
                    { label: "Cancelled", value: s.cancelledBookings, cls: "text-foreground-500" },
                    { label: "Completed", value: s.completedBookings, cls: "text-primary-700" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-foreground-600">{r.label}</span>
                      <span className={`font-semibold ${r.cls}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">Improvements &amp; Suggestions</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total suggestions", value: s.totalImprovements, cls: "text-foreground-900" },
                    { label: "Under review", value: s.improvementsReviewing, cls: "text-accent-700" },
                    { label: "Accepted", value: s.improvementsAccepted, cls: "text-secondary-700" },
                    { label: "Implemented", value: s.improvementsImplemented, cls: "text-primary-700" },
                    { label: "Rejected", value: s.improvementsRejected, cls: "text-foreground-500" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-foreground-600">{r.label}</span>
                      <span className={`font-semibold ${r.cls}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Students + occupancy by hostel */}
            <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-background-200">
                <h3 className="font-heading text-base font-bold text-foreground-950">Students &amp; Occupancy by Hostel</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background-100 text-[11px] uppercase tracking-wider text-foreground-500">
                    <tr>
                      <th className="text-left font-semibold px-5 py-3">Hostel</th>
                      <th className="text-left font-semibold px-5 py-3">Warden</th>
                      <th className="text-right font-semibold px-5 py-3">Students</th>
                      <th className="text-right font-semibold px-5 py-3">Beds</th>
                      <th className="text-right font-semibold px-5 py-3">Vacant</th>
                      <th className="text-left font-semibold px-5 py-3 w-48">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-100">
                    {data.studentsByHostel.map((h) => (
                      <tr key={h.id}>
                        <td className="px-5 py-3 text-foreground-900 whitespace-nowrap">{h.name}</td>
                        <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{h.warden ?? "—"}</td>
                        <td className="px-5 py-3 text-right text-foreground-900 font-semibold">{h.students}</td>
                        <td className="px-5 py-3 text-right text-foreground-600">{h.beds}</td>
                        <td className="px-5 py-3 text-right text-foreground-600">{h.vacant}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-background-200 overflow-hidden">
                              <div className="h-full bg-accent-500" style={{ width: `${h.occupancy}%` }}></div>
                            </div>
                            <span className="text-xs text-foreground-600 w-9 text-right">{h.occupancy}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warden-wise statistics */}
            {data.wardenStats.length > 0 && (
              <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-background-200">
                  <h3 className="font-heading text-base font-bold text-foreground-950">Warden-wise Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background-100 text-[11px] uppercase tracking-wider text-foreground-500">
                      <tr>
                        <th className="text-left font-semibold px-5 py-3">Warden</th>
                        <th className="text-left font-semibold px-5 py-3">Position</th>
                        <th className="text-left font-semibold px-5 py-3">Assigned Hostel</th>
                        <th className="text-right font-semibold px-5 py-3">Students</th>
                        <th className="text-right font-semibold px-5 py-3">Fees Collected</th>
                        <th className="text-right font-semibold px-5 py-3">Complaints</th>
                        <th className="text-right font-semibold px-5 py-3">Resolved</th>
                        <th className="text-right font-semibold px-5 py-3">Suggestions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-background-100">
                      {data.wardenStats.map((w) => (
                        <tr key={w.id}>
                          <td className="px-5 py-3 text-foreground-900 whitespace-nowrap font-medium">{w.name}</td>
                          <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{w.position}</td>
                          <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{w.hostel ?? "Unassigned"}</td>
                          <td className="px-5 py-3 text-right text-foreground-900">{w.students}</td>
                          <td className="px-5 py-3 text-right text-primary-700 font-medium">
                            PKR {(w.feeCollected ?? 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right text-foreground-900">{w.complaints}</td>
                          <td className="px-5 py-3 text-right text-primary-700">{w.resolved}</td>
                          <td className="px-5 py-3 text-right text-foreground-900">{w.improvements ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Students by room */}
            <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-foreground-950">Students by Room</h3>
                <span className="text-xs text-foreground-500">{data.studentsByRoom.length} rooms occupied</span>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-background-100 text-[11px] uppercase tracking-wider text-foreground-500 sticky top-0">
                    <tr>
                      <th className="text-left font-semibold px-5 py-3">Room</th>
                      <th className="text-left font-semibold px-5 py-3">Hostel</th>
                      <th className="text-right font-semibold px-5 py-3">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-100">
                    {data.studentsByRoom.map((r) => (
                      <tr key={`${r.hostelId}-${r.room}`}>
                        <td className="px-5 py-3 text-foreground-900 whitespace-nowrap">{r.room}</td>
                        <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                          {hostels.find((h) => h.id === r.hostelId)?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-foreground-900">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}