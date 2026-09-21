import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchRoomsData,
  assignStudentToBed,
  unassignStudent,
  setBedMaintenance,
  addRoom,
  updateRoom,
  deleteRoom,
  type DbRoom,
  type DbBed,
  type DbAllocation,
  type RoomInput,
} from "@/lib/roomsDb";
import { logAudit } from "@/lib/auditLogs";
import type { RoomType } from "@/mocks/management/rooms";

export type BedStatus = "occupied" | "vacant" | "maintenance";

export type Bed = {
  id: number;
  number: number;
  status: BedStatus;
  studentId?: number;
  studentName?: string;
};

export type RoomView = {
  id: string;
  dbId: number;
  number: string;
  floor: number;
  type: RoomType;
  capacity: number;
  status: string;
  beds: Bed[];
};

function buildRooms(rooms: DbRoom[], beds: DbBed[], allocations: DbAllocation[]): RoomView[] {
  const bedMap = new Map<number, DbBed[]>();
  for (const b of beds) {
    const list = bedMap.get(b.room_id) ?? [];
    list.push(b);
    bedMap.set(b.room_id, list);
  }

  const allocByBed = new Map<number, DbAllocation>();
  for (const a of allocations) allocByBed.set(a.bed_id, a);

  return rooms
    .sort((a, b) => a.floor - b.floor || a.room_number.localeCompare(b.room_number, undefined, { numeric: true }))
    .map((r) => {
      const roomBeds = (bedMap.get(r.id) ?? []).sort((a, b) => a.bed_number - b.bed_number);
      const bedsView: Bed[] = roomBeds.map((b) => {
        const alloc = allocByBed.get(b.id);
        let status: BedStatus = "vacant";
        if (b.is_maintenance) status = "maintenance";
        else if (alloc) status = "occupied";
        return {
          id: b.id,
          number: b.bed_number,
          status,
          studentId: alloc?.student_id,
          studentName: alloc?.students?.name,
        };
      });
      return {
        id: `${r.hostel_id}-${r.room_number}`,
        dbId: r.id,
        number: r.room_number,
        floor: r.floor,
        type: r.room_type as RoomType,
        capacity: r.capacity,
        status: r.status,
        beds: bedsView,
      };
    });
}

export function useRooms(hostelId: number) {
  const [rooms, setRooms] = useState<RoomView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRoomsData(hostelId);
      setRooms(buildRooms(data.rooms, data.beds, data.allocations));
    } catch (e) {
      setError((e as Error).message || "Could not load rooms. Please try again.");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
    const occupied = rooms.reduce(
      (s, r) => s + r.beds.filter((b) => b.status === "occupied").length,
      0
    );
    const maintenance = rooms.reduce(
      (s, r) => s + r.beds.filter((b) => b.status === "maintenance").length,
      0
    );
    const vacant = totalBeds - occupied - maintenance;
    return { totalBeds, occupied, vacant, maintenance };
  }, [rooms]);

  const assign = useCallback(
    async (studentId: number, roomNumber: string, bedNumber: number) => {
      await assignStudentToBed(studentId, hostelId, roomNumber, bedNumber);
      void logAudit({
        action: "student.assigned_bed",
        resource: "room_allocations",
        resourceId: String(studentId),
        details: `Assigned student to ${roomNumber} bed ${bedNumber}`,
      });
      await load();
    },
    [hostelId, load]
  );

  const unassign = useCallback(
    async (studentId: number) => {
      await unassignStudent(studentId);
      void logAudit({
        action: "student.unassigned_bed",
        resource: "room_allocations",
        resourceId: String(studentId),
      });
      await load();
    },
    [load]
  );

  const toggleMaintenance = useCallback(
    async (bedId: number, current: boolean) => {
      await setBedMaintenance(bedId, !current);
      await load();
    },
    [load]
  );

  const createRoom = useCallback(
    async (input: RoomInput) => {
      await addRoom(hostelId, input);
      void logAudit({ action: "room.created", resource: "rooms", details: `Added room ${input.roomNumber}` });
      await load();
    },
    [hostelId, load]
  );

  const editRoom = useCallback(
    async (roomId: number, patch: Parameters<typeof updateRoom>[1]) => {
      await updateRoom(roomId, patch);
      void logAudit({ action: "room.updated", resource: "rooms", resourceId: String(roomId) });
      await load();
    },
    [load]
  );

  const removeRoom = useCallback(
    async (roomId: number) => {
      await deleteRoom(roomId);
      void logAudit({ action: "room.deleted", resource: "rooms", resourceId: String(roomId) });
      await load();
    },
    [load]
  );

  return {
    rooms,
    stats,
    loading,
    error,
    reload: load,
    assign,
    unassign,
    toggleMaintenance,
    createRoom,
    editRoom,
    removeRoom,
  };
}