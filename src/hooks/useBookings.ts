import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchBookingRecords } from "@/lib/bookingsDb";
import type { Booking } from "@/lib/booking";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await fetchBookingRecords();
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

    // Live-refresh the list whenever a booking row changes (new submission,
    // approve, reject, etc.).
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