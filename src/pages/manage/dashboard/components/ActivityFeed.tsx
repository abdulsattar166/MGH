import { useEffect, useState } from "react";
import { fetchAuditLogs, type AuditLog } from "@/lib/auditLogs";

const iconMap: Record<string, { icon: string; cls: string }> = {
  student: { icon: "ri-user-add-line", cls: "bg-primary-100 text-primary-700" },
  room: { icon: "ri-door-open-line", cls: "bg-secondary-100 text-secondary-700" },
  complaint: { icon: "ri-tools-line", cls: "bg-secondary-100 text-secondary-700" },
};

function metaFor(action: string) {
  if (action.startsWith("student")) return iconMap.student;
  if (action.startsWith("room")) return iconMap.room;
  if (action.startsWith("complaint")) return iconMap.complaint;
  return iconMap.student;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAuditLogs(8)
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .catch(() => {
        if (mounted) setLogs([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <h3 className="font-heading text-base font-bold text-foreground-950 mb-4">
        Recent Activity
      </h3>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-xl"></i>
          <span className="text-sm">Loading…</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center">
          <i className="ri-inbox-2-line text-3xl text-foreground-300"></i>
          <p className="mt-2 text-sm text-foreground-500">No recent activity yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((a) => {
            const meta = metaFor(a.action);
            const text = a.details ?? `${a.user_name ?? "Someone"} ${a.action.replace(".", " ")}`;
            return (
              <div key={a.id} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${meta.cls}`}>
                  <i className={`${meta.icon} text-base`}></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground-800 leading-snug">
                    <span className="font-medium">{a.user_name ?? "System"}</span> {text}
                  </p>
                  <span className="text-[11px] text-foreground-400">{timeAgo(a.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}