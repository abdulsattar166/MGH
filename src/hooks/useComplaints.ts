import { useCallback, useEffect, useState } from "react";
import {
  fetchComplaints,
  createComplaint,
  updateComplaint,
  type Complaint,
  type ComplaintFilters,
} from "@/lib/complaints";

export function useComplaints(filters: ComplaintFilters = {}) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchComplaints(JSON.parse(key) as ComplaintFilters);
      setComplaints(data);
    } catch (e) {
      setError((e as Error).message || "Could not load complaints. Please try again.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (payload: Parameters<typeof createComplaint>[0]) => {
      try {
        const created = await createComplaint(payload);
        await load();
        return { error: null as string | null, complaint: created };
      } catch (e) {
        return { error: (e as Error).message, complaint: null };
      }
    },
    [load]
  );

  const update = useCallback(
    async (id: number, patch: Parameters<typeof updateComplaint>[1]) => {
      try {
        const updated = await updateComplaint(id, patch);
        setComplaints((prev) => prev.map((c) => (c.id === id && updated ? updated : c)));
        return { error: null as string | null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    []
  );

  return { complaints, loading, error, reload: load, submit, update, setComplaints };
}