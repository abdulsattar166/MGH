import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuditLogsAll, type AuditLog } from "@/lib/auditLogs";
import DataState from "@/pages/manage/components/DataState";

const RESOURCE_OPTIONS = [
  "students",
  "rooms",
  "hostels",
  "complaints",
  "bookings",
  "fees",
  "attendance",
  "visitors",
  "notices",
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await fetchAuditLogsAll(500));
    } catch (e) {
      setError((e as Error).message || "Could not load audit logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (resource && log.resource !== resource) return false;
      if (from && new Date(log.created_at) < new Date(`${from}T00:00:00`)) return false;
      if (to && new Date(log.created_at) > new Date(`${to}T23:59:59`)) return false;
      if (q) {
        const haystack = `${log.user_name ?? ""} ${log.action} ${log.resource ?? ""} ${log.details ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, resource, from, to]);

  const resetFilters = () => {
    setSearch("");
    setResource("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground-950">Audit Logs</h2>
        <p className="text-sm text-foreground-600 mt-1">
          Track important actions across the system — logins, student and room changes, complaint
          updates and more.
        </p>
      </div>

      <div className="bg-background-50 border border-background-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Search user, action or details…"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-foreground-500 mb-1.5">Resource</label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="">All resources</option>
              {RESOURCE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
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

      <DataState loading={loading} error={error} onRetry={load}>
        <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <i className="ri-file-list-3-line text-4xl text-foreground-300"></i>
              <p className="mt-3 text-sm text-foreground-500">
                No audit log entries match your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background-100 text-[11px] uppercase tracking-wider text-foreground-500">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3 whitespace-nowrap">Time</th>
                    <th className="text-left font-semibold px-5 py-3">User</th>
                    <th className="text-left font-semibold px-5 py-3">Role</th>
                    <th className="text-left font-semibold px-5 py-3">Action</th>
                    <th className="text-left font-semibold px-5 py-3">Resource</th>
                    <th className="text-left font-semibold px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-background-100/50">
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-foreground-900 whitespace-nowrap font-medium">
                        {log.user_name ?? "System"}
                      </td>
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                        <span className="capitalize">{log.user_role ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-foreground-900 whitespace-nowrap">{log.action}</td>
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                        {log.resource ?? "—"}
                        {log.resource_id ? ` #${log.resource_id}` : ""}
                      </td>
                      <td className="px-5 py-3 text-foreground-600 max-w-xs truncate">
                        {log.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}