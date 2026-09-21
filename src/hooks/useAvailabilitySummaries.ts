import { useEffect, useState } from "react";
import { loadAvailabilitySummaries, type AvailabilitySummary } from "@/lib/booking";

export function useAvailabilitySummaries(
  hostelIds: number[],
): Record<number, AvailabilitySummary> {
  const [summaries, setSummaries] = useState<Record<number, AvailabilitySummary>>({});
  const key = hostelIds.join(",");

  useEffect(() => {
    let mounted = true;
    loadAvailabilitySummaries(hostelIds).then((s) => {
      if (mounted) setSummaries(s);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return summaries;
}