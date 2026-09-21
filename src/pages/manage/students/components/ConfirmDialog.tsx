type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onCancel}></div>
      <div className="relative w-full max-w-sm bg-background-50 rounded-2xl border border-background-200 p-6">
        <div className="w-12 h-12 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center mb-4">
          <i className="ri-error-warning-line text-2xl"></i>
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground-950">{title}</h3>
        <p className="mt-1.5 text-sm text-foreground-600">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-accent-600 hover:bg-accent-700 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}