import { useCallback, useEffect, useState } from "react";
import { fetchOccupancy, type OccupancyByHostel } from "@/lib/roomsDb";

export function useOccupancy(hostelIds?: number[]) {
  const [data, setData] = useState<OccupancyByHostel>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const key = JSON.stringify(hostelIds);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchOccupancy(JSON.parse(key) as number[] | undefined));
    } catch (e) {
      setError((e as Error).message || "Could not load occupancy.");
      setData({});
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}