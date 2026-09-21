import { useState } from "react";
import type { Student } from "@/mocks/management/students";

type Props = {
  open: boolean;
  roomNumber: string;
  bedNumber: number;
  students: Student[];
  onClose: () => void;
  onAssign: (studentId: number) => void;
};

export default function AssignBedModal({
  open,
  roomNumber,
  bedNumber,
  students,
  onClose,
  onAssign,
}: Props) {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const q = query.toLowerCase();
  const filtered = students.filter((s) =>
    `${s.name} ${s.cnic} ${s.university}`.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-background-50 rounded-2xl border border-background-200">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-foreground-950">
              Assign Bed {bedNumber}
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer"
              aria-label="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <p className="text-xs text-foreground-500">Room {roomNumber} — choose a resident</p>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-foreground-500">
              No active students found.
            </div>
          ) : (
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onAssign(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-background-100 cursor-pointer transition text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 leading-tight min-w-0">
                    <div className="text-sm font-semibold text-foreground-900 truncate">
                      {s.name}
                    </div>
                    <div className="text-xs text-foreground-500 truncate">
                      Currently: Room {s.room} · Bed {s.bed}
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-foreground-400"></i>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}