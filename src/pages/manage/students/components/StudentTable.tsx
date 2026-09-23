import type { Student } from "@/mocks/management/students";
import { useHostels } from "@/hooks/useHostels";
import { resolveImageUrl } from "@/lib/api";

type Props = {
  students: Student[];
  onView: (s: Student) => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
};

const statusTone: Record<Student["status"], string> = {
  Active: "bg-primary-100 text-primary-800",
  "Fee Due": "bg-accent-100 text-accent-900",
  Notice: "bg-accent-100 text-accent-800",
  Left: "bg-background-200 text-foreground-500",
};

function hostelName(id: number, hostels: { id: number; name: string }[]) {
  return hostels.find((h) => h.id === id)?.name ?? "—";
}

export default function StudentTable({ students, onView, onEdit, onDelete }: Props) {
  const { hostels } = useHostels();
  if (students.length === 0) {
    return (
      <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
        <i className="ri-group-line text-4xl text-foreground-300"></i>
        <p className="mt-3 text-sm text-foreground-500">No students found.</p>
      </div>
    );
  }

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-100 text-left text-xs uppercase tracking-wide text-foreground-500">
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">CNIC</th>
              <th className="px-4 py-3 font-semibold">Room / Bed</th>
              <th className="px-4 py-3 font-semibold">Hostel</th>
              <th className="px-4 py-3 font-semibold">Monthly Fee</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                onClick={() => onView(s)}
                className="border-t border-background-100 hover:bg-background-50 cursor-pointer transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                      {s.imageUrl ? (
                        <img src={resolveImageUrl(s.imageUrl) ?? ""} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        s.name.charAt(0)
                      )}
                    </div>
                    <div className="leading-tight">
                      <div className="font-semibold text-foreground-900">{s.name}</div>
                      <div className="text-xs text-foreground-500">{s.program}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">{s.cnic}</td>
                <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                  {s.room} · Bed {s.bed}
                </td>
                <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                  {hostelName(s.hostelId, hostels)}
                </td>
                <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                  PKR {s.monthlyFee.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[s.status]}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(s);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600 cursor-pointer"
                      aria-label="View"
                      title="View details"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(s);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600 cursor-pointer"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <i className="ri-pencil-line"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-accent-100 hover:text-accent-700 cursor-pointer"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}