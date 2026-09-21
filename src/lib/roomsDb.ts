import { supabase } from "@/lib/supabase";
import { getRoomImage } from "@/lib/roomImages";

export type DbRoom = {
  id: number;
  hostel_id: number;
  room_number: string;
  floor: number;
  room_type: string;
  capacity: number;
  status: string;
};

export type DbBed = {
  id: number;
  room_id: number;
  bed_number: number;
  is_maintenance: boolean;
};

export type DbAllocation = {
  id: number;
  student_id: number;
  room_id: number;
  bed_id: number;
  students?: { name: string } | null;
};

export type RoomsPayload = {
  rooms: DbRoom[];
  beds: DbBed[];
  allocations: DbAllocation[];
};

export async function fetchRoomsData(hostelId: number): Promise<RoomsPayload> {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("*")
    .eq("hostel_id", hostelId);
  if (rErr) throw new Error(rErr.message);

  const roomList = (rooms ?? []) as DbRoom[];
  const roomIds = roomList.map((r) => r.id);

  let beds: DbBed[] = [];
  let allocations: DbAllocation[] = [];

  if (roomIds.length) {
    const { data: b, error: bErr } = await supabase
      .from("beds")
      .select("*")
      .in("room_id", roomIds)
      .order("bed_number", { ascending: true });
    if (bErr) throw new Error(bErr.message);
    beds = (b ?? []) as DbBed[];

    const { data: a, error: aErr } = await supabase
      .from("room_allocations")
      .select("*, students(name)")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    allocations = (a ?? []) as DbAllocation[];
  }

  return { rooms: roomList, beds, allocations };
}

export async function assignStudentToBed(
  studentId: number,
  hostelId: number,
  roomNumber: string,
  bedNumber: number,
): Promise<void> {
  const { data: room, error: rErr } = await supabase
    .from("rooms")
    .select("id, capacity")
    .eq("hostel_id", hostelId)
    .eq("room_number", roomNumber)
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!room) throw new Error("Room not found.");

  const { data: bed, error: bErr } = await supabase
    .from("beds")
    .select("id, is_maintenance")
    .eq("room_id", room.id)
    .eq("bed_number", bedNumber)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!bed) throw new Error("Bed not found.");
  if (bed.is_maintenance) throw new Error("This bed is under maintenance.");

  const { data: existing, error: eErr } = await supabase
    .from("room_allocations")
    .select("id, student_id")
    .eq("bed_id", bed.id)
    .maybeSingle();
  if (eErr) throw new Error(eErr.message);
  if (existing && existing.student_id !== studentId) {
    throw new Error("This bed is already occupied.");
  }

  const { error: delErr } = await supabase
    .from("room_allocations")
    .delete()
    .eq("student_id", studentId);
  if (delErr) throw new Error(delErr.message);

  const { error: insErr } = await supabase
    .from("room_allocations")
    .insert({ student_id: studentId, room_id: room.id, bed_id: bed.id });
  if (insErr) throw new Error(insErr.message);

  const { error: updErr } = await supabase
    .from("students")
    .update({ room: roomNumber, bed: bedNumber, hostel_id: hostelId })
    .eq("id", studentId);
  if (updErr) throw new Error(updErr.message);
}

export async function unassignStudent(studentId: number): Promise<void> {
  const { error: delErr } = await supabase
    .from("room_allocations")
    .delete()
    .eq("student_id", studentId);
  if (delErr) throw new Error(delErr.message);

  const { error: updErr } = await supabase
    .from("students")
    .update({ room: null, bed: null })
    .eq("id", studentId);
  if (updErr) throw new Error(updErr.message);
}

export async function setBedMaintenance(bedId: number, isMaintenance: boolean): Promise<void> {
  const { error } = await supabase
    .from("beds")
    .update({ is_maintenance: isMaintenance })
    .eq("id", bedId);
  if (error) throw new Error(error.message);
}

export type RoomInput = {
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  status: string;
};

export async function addRoom(hostelId: number, input: RoomInput): Promise<void> {
  const { data: room, error: rErr } = await supabase
    .from("rooms")
    .insert({
      hostel_id: hostelId,
      room_number: input.roomNumber,
      floor: input.floor,
      room_type: input.roomType,
      capacity: input.capacity,
      status: input.status,
    })
    .select("id")
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!room) throw new Error("Could not create room.");

  const bedRows = Array.from({ length: input.capacity }, (_, i) => ({
    room_id: room.id,
    bed_number: i + 1,
  }));
  const { error: bErr } = await supabase.from("beds").insert(bedRows);
  if (bErr) throw new Error(bErr.message);
}

