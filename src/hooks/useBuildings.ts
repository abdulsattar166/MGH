import { useCallback, useEffect, useState } from "react";
import { fetchBuildings, type Building } from "@/lib/buildingsDb";

export function useBuildings(hostelId?: number) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBuildings(await fetchBuildings(hostelId));
    } catch (e) {
      setError((e as Error).message || "Could not load buildings.");
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    load();
  }, [load]);

  return { buildings, loading, error, reload: load };
}