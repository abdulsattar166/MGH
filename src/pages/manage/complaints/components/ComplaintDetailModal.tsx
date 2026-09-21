import { useEffect, useState } from "react";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  type Complaint,
} from "@/lib/complaints";
import {
  fetchComplaintResponses,
  addComplaintResponse,
  type ComplaintResponse,
} from "@/lib/complaintResponses";
import ComplaintStatusBadge from "./ComplaintStatusBadge";

type Props = {
  complaint: Complaint;
  hostelName: string | null;
  wardenName: string | null;
  canManage: boolean;
  onClose: () => void;
  onSave: (patch: { status?: string; remarks?: string; priority?: string }) => Promise<{ error: string | null }>;
};

const priorityTone: Record<string, string> = {
  Low: "text-foreground-500",
  Normal: "text-secondary-600",
  High: "text-accent-700",
  Urgent: "text-accent-700 font-bold",
};

const roleTone: Record<string, string> = {
  admin: "bg-accent-100 text-accent-900",
  superintendent: "bg-secondary-100 text-secondary-900",
  warden: "bg-primary-100 text-primary-900",
  student: "bg-background-100 text-foreground-700",
};

export default function ComplaintDetailModal({
  complaint,
  hostelName,
  wardenName,
  canManage,
  onClose,
  onSave,
}: Props) {
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [remarks, setRemarks] = useState(complaint.remarks ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<ComplaintResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [responsesError, setResponsesError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    let active = true;
    setResponsesLoading(true);
    setResponsesError("");
    fetchComplaintResponses(complaint.id)
      .then((r) => {
        if (active) setResponses(r);
      })
      .catch((e) => {
        if (active) setResponsesError((e as Error).message);
      })
      .finally(() => {
        if (active) setResponsesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [complaint.id]);

  const handlePostReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setPosting(true);
    setReplyError("");
    try {
      await addComplaintResponse(complaint.id, text);
      setReplyText("");
      const updated = await fetchComplaintResponses(complaint.id);
      setResponses(updated);
    } catch (e) {
      setReplyError((e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await onSave({ status, priority, remarks });
    setSaving(false);
    if (res.error) setError(res.error);
    else onClose();
  };

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-foreground-400">{label}</span>
      <span className="text-sm text-foreground-900">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onClose}></div>
      <div className="relative bg-background-50 border border-background-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-background-200">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-lg font-bold text-foreground-950">
                {complaint.code ?? `#${complaint.id}`}
              </h3>
              <ComplaintStatusBadge status={complaint.status} />
            </div>
            <p className="text-sm text-foreground-500 mt-1">{complaint.category}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer transition"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-foreground-800 leading-relaxed bg-background-100 rounded-md px-4 py-3">
            {complaint.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {row("Student", complaint.student_name ?? "—")}
            {row("Student ID", complaint.student_code ?? "—")}
            {row("Hostel", hostelName ?? "—")}
            {row("Room", complaint.room ?? "—")}
            {row("Assigned Warden", wardenName ?? "Auto-routing pending")}
            {row("Priority", <span className={priorityTone[complaint.priority] ?? ""}>{complaint.priority}</span>)}
            {row("Submitted", new Date(complaint.created_at).toLocaleString())}
          </div>

          {/* Response thread */}
          <div className="border-t border-background-200 pt-5 space-y-4">
            <h4 className="font-heading text-sm font-semibold text-foreground-900">
              Response Thread
              <span className="ml-2 text-xs font-normal text-foreground-400">
                {responses.length} {responses.length === 1 ? "reply" : "replies"}
              </span>
            </h4>

            {responsesLoading ? (
              <div className="text-sm text-foreground-500 flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i> Loading replies…
              </div>
            ) : responsesError ? (
              <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
                {responsesError}
              </div>
            ) : responses.length === 0 ? (
              <p className="text-sm text-foreground-500 bg-background-100 rounded-md px-4 py-3">
                No replies yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {responses.map((r) => (
                  <li key={r.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-xs font-bold shrink-0">
                      {(r.author_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 bg-background-100 rounded-md px-3 py-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground-900">
                          {r.author_name ?? "Unknown"}
                        </span>
                        {r.author_role && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              roleTone[r.author_role] ?? "bg-background-200 text-foreground-600"
                            }`}
                          >
                            {r.author_role}
                          </span>
                        )}
                        <span className="text-[11px] text-foreground-400 ml-auto">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground-700 whitespace-pre-wrap">
                        {r.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {canManage && (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Write a reply…"
                  className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                ></textarea>
                {replyError && (
                  <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
                    {replyError}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handlePostReply}
                    disabled={posting || !replyText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
                  >
                    {posting && <i className="ri-loader-4-line animate-spin"></i>}
                    Post Reply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-background-200 pt-5 space-y-4">
            <h4 className="font-heading text-sm font-semibold text-foreground-900">
              {canManage ? "Manage Complaint" : "Resolution"}
            </h4>

            {canManage ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-800 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                    >
                      {COMPLAINT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-800 mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                    >
                      {COMPLAINT_PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                    Response / Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    placeholder="Add your response or resolution notes…"
                  ></textarea>
                </div>
                {error && (
                  <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
                  >
                    {saving && <i className="ri-loader-4-line animate-spin"></i>}
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-foreground-700 bg-background-100 rounded-md px-4 py-3">
                {complaint.remarks || "No response has been added yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}