export async function updateRoom(
  roomId: number,
  patch: {
    room_number?: string;
    floor?: number;
    room_type?: string;
    capacity?: number;
    status?: string;
  },
): Promise<void> {
  const { data: current, error: cErr } = await supabase
    .from("rooms")
    .select("capacity")
    .eq("id", roomId)
    .maybeSingle();
  if (cErr) throw new Error(cErr.message);

  const { error: uErr } = await supabase
    .from("rooms")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", roomId);
  if (uErr) throw new Error(uErr.message);

  if (patch.capacity !== undefined && current && patch.capacity > current.capacity) {
    const extra = Array.from({ length: patch.capacity - current.capacity }, (_, i) => ({
      room_id: roomId,
      bed_number: current.capacity + i + 1,
    }));
    const { error: bErr } = await supabase.from("beds").insert(extra);
    if (bErr) throw new Error(bErr.message);
  }
}

export async function deleteRoom(roomId: number): Promise<void> {
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw new Error(error.message);
}

export type HostelRef = { id: number; name: string };

export async function fetchHostels(): Promise<HostelRef[]> {
  const { data, error } = await supabase
    .from("hostels")
    .select("id, name")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as HostelRef[];
}

export type OccupancyByHostel = Record<number, { totalBeds: number; occupiedBeds: number }>;

export async function fetchOccupancy(hostelIds?: number[]): Promise<OccupancyByHostel> {
  let roomQuery = supabase.from("rooms").select("id, hostel_id, capacity");
  if (hostelIds && hostelIds.length) roomQuery = roomQuery.in("hostel_id", hostelIds);
  const { data: rooms, error: rErr } = await roomQuery;
  if (rErr) throw new Error(rErr.message);

  const roomList = (rooms ?? []) as { id: number; hostel_id: number; capacity: number }[];
  const result: OccupancyByHostel = {};
  for (const r of roomList) {
    result[r.hostel_id] = result[r.hostel_id] ?? { totalBeds: 0, occupiedBeds: 0 };
    result[r.hostel_id].totalBeds += r.capacity;
  }

  if (roomList.length) {
    const roomIds = roomList.map((r) => r.id);
    const { data: allocs, error: aErr } = await supabase
      .from("room_allocations")
      .select("room_id")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    const byRoom: Record<number, number> = {};
    for (const a of (allocs ?? []) as { room_id: number }[]) {
      byRoom[a.room_id] = (byRoom[a.room_id] ?? 0) + 1;
    }
    for (const r of roomList) {
      result[r.hostel_id].occupiedBeds += byRoom[r.id] ?? 0;
    }
  }

  return result;
}

export type PublicRoom = {
  id: number;
  hostelId: number;
  roomNumber: string;
  block: string;
  floor: number;
  roomType: string;
  capacity: number;
  occupied: number;
  maintenance: number;
  available: number;
};

export type PublicAvailability = {
  rooms: PublicRoom[];
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  availableRooms: number;
  fullRooms: number;
  floors: number;
};

