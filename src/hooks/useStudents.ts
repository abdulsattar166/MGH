import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";
import { logAudit } from "@/lib/auditLogs";
import type { Student } from "@/mocks/management/students";

type StudentRow = {
  id: number;
  name: string;
  father_name: string;
  cnic: string;
  phone: string;
  hostel_id: number;
  room: string;
  bed: number;
  room_type: string;
  university: string;
  program: string;
  guardian_phone: string;
  join_date: string;
  monthly_fee: number;
  status: Student["status"];
};

function mapRow(r: StudentRow): Student {
  return {
    id: Number(r.id),
    name: r.name,
    fatherName: r.father_name,
    cnic: r.cnic,
    phone: r.phone,
    hostelId: r.hostel_id,
    room: r.room,
    bed: r.bed,
    roomType: r.room_type,
    university: r.university,
    program: r.program,
    guardianPhone: r.guardian_phone,
    joinDate: r.join_date,
    monthlyFee: r.monthly_fee,
    status: r.status,
  };
}

function toRow(s: Partial<Omit<Student, "id">>) {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.fatherName !== undefined) row.father_name = s.fatherName;
  if (s.cnic !== undefined) row.cnic = s.cnic;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.hostelId !== undefined) row.hostel_id = s.hostelId;
  if (s.room !== undefined) row.room = s.room;
  if (s.bed !== undefined) row.bed = s.bed;
  if (s.roomType !== undefined) row.room_type = s.roomType;
  if (s.university !== undefined) row.university = s.university;
  if (s.program !== undefined) row.program = s.program;
  if (s.guardianPhone !== undefined) row.guardian_phone = s.guardianPhone;
  if (s.joinDate !== undefined) row.join_date = s.joinDate;
  if (s.monthlyFee !== undefined) row.monthly_fee = s.monthlyFee;
  if (s.status !== undefined) row.status = s.status;
  return row;
}

function byName(a: Student, b: Student) {
  return a.name.localeCompare(b.name);
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (apiMode) {
      try {
        const rows = await api.get<StudentRow[]>("/students");
        setStudents(rows.map(mapRow));
      } catch (e) {
        setError((e as Error).message || "Could not load students. Please try again.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from("students")
        .select("*")
        .order("name", { ascending: true });
      if (err) {
        setError(err.message);
        setStudents([]);
      } else {
        setStudents(((data as StudentRow[]) ?? []).map(mapRow));
      }
    } catch {
      setError("Could not load students. Please try again.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addStudent = useCallback(async (data: Omit<Student, "id">) => {
    if (apiMode) {
      try {
        const row = await api.post<StudentRow>("/students", toRow(data));
        setStudents((prev) => [...prev, mapRow(row)].sort(byName));
        return { error: null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    }
    const { data: row, error: err } = await supabase
      .from("students")
      .insert(toRow(data))
      .select()
      .maybeSingle();
    if (err) return { error: err.message };
    if (row) {
      setStudents((prev) => [...prev, mapRow(row as StudentRow)].sort(byName));
      void logAudit({
        action: "student.created",
        resource: "students",
        resourceId: String((row as StudentRow).id),
        details: `Added student ${data.name}`,
      });
    }
    return { error: null };
  }, []);

  const updateStudent = useCallback(async (id: number, data: Partial<Student>) => {
    if (apiMode) {
      try {
        const row = await api.put<StudentRow>(`/students/${id}`, toRow(data));
        setStudents((prev) => prev.map((s) => (s.id === id ? mapRow(row) : s)));
        return { error: null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    }
    const { data: row, error: err } = await supabase
      .from("students")
      .update(toRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (err) return { error: err.message };
    if (row) {
      setStudents((prev) => prev.map((s) => (s.id === id ? mapRow(row as StudentRow) : s)));
      void logAudit({
        action: "student.updated",
        resource: "students",
        resourceId: String(id),
        details: `Updated student ${data.name ?? id}`,
      });
    }
    return { error: null };
  }, []);

  const deleteStudent = useCallback(async (id: number) => {
    if (apiMode) {
      try {
        await api.del(`/students/${id}`);
        setStudents((prev) => prev.filter((s) => s.id !== id));
        return { error: null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    }
    const { error: err } = await supabase.from("students").delete().eq("id", id);
    if (err) return { error: err.message };
    setStudents((prev) => prev.filter((s) => s.id !== id));
    void logAudit({
      action: "student.deleted",
      resource: "students",
      resourceId: String(id),
      details: `Deleted student ${id}`,
    });
    return { error: null };
  }, []);

  return {
    students,
    loading,
    error,
    reload: load,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}