import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

type FeeRow = {
  id: number;
  student_id: number;
  month: string;
  amount: number;
  paid: boolean;
};

export type FeeTrendPoint = {
  label: string; // e.g. "Aug"
  month: string; // e.g. "2025-08"
  collected: number;
  expected: number;
};

function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function sumPaid(rows: FeeRow[], month: string): number {
  return rows.filter((r) => r.month === month && r.paid).reduce((s, r) => s + Number(r.amount), 0);
}

/**
 * Fetches all fee rows (RLS scopes wardens to their hostel) and computes
 * a 6-month collection trend plus the current month's collected/expected.
 */
export function useFeeTrend(expectedPerMonth: number) {
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (apiMode) {
      try {
        const data = await api.get<FeeRow[]>("/fees");
        setRows(data ?? []);
      } catch (e) {
        setError((e as Error).message || "Could not load fee data. Please try again.");
        setRows([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from("fees")
        .select("id, student_id, month, amount, paid");
      if (err) {
        if (err.code === "42P01" || err.message?.includes("does not exist")) {
          setRows([]);
        } else {
          setError(err.message);
          setRows([]);
        }
      } else {
        setRows((data as FeeRow[]) ?? []);
      }
    } catch {
      setError("Could not load fee data. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const trend: FeeTrendPoint[] = lastNMonths(6).map((month) => ({
    label: monthLabel(month),
    month,
    collected: sumPaid(rows, month),
    expected: expectedPerMonth,
  }));

  const currentMonth = lastNMonths(1)[0];
  const currentCollected = sumPaid(rows, currentMonth);
  const currentExpected = expectedPerMonth;
  const currentOutstanding = Math.max(currentExpected - currentCollected, 0);

  return {
    trend,
    currentMonth,
    currentCollected,
    currentExpected,
    currentOutstanding,
    loading,
    error,
    reload: load,
  };
}