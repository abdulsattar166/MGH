import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type Hostel = {
  id: number;
  name: string;
  gender: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  image: string | null;
  rooms: number;
  floors: number;
  beds: number;
  available: number;
  facilities: string[];
  code: string | null;
  description: string | null;
  status: string;
};

type HostelRow = {
  id: number;
  name: string;
  gender: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  facilities: string[] | null;
  code: string | null;
  description: string | null;
  status: string;
};

type RoomRow = { id: number; hostel_id: number; floor: number; capacity: number };

const HOSTEL_COLS =
  "id, name, gender, location, address, phone, email, image_url, facilities, code, description, status";

/**
 * Load every hostel with live room/bed/occupancy figures derived from the
 * rooms, beds and room_allocations tables (never hardcoded).
 */
export async function fetchHostelsFull(): Promise<Hostel[]> {
  if (apiMode) {
    const rows = await api.get<Array<Record<string, unknown>>>("/hostels/full");
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      gender: String(r.gender ?? "boys"),
      location: (r.location as string | null) ?? null,
      address: (r.address as string | null) ?? null,
      phone: (r.phone as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      image: (r.image as string | null) ?? null,
      rooms: Number(r.rooms ?? 0),
      floors: Number(r.floors ?? 0),
      beds: Number(r.beds ?? 0),
      available: Number(r.available ?? 0),
      facilities: Array.isArray(r.facilities) ? (r.facilities as string[]) : [],
      code: (r.code as string | null) ?? null,
      description: (r.description as string | null) ?? null,
      status: String(r.status ?? "active"),
    }));
  }
  const { data: hostels, error: hErr } = await supabase
    .from("hostels")
    .select(HOSTEL_COLS)
    .order("id", { ascending: true });
  if (hErr) throw new Error(hErr.message);
  const hostelList = (hostels ?? []) as HostelRow[];

  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, hostel_id, floor, capacity");
  if (rErr) throw new Error(rErr.message);
  const roomList = (rooms ?? []) as RoomRow[];

  const occupiedByRoom: Record<number, number> = {};
  if (roomList.length) {
    const roomIds = roomList.map((r) => r.id);
    const { data: allocs, error: aErr } = await supabase
      .from("room_allocations")
      .select("room_id")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    for (const a of (allocs ?? []) as { room_id: number }[]) {
      occupiedByRoom[a.room_id] = (occupiedByRoom[a.room_id] ?? 0) + 1;
    }
  }

  const agg: Record<number, { rooms: number; floors: Set<number>; beds: number; occupied: number }> = {};
  for (const r of roomList) {
    const a = agg[r.hostel_id] ?? (agg[r.hostel_id] = { rooms: 0, floors: new Set(), beds: 0, occupied: 0 });
    a.rooms += 1;
    a.floors.add(r.floor);
    a.beds += r.capacity;
    a.occupied += occupiedByRoom[r.id] ?? 0;
  }

  return hostelList.map((h) => {
    const a = agg[h.id];
    const beds = a?.beds ?? 0;
    const occupied = a?.occupied ?? 0;
    return {
      id: h.id,
      name: h.name,
      gender: h.gender,
      location: h.location,
      address: h.address,
      phone: h.phone,
      email: h.email,
      image: h.image_url,
      rooms: a?.rooms ?? 0,
      floors: a?.floors.size ?? 0,
      beds,
      available: Math.max(0, beds - occupied),
      facilities: h.facilities ?? [],
      code: h.code,
      description: h.description,
      status: h.status,
    };
  });
}

export type HostelInput = {
  name: string;
  gender: string;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  code?: string | null;
  description?: string | null;
  status: string;
  imageUrl?: string | null;
  facilities: string[];
};

export async function createHostel(input: HostelInput): Promise<void> {
  if (apiMode) {
    await api.post("/hostels", input);
    return;
  }
  const { error } = await supabase.from("hostels").insert({
    name: input.name,
    gender: input.gender,
    location: input.location ?? null,
    address: input.address ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    rooms: 0,
    beds: 0,
    code: input.code ?? null,
    description: input.description ?? null,
    status: input.status,
    image_url: input.imageUrl ?? null,
    facilities: input.facilities,
  });
  if (error) throw new Error(error.message);
}

export async function updateHostel(id: number, input: Partial<HostelInput>): Promise<void> {
  if (apiMode) {
    await api.put(`/hostels/${id}`, input);
    return;
  }
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.gender !== undefined) patch.gender = input.gender;
  if (input.location !== undefined) patch.location = input.location;
  if (input.address !== undefined) patch.address = input.address;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = input.email;
  if (input.code !== undefined) patch.code = input.code;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.facilities !== undefined) patch.facilities = input.facilities;

  const { error } = await supabase.from("hostels").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHostel(id: number): Promise<void> {
  if (apiMode) {
    await api.del(`/hostels/${id}`);
    return;
  }
  const { error } = await supabase.from("hostels").delete().eq("id", id);
  if (error) throw new Error(error.message);
}