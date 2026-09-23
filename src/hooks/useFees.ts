import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type FeeStatus = "approved" | "fetched" | "unfetched";

export type FeeRecord = {
  id: number;
  studentId: number;
  studentName?: string;
  hostelId?: number | null;
  hostelName?: string | null;
  room?: string | null;
  bed?: number | null;
  studentStatus?: string | null;
  month: string; // YYYY-MM
  amount: number;
  paid: boolean;
  paidAt: string | null;
  method: string | null;
  reference: string | null;
  status: FeeStatus;
  collectedBy: string | null;
  remarks: string | null;
  createdAt: string;
};

type FeeRow = {
  id: number;
  studentId?: number;
  student_id?: number;
  studentName?: string;
  student_name?: string;
  hostelId?: number | null;
  hostel_id?: number | null;
  hostelName?: string | null;
  hostel_name?: string | null;
  room?: string | null;
  bed?: number | null;
  studentStatus?: string | null;
  student_status?: string | null;
  month: string;
  amount: number;
  paid: boolean;
  paidAt?: string | null;
  paid_at?: string | null;
  method: string | null;
  reference?: string | null;
  status: FeeStatus;
  collectedBy?: string | null;
  collected_by?: string | null;
  remarks?: string | null;
  createdAt?: string;
  created_at?: string;
};

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function mapRow(r: FeeRow): FeeRecord {
  return {
    id: Number(r.id),
    studentId: Number(r.studentId ?? r.student_id),
    studentName: r.studentName ?? r.student_name,
    hostelId: r.hostelId != null ? Number(r.hostelId) : r.hostel_id != null ? Number(r.hostel_id) : null,
    hostelName: r.hostelName ?? r.hostel_name,
    room: r.room,
    bed: r.bed != null ? Number(r.bed) : null,
    studentStatus: r.studentStatus ?? r.student_status,
    month: r.month,
    amount: Number(r.amount),
    paid: Boolean(r.paid),
    paidAt: r.paidAt ?? r.paid_at,
    method: r.method,
    reference: r.reference ?? null,
    status: r.status,
    collectedBy: r.collectedBy ?? r.collected_by,
    remarks: r.remarks ?? null,
    createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
  };
}

export function useFees(month: string) {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (apiMode) {
      try {
        const rows = await api.get<FeeRow[]>(`/fees?month=${encodeURIComponent(month)}`);
        setRecords(rows.map(mapRow));
      } catch (e) {
        setError((e as Error).message || "Could not load fees. Please try again.");
        setRecords([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const { data, error: err } = await supabase.from("fees").select("*").eq("month", month);
      if (err) {
        setError(err.message);
        setRecords([]);
      } else {
        setRecords(((data as FeeRow[]) ?? []).map(mapRow));
      }
    } catch {
      setError("Could not load fees. Please try again.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const upsertLocal = useCallback((row: FeeRow) => {
    setRecords((prev) => {
      const rec = mapRow(row);
      return [...prev.filter((r) => r.studentId !== rec.studentId), rec];
    });
  }, []);

  const recordPayment = useCallback(
    async (studentId: number, amount: number, method: string) => {
      if (apiMode) {
        try {
          const row = await api.post<FeeRow>("/fees/collect", {
            student_id: studentId,
            month,
            amount,
            method,
          });
          upsertLocal(row);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      const { data, error: err } = await supabase
        .from("fees")
        .upsert(
          {
            student_id: studentId,
            month,
            amount,
            paid: true,
            paid_at: new Date().toISOString().slice(0, 10),
            method,
            status: "fetched",
          },
          { onConflict: "student_id,month" }
        )
        .select()
        .maybeSingle();
      if (err) return err.message;
      if (data) upsertLocal(data as FeeRow);
      return null;
    },
    [month, upsertLocal]
  );

  const collectFee = useCallback(
    async (studentId: number, amount: number, method: string, reference?: string, remarks?: string) => {
      if (apiMode) {
        try {
          const row = await api.post<FeeRow>("/fees/collect", {
            student_id: studentId,
            month,
            amount,
            method,
            reference,
            remarks,
          });
          upsertLocal(row);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      return recordPayment(studentId, amount, method);
    },
    [month, recordPayment, upsertLocal]
  );

  const markUnpaid = useCallback(
    async (studentId: number, amount: number) => {
      if (apiMode) {
        try {
          const row = await api.post<FeeRow>("/fees/upsert", {
            student_id: studentId,
            month,
            amount,
            paid: false,
            paid_at: null,
            method: null,
          });
          upsertLocal(row);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      const { data, error: err } = await supabase
        .from("fees")
        .upsert(
          { student_id: studentId, month, amount, paid: false, paid_at: null, method: null, status: "approved" },
          { onConflict: "student_id,month" }
        )
        .select()
        .maybeSingle();
      if (err) return err.message;
      if (data) upsertLocal(data as FeeRow);
      return null;
    },
    [month, upsertLocal]
  );

  const setFeeStatus = useCallback(
    async (feeId: number, status: FeeStatus) => {
      if (apiMode) {
        try {
          const row = await api.post<FeeRow>(`/fees/${feeId}/status`, { status });
          upsertLocal(row);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      const { error: err } = await supabase
        .from("fees")
        .update({ status, paid: status === "fetched" ? true : false })
        .eq("id", feeId);
      if (err) return err.message;
      void load();
      return null;
    },
    [load, upsertLocal]
  );

  return { records, loading, error, reload: load, recordPayment, collectFee, markUnpaid, setFeeStatus };
}