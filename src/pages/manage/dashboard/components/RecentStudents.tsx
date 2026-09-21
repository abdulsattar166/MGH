import { Link } from "react-router-dom";
import type { Student } from "@/mocks/management/students";
import { useHostels } from "@/hooks/useHostels";

type Props = {
  students: Student[];
};

export default function RecentStudents({ students }: Props) {
  const { hostels } = useHostels();
  const recent = [...students]
    .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
    .slice(0, 6);

  const hostelName = (id: number) => hostels.find((h) => h.id === id)?.name ?? "";

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold text-foreground-950">
          Recent Students
        </h3>
        <Link
          to="/manage/students"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-background-200">
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-400 pr-4">
                Student
              </th>
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-400 pr-4">
                Hostel
              </th>
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-400 pr-4">
                Room
              </th>
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-b border-background-100 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-xs font-bold shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground-900 whitespace-nowrap">
                      {s.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-sm text-foreground-600 whitespace-nowrap">
                  {hostelName(s.hostelId)}
                </td>
                <td className="py-3 pr-4 text-sm text-foreground-600 whitespace-nowrap">
                  {s.room}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "Active"
                        ? "bg-primary-100 text-primary-700"
                        : s.status === "Notice"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-background-200 text-foreground-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}