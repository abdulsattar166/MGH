import { useCallback, useEffect, useState } from "react";
import { fetchHostelsFull, type Hostel } from "@/lib/hostelsDb";

export function useHostelsFull() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHostels(await fetchHostelsFull());
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