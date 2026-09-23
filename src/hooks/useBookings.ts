import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadBookings } from "@/lib/booking";
import { apiMode } from "@/lib/api";
import type { Booking } from "@/lib/booking";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await loadBookings();
      setBookings(data);
      setError("");
    } catch (e) {
      setError((e as Error).message || "Could not load bookings. Please try again.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();

    if (apiMode) {
      // Poll lightly so the dashboard stays fresh without a websocket layer.
      const timer = window.setInterval(() => void reload(), 30000);
      return () => window.clearInterval(timer);
    }

    // Supabase live-refresh when a booking row changes.
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  return { bookings, loading, error, reload };
}