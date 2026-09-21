import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type Building = {
  id: number;
  hostelId: number;
  name: string;
  description: string | null;
  status: string;
  blocks: number;
  floors: number;
  rooms: number;
  beds: number;
  occupied: number;
};

export type Block = {
  id: number;
  hostelId: number;
  buildingId: number;
  name: string;
  status: string;
  floors: number;
  rooms: number;
  beds: number;
  occupied: number;
};

type RoomRow = {
  id: number;
  building_id: number | null;
  block_id: number | null;
  floor: number;
  capacity: number;
};

type RoomStats = {
  rooms: RoomRow[];
  occupiedByRoom: Record<number, number>;
};

/**
 * Load the room capacity + occupancy once, then derive building/block stats
 * from it. Floors are the distinct `floor` values on the rooms (there is no
 * separate floors table by design — a floor is an attribute of a room).
 */
async function fetchRoomStats(): Promise<RoomStats> {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, building_id, block_id, floor, capacity");
  if (rErr) throw new Error(rErr.message);
  const roomList = (rooms ?? []) as RoomRow[];

  const occupiedByRoom: Record<number, number> = {};
  const roomIds = roomList.map((r) => r.id);
  if (roomIds.length) {
    const { data: allocs, error: aErr } = await supabase
      .from("room_allocations")
      .select("room_id")
      .in("room_id", roomIds);
    if (aErr) throw new Error(aErr.message);
    for (const a of (allocs ?? []) as { room_id: number }[]) {
      occupiedByRoom[a.room_id] = (occupiedByRoom[a.room_id] ?? 0) + 1;
    }
  }

  return { rooms: roomList, occupiedByRoom };
}

export async function fetchBuildings(hostelId?: number): Promise<Building[]> {
  if (apiMode) {
    const rows = await api.get<
      Array<{
        id: number;
        hostel_id: number;
        name: string;
        description: string | null;
        status: string;
        blocks: number;
        floors: number;
        rooms: number;
        beds: number;
        occupied: number;
      }>
    >(`/buildings${hostelId ? `?hostelId=${hostelId}` : ""}`);
    return rows.map((b) => ({
      id: Number(b.id),
      hostelId: Number(b.hostel_id),
      name: b.name,
      description: b.description,
      status: b.status,
      blocks: Number(b.blocks),
      floors: Number(b.floors),
      rooms: Number(b.rooms),
      beds: Number(b.beds),
      occupied: Number(b.occupied),
    }));
  }
  let q = supabase.from("buildings").select("*").order("name", { ascending: true });
  if (hostelId) q = q.eq("hostel_id", hostelId);
  const { data: buildings, error: bErr } = await q;
  if (bErr) throw new Error(bErr.message);
  const buildingList = (buildings ?? []) as {
    id: number;
    hostel_id: number;
    name: string;
    description: string | null;
    status: string;
  }[];

  const { data: blocks, error: blErr } = await supabase
    .from("blocks")
    .select("id, building_id");
  if (blErr) throw new Error(blErr.message);
  const blockList = (blocks ?? []) as { id: number; building_id: number }[];

  const { rooms: roomList, occupiedByRoom } = await fetchRoomStats();

  const blocksByBuilding: Record<number, number> = {};
  for (const b of blockList) {
    blocksByBuilding[b.building_id] = (blocksByBuilding[b.building_id] ?? 0) + 1;
  }

  return buildingList.map((b) => {
    const buildingRooms = roomList.filter((r) => r.building_id === b.id);
    const floors = new Set(buildingRooms.map((r) => r.floor)).size;
    const beds = buildingRooms.reduce((s, r) => s + r.capacity, 0);
    const occupied = buildingRooms.reduce((s, r) => s + (occupiedByRoom[r.id] ?? 0), 0);
    return {
      id: b.id,
      hostelId: b.hostel_id,
      name: b.name,
      description: b.description,
      status: b.status,
      blocks: blocksByBuilding[b.id] ?? 0,
      floors,
      rooms: buildingRooms.length,
      beds,
      occupied,
    };
  });
}

export async function fetchBlocks(buildingId?: number): Promise<Block[]> {
  if (apiMode) {
    const rows = await api.get<
      Array<{
        id: number;
        hostel_id: number;
        building_id: number;
        name: string;
        status: string;
        floors: number;
        rooms: number;
        beds: number;
        occupied: number;
      }>
    >(`/blocks${buildingId ? `?buildingId=${buildingId}` : ""}`);
    return rows.map((b) => ({
      id: Number(b.id),
      hostelId: Number(b.hostel_id),
      buildingId: Number(b.building_id),
      name: b.name,
      status: b.status,
      floors: Number(b.floors),
      rooms: Number(b.rooms),
      beds: Number(b.beds),
      occupied: Number(b.occupied),
    }));
  }
  let q = supabase.from("blocks").select("*").order("name", { ascending: true });
  if (buildingId) q = q.eq("building_id", buildingId);
  const { data: blocks, error: bErr } = await q;
  if (bErr) throw new Error(bErr.message);
  const blockList = (blocks ?? []) as {
    id: number;
    hostel_id: number;
    building_id: number;
    name: string;
    status: string;
  }[];

  const { rooms: roomList, occupiedByRoom } = await fetchRoomStats();

  return blockList.map((b) => {
    const blockRooms = roomList.filter((r) => r.block_id === b.id);
    const floors = new Set(blockRooms.map((r) => r.floor)).size;
    const beds = blockRooms.reduce((s, r) => s + r.capacity, 0);
    const occupied = blockRooms.reduce((s, r) => s + (occupiedByRoom[r.id] ?? 0), 0);
    return {
      id: b.id,
      hostelId: b.hostel_id,
      buildingId: b.building_id,
      name: b.name,
      status: b.status,
      floors,
      rooms: blockRooms.length,
      beds,
      occupied,
    };
  });
}

export async function createBuilding(input: {
  hostelId: number;
  name: string;
  description?: string | null;
  status: string;
}): Promise<void> {
  if (apiMode) {
    await api.post("/buildings", { ...input });
    return;
  }
  const { error } = await supabase.from("buildings").insert({
    hostel_id: input.hostelId,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function updateBuilding(
  id: number,
  patch: { name?: string; description?: string | null; status?: string; hostelId?: number },
): Promise<void> {
  if (apiMode) {
    await api.put(`/buildings/${id}`, patch);
    return;
  }
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.hostelId !== undefined) payload.hostel_id = patch.hostelId;

  const { error } = await supabase.from("buildings").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBuilding(id: number): Promise<void> {
  if (apiMode) {
    await api.del(`/buildings/${id}`);
    return;
  }
  const { error } = await supabase.from("buildings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createBlock(input: {
  hostelId: number;
  buildingId: number;
  name: string;
  status: string;
}): Promise<void> {
  if (apiMode) {
    await api.post("/blocks", { ...input });
    return;
  }
  const { error } = await supabase.from("blocks").insert({
    hostel_id: input.hostelId,
    building_id: input.buildingId,
    name: input.name,
    status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function updateBlock(
  id: number,
  patch: { name?: string; status?: string; buildingId?: number; hostelId?: number },
): Promise<void> {
  if (apiMode) {
    await api.put(`/blocks/${id}`, patch);
    return;
  }
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.buildingId !== undefined) payload.building_id = patch.buildingId;
  if (patch.hostelId !== undefined) payload.hostel_id = patch.hostelId;

  const { error } = await supabase.from("blocks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBlock(id: number): Promise<void> {
  if (apiMode) {
    await api.del(`/blocks/${id}`);
    return;
  }
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}