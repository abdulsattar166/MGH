import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type FeeRecord = {
  id: number;
  studentId: number;
  month: string; // YYYY-MM
  amount: number;
  paid: boolean;
  paidAt: string | null;
  method: string | null;
};

type FeeRow = {
  id: number;
  student_id: number;
  month: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  method: string | null;
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

function mapRow(r: FeeRow): FeeRecord {
  return {
    id: Number(r.id),
    studentId: Number(r.student_id),
    month: r.month,
    amount: Number(r.amount),
    paid: Boolean(r.paid),
    paidAt: r.paid_at,
    method: r.method,
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

  const recordPayment = useCallback(
    async (studentId: number, amount: number, method: string) => {
      if (apiMode) {
        try {
          const row = await api.post<FeeRow>("/fees/upsert", {
            student_id: studentId,
            month,
            amount,
            paid: true,
            paid_at: new Date().toISOString().slice(0, 10),
            method,
          });
          setRecords((prev) => [
            ...prev.filter((r) => r.studentId !== studentId),
            mapRow(row),
          ]);
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
          },
          { onConflict: "student_id,month" }
        )
        .select()
        .maybeSingle();
      if (err) return err.message;
      if (data) {
        setRecords((prev) => [
          ...prev.filter((r) => r.studentId !== studentId),
          mapRow(data as FeeRow),
        ]);
      }
      return null;
    },
    [month]
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
          setRecords((prev) => [
            ...prev.filter((r) => r.studentId !== studentId),
            mapRow(row),
          ]);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }
      const { data, error: err } = await supabase
        .from("fees")
        .upsert(
          { student_id: studentId, month, amount, paid: false, paid_at: null, method: null },
          { onConflict: "student_id,month" }
        )
        .select()
        .maybeSingle();
      if (err) return err.message;
      if (data) {
        setRecords((prev) => [
          ...prev.filter((r) => r.studentId !== studentId),
          mapRow(data as FeeRow),
        ]);
      }
      return null;
    },
    [month]
  );

  return { records, loading, error, reload: load, recordPayment, markUnpaid };
}