import { useCallback, useEffect, useState } from "react";
import {
  fetchNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  type Notice,
} from "@/lib/notices";

export function useNotices(hostelId?: number | null) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotices(hostelId ?? null);
      setNotices(data);
    } catch (e) {
      setError((e as Error).message || "Could not load notices. Please try again.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (payload: Parameters<typeof createNotice>[0]) => {
      try {
        await createNotice(payload);
        await load();
        return { error: null as string | null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    [load]
  );

  const edit = useCallback(
    async (id: number, patch: Parameters<typeof updateNotice>[1]) => {
      try {
        const updated = await updateNotice(id, patch);
        if (updated) setNotices((prev) => prev.map((n) => (n.id === id ? updated : n)));
        return { error: null as string | null };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    []
  );

  const remove = useCallback(async (id: number) => {
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      return { error: null as string | null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  return { notices, loading, error, reload: load, add, edit, remove };
}