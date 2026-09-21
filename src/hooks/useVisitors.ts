import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type Visitor = {
  id: number;
  hostelId: number;
  name: string;
  cnic: string;
  visitingStudent: string;
  purpose: string;
  checkIn: string; // ISO timestamp
  checkOut: string | null; // ISO timestamp
};

type VisitorRow = {
  id: number;
  hostel_id: number;
  name: string;
  cnic: string | null;
  visiting_student: string | null;
  purpose: string | null;
  check_in: string;
  check_out: string | null;
};

function mapRow(r: VisitorRow): Visitor {
  return {
    id: Number(r.id),
    hostelId: Number(r.hostel_id),
    name: r.name,
    cnic: r.cnic ?? "",
    visitingStudent: r.visiting_student ?? "",
    purpose: r.purpose ?? "",
    checkIn: r.check_in,
    checkOut: r.check_out,
  };
}

export type NewVisitor = {
  hostelId: number;
  name: string;
  cnic: string;
  visitingStudent: string;
  purpose: string;
};

export function useVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (apiMode) {
      try {
        const rows = await api.get<VisitorRow[]>("/visitors");
        setVisitors(rows.map(mapRow));
      } catch (e) {
        setError((e as Error).message || "Could not load visitors. Please try again.");
        setVisitors([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from("visitors")
        .select("*")
        .order("check_in", { ascending: false });
      if (err) {
        setError(err.message);
        setVisitors([]);
      } else {
        setVisitors(((data as VisitorRow[]) ?? []).map(mapRow));
      }
    } catch {
      setError("Could not load visitors. Please try again.");
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const checkIn = useCallback(async (v: NewVisitor) => {
    if (apiMode) {
      try {
        const row = await api.post<VisitorRow>("/visitors", {
          hostel_id: v.hostelId,
          name: v.name,
          cnic: v.cnic || null,
          visiting_student: v.visitingStudent || null,
          purpose: v.purpose || null,
        });
        setVisitors((prev) => [mapRow(row), ...prev]);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    }
    const { data, error: err } = await supabase
      .from("visitors")
      .insert({
        hostel_id: v.hostelId,
        name: v.name,
        cnic: v.cnic || null,
        visiting_student: v.visitingStudent || null,
        purpose: v.purpose || null,
        check_in: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (err) return err.message;
    if (data) setVisitors((prev) => [mapRow(data as VisitorRow), ...prev]);
    return null;
  }, []);

  const checkOut = useCallback(async (id: number) => {
    if (apiMode) {
      try {
        const row = await api.put<VisitorRow>(`/visitors/${id}/checkout`);
        setVisitors((prev) => prev.map((v) => (v.id === id ? mapRow(row) : v)));
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    }
    const { data, error: err } = await supabase
      .from("visitors")
      .update({ check_out: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (err) return err.message;
    if (data) {
      setVisitors((prev) => prev.map((v) => (v.id === id ? mapRow(data as VisitorRow) : v)));
    }
    return null;
  }, []);

  return { visitors, loading, error, reload: load, checkIn, checkOut };
}