// Public (anonymous) read of real rooms + beds + occupancy for the
// hostel Rooms / Availability pages. Only non-sensitive columns are fetched.
export async function fetchPublicHostelAvailability(
  hostelId: number,
): Promise<PublicAvailability> {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, hostel_id, room_number, floor, room_type, capacity, status")
    .eq("hostel_id", hostelId)
    .eq("status", "active");
  if (rErr) throw new Error(rErr.message);

  const roomList = (rooms ?? []) as {
    id: number;
    hostel_id: number;
    room_number: string;
    floor: number;
    room_type: string;
    capacity: number;
    status: string;
  }[];
  const roomIds = roomList.map((r) => r.id);

  let beds: { id: number; room_id: number; bed_number: number; is_maintenance: boolean }[] = [];
  let allocations: { room_id: number; bed_id: number }[] = [];

  if (roomIds.length) {
    const { data: b, error: bErr } = await supabase
      .from("beds")
      .select("id, room_id, bed_number, is_maintenance")
      .in("room_id", roomIds);
    if (bErr) throw new Error(bErr.message);
    beds = (b ?? []) as typeof beds;

    const { data: a, error: aErr } = await supabase
      .from("room_allocations")
      .select("room_id, bed_id")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    allocations = (a ?? []) as typeof allocations;
  }

  const occupiedBeds = new Set<number>();
  for (const a of allocations) occupiedBeds.add(a.bed_id);

  const roomsView: PublicRoom[] = roomList
    .sort(
      (a, b) =>
        a.floor - b.floor ||
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true }),
    )
    .map((r) => {
      const roomBeds = beds.filter((b) => b.room_id === r.id);
      const occupied = roomBeds.filter((b) => occupiedBeds.has(b.id)).length;
      const maintenance = roomBeds.filter((b) => b.is_maintenance).length;
      return {
        id: r.id,
        hostelId: r.hostel_id,
        roomNumber: r.room_number,
        block: r.room_number.charAt(0),
        floor: r.floor,
        roomType: r.room_type,
        capacity: r.capacity,
        occupied,
        maintenance,
        available: Math.max(0, r.capacity - occupied - maintenance),
      };
    });

  const totalBeds = roomsView.reduce((s, r) => s + r.capacity, 0);
  const occupiedCount = roomsView.reduce((s, r) => s + r.occupied, 0);
  const maintenanceBeds = roomsView.reduce((s, r) => s + r.maintenance, 0);

  return {
    rooms: roomsView,
    totalRooms: roomsView.length,
    totalBeds,
    occupiedBeds: occupiedCount,
    availableBeds: Math.max(0, totalBeds - occupiedCount - maintenanceBeds),
    maintenanceBeds,
    availableRooms: roomsView.filter((r) => r.available > 0).length,
    fullRooms: roomsView.filter((r) => r.available <= 0).length,
    floors: new Set(roomsView.map((r) => r.floor)).size,
  };
}

export type BookingBed = {
  number: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
};

export type BookingRoom = {
  label: string;
  block: string;
  floor: number;
  capacity: number;
  beds: BookingBed[];
  availableCount: number;
  image: string;
};

// Real room + bed availability for the booking flow (public/anon read).
// Returns one entry per active room, with every bed resolved to
// available / occupied / maintenance from live allocations.
export async function fetchBookingRooms(hostelId: number): Promise<BookingRoom[]> {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, room_number, floor, capacity")
    .eq("hostel_id", hostelId)
    .eq("status", "active");
  if (rErr) throw new Error(rErr.message);

  const roomList = (rooms ?? []) as {
    id: number;
    room_number: string;
    floor: number;
    capacity: number;
  }[];
  const roomIds = roomList.map((r) => r.id);

  let beds: { id: number; room_id: number; bed_number: number; is_maintenance: boolean }[] = [];
  let allocations: { room_id: number; bed_id: number }[] = [];

  if (roomIds.length) {
    const { data: b, error: bErr } = await supabase
      .from("beds")
      .select("id, room_id, bed_number, is_maintenance")
      .in("room_id", roomIds)
      .order("bed_number", { ascending: true });
    if (bErr) throw new Error(bErr.message);
    beds = (b ?? []) as typeof beds;

    const { data: a, error: aErr } = await supabase
      .from("room_allocations")
      .select("room_id, bed_id")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    allocations = (a ?? []) as typeof allocations;
  }

  const occupiedBeds = new Set(allocations.map((a) => a.bed_id));

  // Pending bookings reserve their target bed so it can't be double-booked.
  const { data: pending, error: pErr } = await supabase.rpc("pending_booking_beds", {
    p_hostel_id: hostelId,
  });
  if (pErr) throw new Error(pErr.message);
  const pendingBeds = new Set(
    ((pending ?? []) as { room_number: string; bed_number: number }[]).map(
      (p) => `${p.room_number}-${p.bed_number}`,
    ),
  );

  return roomList
    .sort(
      (a, b) =>
        a.floor - b.floor ||
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true }),
    )
    .map((r) => {
      const roomBeds = beds.filter((b) => b.room_id === r.id);
      const mapped: BookingBed[] = roomBeds.map((b) => {
        let status: BookingBed["status"] = "available";
        if (b.is_maintenance) status = "maintenance";
        else if (occupiedBeds.has(b.id)) status = "occupied";
        else if (pendingBeds.has(`${r.room_number}-${b.bed_number}`)) status = "reserved";
        return { number: b.bed_number, status };
      });
      return {
        label: r.room_number,
        block: r.room_number.charAt(0),
        floor: r.floor,
        capacity: r.capacity,
        beds: mapped,
        availableCount: mapped.filter((b) => b.status === "available").length,
        image: getRoomImage(`${hostelId}-${r.room_number}`),
      };
    });
}