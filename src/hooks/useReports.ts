import { useCallback, useEffect, useState } from "react";
import { fetchReports, type ReportsData, type ReportFilters } from "@/lib/reports";

export function useReports(filters: ReportFilters = {}) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchReports(JSON.parse(key) as ReportFilters);
      setData(result);
    } catch (e) {
      setError((e as Error).message || "Could not load reports. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}