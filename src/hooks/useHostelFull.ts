import { useEffect, useState } from "react";
import { fetchHostelsFull, type Hostel } from "@/lib/hostelsDb";

/**
 * Loads the full hostel list once and exposes the hostel matching `id`.
 * Used by the public hostel pages so that hostels added from the dashboard
 * (and their rooms) render without touching the static mock list.
 */
export function useHostelFull(id: number | null) {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchHostelsFull()
      .then((h) => {
        if (mounted) setHostels(h);
      })
      .catch(() => {
        if (mounted) setHostels([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hostel = id ? hostels.find((h) => h.id === id) ?? null : null;
  return { hostel, hostels, loading };
}