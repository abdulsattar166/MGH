import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useAttendance, shiftDate, todayStr } from "@/hooks/useAttendance";
import { useHostels } from "@/hooks/useHostels";
import AttendanceRow from "./components/AttendanceRow";
import DataState from "@/pages/manage/components/DataState";

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Attendance() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useStudents();
  const {
    records,
    loading: attendanceLoading,
    error: attendanceError,
    reload: reloadAttendance,
    checkIn,
    checkOut,
    markAbsent,
  } = useAttendance();

  const loading = studentsLoading || attendanceLoading;
  const loadError = studentsError || attendanceError;
  const reload = () => {
    reloadStudents();
    reloadAttendance();
  };

  const isWarden = user?.role === "warden";
  const [date, setDate] = useState(todayStr());
  const [hostelId, setHostelId] = useState<number>(
    isWarden ? (user?.hostelId ?? 1) : 1
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "checkedin" | "checkedout" | "unmarked">("all");

  const scopedHostelId = isWarden ? (user?.hostelId ?? null) : hostelId;

  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => s.status !== "Left")
        .filter((s) => scopedHostelId === null || s.hostelId === scopedHostelId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, scopedHostelId]
  );

  const recordFor = (studentId: number) =>
    records.find((r) => r.studentId === studentId && r.date === date);

  const stats = useMemo(() => {
    const dayRecords = records.filter((r) => r.date === date);
    const present = dayRecords.filter((r) => r.status === "present").length;
    const checkedIn = dayRecords.filter((r) => r.checkIn && !r.checkOut).length;
    const checkedOut = dayRecords.filter((r) => r.checkOut).length;
    const absent = dayRecords.filter((r) => r.status === "absent").length;
    return { present, checkedIn, checkedOut, absent };
  }, [records, date]);

  const visible = useMemo(() => {
    return activeStudents.filter((s) => {
      const r = recordFor(s.id);
      if (statusFilter === "all") return true;
      if (statusFilter === "present") return r?.status === "present";
      if (statusFilter === "absent") return r?.status === "absent";
      if (statusFilter === "checkedin") return Boolean(r?.checkIn && !r?.checkOut);
      if (statusFilter === "checkedout") return Boolean(r?.checkOut);
      if (statusFilter === "unmarked") return !r;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudents, records, date, statusFilter]);

  const handleCheckInAll = () => {
    activeStudents.forEach((s) => {
      const r = recordFor(s.id);
      if (!r?.checkIn) checkIn(s.id, date);
    });
  };

  const handleCheckOutAll = () => {
    activeStudents.forEach((s) => {
      const r = recordFor(s.id);
      if (r?.checkIn && !r?.checkOut) checkOut(s.id, date);
    });
  };

  const statItems = [
    { label: "Present", value: stats.present, icon: "ri-user-star-line", tone: "text-primary-600" },
    { label: "Checked In", value: stats.checkedIn, icon: "ri-login-box-line", tone: "text-secondary-600" },
    { label: "Checked Out", value: stats.checkedOut, icon: "ri-logout-box-r-line", tone: "text-foreground-700" },
    { label: "Absent", value: stats.absent, icon: "ri-user-unfollow-line", tone: "text-accent-600" },
  ];

  return (
    <DataState loading={loading} error={loadError} onRetry={reload}>
    <div className="space-y-5">
      {/* Date + hostel controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate((d) => shiftDate(d, -1))}
            className="w-10 h-10 rounded-md border border-background-300 bg-background-50 text-foreground-700 hover:bg-background-100 flex items-center justify-center cursor-pointer transition"
            aria-label="Previous day"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          />
          <button
            onClick={() => setDate((d) => shiftDate(d, 1))}
            className="w-10 h-10 rounded-md border border-background-300 bg-background-50 text-foreground-700 hover:bg-background-100 flex items-center justify-center cursor-pointer transition"
            aria-label="Next day"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
          {date !== todayStr() && (
            <button
              onClick={() => setDate(todayStr())}
              className="px-3 py-2.5 rounded-md bg-background-100 hover:bg-background-200 text-foreground-700 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              Today
            </button>
          )}
          <span className="hidden md:inline text-sm text-foreground-500 ml-2">
            {formatDisplay(date)}
          </span>
        </div>

        {!isWarden && (
          <div className="flex items-center gap-2">
            <i className="ri-building-2-line text-foreground-400"></i>
            <select
              value={hostelId}
              onChange={(e) => setHostelId(Number(e.target.value))}
              className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((s) => (
          <div
            key={s.label}
            className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-md bg-background-100 flex items-center justify-center ${s.tone}`}>
              <i className={`${s.icon} text-lg`}></i>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground-950">{s.value}</div>
              <div className="text-xs text-foreground-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk + filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCheckInAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-login-box-line"></i> Check In All
          </button>
          <button
            onClick={handleCheckOutAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-logout-box-r-line"></i> Check Out All
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "present", label: "Present" },
            { key: "checkedin", label: "Checked In" },
            { key: "checkedout", label: "Checked Out" },
            { key: "absent", label: "Absent" },
            { key: "unmarked", label: "Not Marked" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                statusFilter === f.key
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-foreground-500">
            <i className="ri-calendar-check-line text-4xl mb-3 block"></i>
            No students match this filter.
          </div>
        ) : (
          visible.map((s) => (
            <AttendanceRow
              key={s.id}
              student={s}
              record={recordFor(s.id)}
              onCheckIn={() => checkIn(s.id, date)}
              onCheckOut={() => checkOut(s.id, date)}
              onMarkAbsent={() => markAbsent(s.id, date)}
            />
          ))
        )}
      </div>
    </div>
    </DataState>
  );
}