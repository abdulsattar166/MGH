import { useEffect, useState } from "react";
import type { Student } from "@/mocks/management/students";

type Props = {
  open: boolean;
  student: Student | null;
  saving: boolean;
  onClose: () => void;
  onSave: (amount: number, method: string) => void;
};

const methods = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa"];

export default function RecordPaymentModal({
  open,
  student,
  saving,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && student) {
      setAmount(String(student.monthlyFee));
      setMethod("Cash");
      setError("");
    }
  }, [open, student]);

  if (!open || !student) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    onSave(amt, method);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-background-50 rounded-2xl border border-background-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground-950">
              Record Payment
            </h3>
            <p className="text-xs text-foreground-500">{student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Amount (PKR)
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
            >
              {saving && <i className="ri-loader-4-line animate-spin"></i>}
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}