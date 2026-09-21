import { useCallback, useEffect, useState } from "react";
import {
  fetchPublicHostelAvailability,
  type PublicAvailability,
} from "@/lib/roomsDb";

export function usePublicHostelAvailability(hostelId: number) {
  const [data, setData] = useState<PublicAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchPublicHostelAvailability(hostelId));
    } catch (e) {
      setError((e as Error).message || "Could not load availability.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}