import { useState } from "react";
import { useHostels } from "@/hooks/useHostels";

export type NoticeFormValues = {
  title: string;
  body: string;
  hostelId: number | "";
  isPinned: boolean;
  expiresAt: string | null;
};

type Props = {
  mode: "create" | "edit";
  initial?: {
    title?: string;
    body?: string;
    hostelId?: number | null;
    isPinned?: boolean;
    expiresAt?: string | null;
  };
  lockedHostelId?: number | null;
  saving: boolean;
  error: string;
  onSubmit: (values: NoticeFormValues) => void;
  onClose: () => void;
};

export default function NoticeFormModal({
  mode,
  initial,
  lockedHostelId,
  saving,
  error,
  onSubmit,
  onClose,
}: Props) {
  const { hostels } = useHostels();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [hostelId, setHostelId] = useState<number | "">(
    lockedHostelId ?? initial?.hostelId ?? ""
  );
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [expiresDate, setExpiresDate] = useState(
    initial?.expiresAt ? initial.expiresAt.slice(0, 10) : ""
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      body: body.trim(),
      hostelId,
      isPinned,
      expiresAt: expiresDate ? new Date(`${expiresDate}T23:59:59`).toISOString() : null,
    });
  };

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (lockedHostelId != null || hostelId !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onClose}></div>
      <div className="relative bg-background-50 border border-background-200 rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-foreground-900">
            {mode === "create" ? "Post a Notice" : "Edit Notice"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer transition"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {lockedHostelId == null && (
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Hostel
              </label>
              <select
                value={hostelId}
                onChange={(e) => setHostelId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="">Select a hostel…</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="e.g. Mess Timings Update"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={2000}
              className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              placeholder="Write the notice details…"
            />
            <div className="text-right text-xs text-foreground-400 mt-1">{body.length}/2000</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                />
                <span className="inline-flex items-center gap-1">
                  <i className="ri-pushpin-2-fill text-accent-600"></i>
                  Pin this notice
                </span>
              </label>
              <p className="text-xs text-foreground-500 mt-1">
                Pinned notices stay highlighted at the top of the board.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Expiry date{" "}
                <span className="text-foreground-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {expiresDate && (
                <button
                  type="button"
                  onClick={() => setExpiresDate("")}
                  className="mt-1 text-xs text-accent-700 hover:underline cursor-pointer"
                >
                  Clear expiry
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="px-5 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1.5"></i>
                  Saving…
                </>
              ) : mode === "create" ? (
                "Post Notice"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}