import { useEffect, useMemo, useState } from "react";
import type { Student } from "@/mocks/management/students";
import type { NewVisitor } from "@/hooks/useVisitors";

type HostelOption = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  isWarden: boolean;
  defaultHostelId: number;
  hostels: HostelOption[];
  students: Student[];
  saving: boolean;
  onClose: () => void;
  onSave: (v: NewVisitor) => void;
};

export default function CheckInModal({
  open,
  isWarden,
  defaultHostelId,
  hostels,
  students,
  saving,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [visitingStudent, setVisitingStudent] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hostelId, setHostelId] = useState(defaultHostelId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setCnic("");
      setVisitingStudent("");
      setPurpose("");
      setHostelId(defaultHostelId);
      setError("");
    }
  }, [open, defaultHostelId]);

  const residentOptions = useMemo(
    () => students.filter((s) => s.status !== "Left" && s.hostelId === hostelId),
    [students, hostelId]
  );

  if (!open) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the visitor's name.");
      return;
    }
    onSave({
      hostelId,
      name: name.trim(),
      cnic: cnic.trim(),
      visitingStudent,
      purpose: purpose.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-background-50 rounded-2xl border border-background-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground-950">Check-in Visitor</h3>
            <p className="text-xs text-foreground-500">Record a new visitor at the gate</p>
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
              Visitor Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abdul Rehman"
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              CNIC <span className="text-foreground-400">(optional)</span>
            </label>
            <input
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="35202-1234567-1"
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {!isWarden && (
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Hostel
              </label>
              <select
                value={String(hostelId)}
                onChange={(e) => setHostelId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Visiting Resident <span className="text-foreground-400">(optional)</span>
            </label>
            <select
              value={visitingStudent}
              onChange={(e) => setVisitingStudent(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="">— No specific resident —</option>
              {residentOptions.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} · Room {s.room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Purpose <span className="text-foreground-400">(optional)</span>
            </label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Family visit"
              className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
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
              Check In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}