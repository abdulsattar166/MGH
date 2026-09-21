import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type AttendanceStatus = "present" | "absent";

export type AttendanceRecord = {
  id: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
  status: AttendanceStatus;
};

type AttendanceRow = {
  id: number;
  student_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
};

export function todayStr(): string {
  return dateOffsetStr(0);
}

export function dateOffsetStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function mapRow(r: AttendanceRow): AttendanceRecord {
  return {
    id: Number(r.id),
    studentId: Number(r.student_id),
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status,
  };
}

function upsertLocal(prev: AttendanceRecord[], rec: AttendanceRecord): AttendanceRecord[] {
  const filtered = prev.filter((r) => !(r.studentId === rec.studentId && r.date === rec.date));
  return [...filtered, rec].sort(
    (a, b) => a.studentId - b.studentId || a.date.localeCompare(b.date)
  );
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (apiMode) {
      try {
        const rows = await api.get<AttendanceRow[]>("/attendance");
        setRecords(rows.map(mapRow));
      } catch (e) {
        setError((e as Error).message || "Could not load attendance. Please try again.");
        setRecords([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false });
      if (err) {
        setError(err.message);
        setRecords([]);
      } else {
        setRecords(((data as AttendanceRow[]) ?? []).map(mapRow));
      }
    } catch {
      setError("Could not load attendance. Please try again.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const checkIn = useCallback(async (studentId: number, date: string) => {
    if (apiMode) {
      try {
        const row = await api.post<AttendanceRow>("/attendance/upsert", {
          student_id: studentId,
          date,
          check_in: nowTime(),
          check_out: null,
          status: "present",
        });
        setRecords((prev) => upsertLocal(prev, mapRow(row)));
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    }
    const { data, error: err } = await supabase
      .from("attendance")
      .upsert(
        { student_id: studentId, date, check_in: nowTime(), check_out: null, status: "present" },
        { onConflict: "student_id,date" }
      )
      .select()
      .maybeSingle();
    if (err) return err.message;
    if (data) setRecords((prev) => upsertLocal(prev, mapRow(data as AttendanceRow)));
    return null;
  }, []);

  const checkOut = useCallback(async (studentId: number, date: string) => {
    if (apiMode) {
      try {
        const row = await api.post<AttendanceRow>("/attendance/checkout", {
          student_id: studentId,
          date,
          check_out: nowTime(),
          status: "present",
        });
        setRecords((prev) => upsertLocal(prev, mapRow(row)));
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    }
    const { data, error: err } = await supabase
      .from("attendance")
      .update({ check_out: nowTime(), status: "present" })
      .eq("student_id", studentId)
      .eq("date", date)
      .select()
      .maybeSingle();
    if (err) return err.message;
    if (data) setRecords((prev) => upsertLocal(prev, mapRow(data as AttendanceRow)));
    return null;
  }, []);

  const markAbsent = useCallback(async (studentId: number, date: string) => {
    if (apiMode) {
      try {
        const row = await api.post<AttendanceRow>("/attendance/upsert", {
          student_id: studentId,
          date,
          check_in: null,
          check_out: null,
          status: "absent",
        });
        setRecords((prev) => upsertLocal(prev, mapRow(row)));
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    }
    const { data, error: err } = await supabase
      .from("attendance")
      .upsert(
        { student_id: studentId, date, check_in: null, check_out: null, status: "absent" },
        { onConflict: "student_id,date" }
      )
      .select()
      .maybeSingle();
    if (err) return err.message;
    if (data) setRecords((prev) => upsertLocal(prev, mapRow(data as AttendanceRow)));
    return null;
  }, []);

  return { records, loading, error, reload: load, checkIn, checkOut, markAbsent };
}