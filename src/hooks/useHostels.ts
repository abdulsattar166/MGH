import { useCallback, useEffect, useState } from "react";
import { fetchHostels, type HostelRef } from "@/lib/roomsDb";

export function useHostels() {
  const [hostels, setHostels] = useState<HostelRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHostels(await fetchHostels());
    } catch (e) {
      setError((e as Error).message || "Could not load hostels.");
      setHostels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { hostels, loading, error, reload: load };
}