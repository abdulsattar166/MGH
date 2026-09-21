import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHostels } from "@/hooks/useHostels";
import { useNotices } from "@/hooks/useNotices";
import { isNoticeExpired, type Notice } from "@/lib/notices";
import NoticeFormModal, { type NoticeFormValues } from "./components/NoticeFormModal";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Notices() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const isStaffAdmin = user?.role === "admin" || user?.role === "superintendent";
  const isWarden = user?.role === "warden";
  const wardenHostelId = isWarden ? user?.hostelId ?? null : null;

  const { notices, loading, error, reload, add, edit, remove } = useNotices(
    isWarden ? wardenHostelId : null
  );

  const [filterHostel, setFilterHostel] = useState<number | "">("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const visibleNotices = useMemo(() => {
    if (!isStaffAdmin || filterHostel === "") return notices;
    return notices.filter((n) => n.hostel_id === filterHostel);
  }, [notices, isStaffAdmin, filterHostel]);

  const hostelName = (id: number) => hostels.find((h) => h.id === id)?.name ?? `Hostel #${id}`;

  const canManage = (notice: Notice) =>
    isStaffAdmin || (isWarden && notice.hostel_id === wardenHostelId);

  const handleSave = async (values: NoticeFormValues) => {
    setFormError("");
    if (modalMode === "create") {
      if (values.hostelId === "") {
        setFormError("Please select a hostel.");
        return;
      }
      setSaving(true);
      const res = await add({
        hostelId: Number(values.hostelId),
        title: values.title,
        body: values.body,
        authorName: user?.name ?? null,
        isPinned: values.isPinned,
        expiresAt: values.expiresAt,
      });
      setSaving(false);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      flash("Notice posted.");
    } else if (editingNotice) {
      setSaving(true);
      const res = await edit(editingNotice.id, {
        title: values.title,
        body: values.body,
        isPinned: values.isPinned,
        expiresAt: values.expiresAt,
      });
      setSaving(false);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      flash("Notice updated.");
    }
    setModalMode(null);
    setEditingNotice(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await remove(confirmDelete.id);
    setDeleting(false);
    if (res.error) {
      setMessage(res.error);
    } else {
      flash("Notice removed.");
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">Notices Board</h2>
          <p className="text-sm text-foreground-600 mt-1">
            {isWarden
              ? "Post announcements for the students of your hostel."
              : "Post and manage announcements across all hostels."}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingNotice(null);
            setFormError("");
            setModalMode("create");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          <i className="ri-megaphone-line"></i> Post Notice
        </button>
      </div>

      {message && (
        <div className="bg-primary-100 text-primary-800 border border-primary-200 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {isStaffAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground-700">Filter by hostel:</span>
          <select
            value={filterHostel}
            onChange={(e) => setFilterHostel(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="">All hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-foreground-500">
            <i className="ri-loader-4-line animate-spin text-xl"></i>
            <span className="text-sm">Loading notices…</span>
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2 inline-block">
              {error}
            </div>
            <div className="mt-3">
              <button
                onClick={reload}
                className="px-4 py-2 rounded-md bg-secondary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : visibleNotices.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary-100 flex items-center justify-center">
              <i className="ri-megaphone-line text-secondary-900 text-xl"></i>
            </div>
            <p className="mt-3 text-sm text-foreground-500">
              {isWarden
                ? "No notices posted for your hostel yet."
                : "No notices found for the selected hostel."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-background-100">
            {visibleNotices.map((n) => (
              <li key={n.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500 text-background-50 font-bold">
                          <i className="ri-pushpin-2-fill"></i> Pinned
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-foreground-900">{n.title}</h3>
                      {isNoticeExpired(n) && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground-100 text-foreground-500 font-semibold">
                          Expired
                        </span>
                      )}
                      {isStaffAdmin && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-900 font-semibold">
                          {hostelName(n.hostel_id)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-foreground-600 leading-relaxed whitespace-pre-line">
                      {n.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-400">
                      {n.author_name && (
                        <span className="flex items-center gap-1">
                          <i className="ri-user-line"></i>
                          {n.author_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="ri-calendar-line"></i>
                        {formatDate(n.created_at)}
                      </span>
                      {n.expires_at && (
                        <span className="flex items-center gap-1">
                          <i className="ri-time-line"></i>
                          Expires {formatDate(n.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage(n) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingNotice(n);
                          setFormError("");
                          setModalMode("edit");
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 cursor-pointer transition"
                        title="Edit"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(n)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-accent-700 hover:bg-accent-100 cursor-pointer transition"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalMode && (
        <NoticeFormModal
          mode={modalMode}
          initial={
            editingNotice
              ? {
                  title: editingNotice.title,
                  body: editingNotice.body,
                  isPinned: editingNotice.is_pinned,
                  expiresAt: editingNotice.expires_at,
                }
              : undefined
          }
          lockedHostelId={isWarden ? wardenHostelId : undefined}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={() => {
            setModalMode(null);
            setEditingNotice(null);
            setFormError("");
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-foreground-950/40" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-heading text-base font-semibold text-foreground-900">Delete Notice?</h3>
            <p className="text-sm text-foreground-600 mt-2">
              This permanently removes "{confirmDelete.title}" from the board.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}