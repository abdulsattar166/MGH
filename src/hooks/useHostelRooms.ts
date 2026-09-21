import { useEffect, useState } from "react";
import { loadHostelRooms, type RoomBeds } from "@/lib/booking";

export function useHostelRooms(hostelId: number): RoomBeds[] {
  const [rooms, setRooms] = useState<RoomBeds[]>([]);

  useEffect(() => {
    let mounted = true;
    loadHostelRooms(hostelId).then((r) => {
      if (mounted) setRooms(r);
    });
    return () => {
      mounted = false;
    };
  }, [hostelId]);

  return rooms;
}