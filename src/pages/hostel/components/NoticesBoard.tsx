import { useMemo } from "react";
import { useNotices } from "@/hooks/useNotices";
import { isNoticeExpired } from "@/lib/notices";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function NoticesBoard({ hostelId }: { hostelId: number }) {
  const { notices, loading, error } = useNotices(hostelId);

  const activeNotices = useMemo(
    () => notices.filter((n) => !isNoticeExpired(n)),
    [notices]
  );

  return (
    <div className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-background-200">
        <div className="w-10 h-10 rounded-md bg-primary-500 flex items-center justify-center">
          <i className="ri-megaphone-line text-background-50 text-lg"></i>
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground-950">Notices Board</h3>
          <p className="text-xs text-foreground-500">Latest announcements from your warden</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-lg"></i>
          <span className="text-sm">Loading notices…</span>
        </div>
      ) : error ? (
        <div className="py-10 px-6 text-center">
          <p className="text-sm text-foreground-500">{error}</p>
        </div>
      ) : activeNotices.length === 0 ? (
        <div className="py-12 px-6 text-center">
          <div className="w-11 h-11 mx-auto rounded-full bg-secondary-100 flex items-center justify-center">
            <i className="ri-inbox-line text-secondary-900 text-xl"></i>
          </div>
          <p className="mt-3 text-sm text-foreground-500">
            No notices posted yet. Check back soon.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-background-100">
          {activeNotices.map((n) => (
            <li
              key={n.id}
              className={`px-6 py-5 ${n.is_pinned ? "bg-accent-50" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {n.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500 text-background-50 font-bold">
                    <i className="ri-pushpin-2-fill"></i> Pinned
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold">
                  {formatDate(n.created_at)}
                </span>
                {n.author_name && (
                  <span className="text-xs text-foreground-400 flex items-center gap-1">
                    <i className="ri-user-line"></i>
                    {n.author_name}
                  </span>
                )}
              </div>
              <h4 className="mt-2 font-semibold text-foreground-950">{n.title}</h4>
              <p className="mt-1 text-sm text-foreground-600 leading-relaxed whitespace-pre-line">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}