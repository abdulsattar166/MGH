import type { Student } from "@/mocks/management/students";
import type { AttendanceRecord } from "@/hooks/useAttendance";

type Props = {
  student: Student;
  record?: AttendanceRecord;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onMarkAbsent: () => void;
};

export default function AttendanceRow({
  student,
  record,
  onCheckIn,
  onCheckOut,
  onMarkAbsent,
}: Props) {
  const checkedIn = Boolean(record?.checkIn);
  const checkedOut = Boolean(record?.checkOut);
  const absent = record?.status === "absent";

  const statusLabel = absent
    ? "Absent"
    : checkedOut
      ? "Checked Out"
      : checkedIn
        ? "Checked In"
        : "Not Marked";

  const statusClass = absent
    ? "bg-accent-100 text-accent-800"
    : checkedOut
      ? "bg-secondary-100 text-secondary-900"
      : checkedIn
        ? "bg-primary-100 text-primary-800"
        : "bg-background-200 text-foreground-600";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-background-50 border border-background-200 rounded-lg">
      {/* Student identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0">
          {student.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-foreground-950 truncate">{student.name}</div>
          <div className="text-xs text-foreground-500 truncate">
            Room {student.room} · Bed {student.bed} · {student.university}
          </div>
        </div>
      </div>

      {/* Times */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <i className="ri-login-box-line text-primary-600"></i>
          <div className="leading-tight">
            <div className="text-[11px] text-foreground-400 uppercase tracking-wide">In</div>
            <div className="font-semibold text-foreground-900">{record?.checkIn ?? "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <i className="ri-logout-box-r-line text-secondary-600"></i>
          <div className="leading-tight">
            <div className="text-[11px] text-foreground-400 uppercase tracking-wide">Out</div>
            <div className="font-semibold text-foreground-900">{record?.checkOut ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 lg:justify-end">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass}`}>
          {statusLabel}
        </span>

        {!checkedIn && !absent && (
          <button
            onClick={onCheckIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-login-box-line"></i> Check In
          </button>
        )}

        {checkedIn && !checkedOut && (
          <button
            onClick={onCheckOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-logout-box-r-line"></i> Check Out
          </button>
        )}

        {absent && (
          <button
            onClick={onCheckIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-login-box-line"></i> Mark Present
          </button>
        )}

        {!absent && (
          <button
            onClick={onMarkAbsent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background-100 hover:bg-background-200 text-foreground-600 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
            title="Mark absent"
          >
            <i className="ri-user-unfollow-line"></i> Absent
          </button>
        )}
      </div>
    </div>
  );
}