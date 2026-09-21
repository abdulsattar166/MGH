import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";
import type { StudentRaw, RoomRaw } from "@/lib/excel";

export type HostelRef = { id: number; name: string; code: string | null };
export type BuildingRef = { id: number; hostel_id: number; name: string };
export type BlockRef = { id: number; hostel_id: number; building_id: number; name: string };

export async function fetchHostelRefs(): Promise<HostelRef[]> {
  if (apiMode) {
    return api.get<HostelRef[]>("/hostels");
  }
  const { data, error } = await supabase
    .from("hostels")
    .select("id, name, code")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as HostelRef[];
}

export async function fetchStructureRefs(): Promise<{ buildings: BuildingRef[]; blocks: BlockRef[] }> {
  if (apiMode) {
    const [buildings, blocks] = await Promise.all([
      api.get<Array<Record<string, unknown>>>("/buildings"),
      api.get<Array<Record<string, unknown>>>("/blocks"),
    ]);
    return {
      buildings: buildings.map((b) => ({
        id: Number(b.id),
        hostel_id: Number(b.hostel_id),
        name: String(b.name),
      })),
      blocks: blocks.map((b) => ({
        id: Number(b.id),
        hostel_id: Number(b.hostel_id),
        building_id: Number(b.building_id),
        name: String(b.name),
      })),
    };
  }
  const { data: buildings, error: bErr } = await supabase
    .from("buildings")
    .select("id, hostel_id, name");
  if (bErr) throw new Error(bErr.message);

  const { data: blocks, error: kErr } = await supabase
    .from("blocks")
    .select("id, hostel_id, building_id, name");
  if (kErr) throw new Error(kErr.message);

  return {
    buildings: (buildings ?? []) as BuildingRef[],
    blocks: (blocks ?? []) as BlockRef[],
  };
}

export function resolveHostel(raw: string, hostels: HostelRef[]): HostelRef | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (/^\d+$/.test(v)) {
    const byId = hostels.find((h) => String(h.id) === v);
    if (byId) return byId;
  }
  const byCode = hostels.find((h) => h.code && h.code.toLowerCase() === v);
  if (byCode) return byCode;
  const byName = hostels.find((h) => h.name.toLowerCase() === v);
  if (byName) return byName;
  const partial = hostels.find(
    (h) => h.name.toLowerCase().includes(v) || v.includes(h.name.toLowerCase()),
  );
  return partial ?? null;
}

function normalizeStudentStatus(v: string): string {
  const s = v.trim().toLowerCase();
  if (s.includes("left") || s.includes("exit") || s.includes("withdraw")) return "Left";
  if (s.includes("notice")) return "Notice";
  return "Active";
}

function normalizeRoomStatus(v: string): string {
  const s = v.trim().toLowerCase();
  if (s.includes("inactive") || s.includes("disabled")) return "inactive";
  return "active";
}

// ---------- validated shapes ----------

export type StudentValidation = {
  rowNumber: number;
  name: string;
  fatherName: string;
  cnic: string;
  phone: string;
  hostelId: number;
  room: string;
  bed: number;
  roomType: string;
  university: string;
  program: string;
  guardianPhone: string;
  joinDate: string | null;
  monthlyFee: number;
  status: string;
  errors: string[];
};

export type RoomValidation = {
  rowNumber: number;
  hostelId: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  buildingId: number | null;
  blockId: number | null;
  status: string;
  errors: string[];
};

// ---------- validation ----------

export async function validateStudents(
  raw: StudentRaw[],
  hostels: HostelRef[],
): Promise<StudentValidation[]> {
  let existingCnics = new Set<string>();
  if (apiMode) {
    const cnics = await api.get<string[]>("/students/cnics");
    existingCnics = new Set(cnics.map((c) => c.trim().toLowerCase()).filter(Boolean));
  } else {
    const { data: existing } = await supabase.from("students").select("cnic");
    existingCnics = new Set(
      ((existing ?? []) as { cnic: string }[])
        .map((r) => (r.cnic ?? "").trim().toLowerCase())
        .filter(Boolean),
    );
  }
  const seen = new Set<string>();

  return raw.map((r) => {
    const errors: string[] = [];
    const name = r.name.trim();
    const cnic = r.cnic.trim();
    const hostel = resolveHostel(r.hostelRaw, hostels);

    if (!name) errors.push("Missing name");
    if (!hostel) errors.push(`Hostel "${r.hostelRaw}" not recognised`);

    const cnicKey = cnic.toLowerCase();
    if (cnic) {
      if (existingCnics.has(cnicKey)) errors.push(`CNIC ${cnic} already exists`);
      if (seen.has(cnicKey)) errors.push("Duplicate CNIC in file");
      seen.add(cnicKey);
    }

    return {
      rowNumber: r.rowNumber,
      name,
      fatherName: r.fatherName.trim(),
      cnic,
      phone: r.phone.trim(),
      hostelId: hostel?.id ?? 0,
      room: r.room.trim(),
      bed: r.bed ?? 1,
      roomType: r.roomType.trim() || "3-Seater Comfort",
      university: r.university.trim(),
      program: r.program.trim(),
      guardianPhone: r.guardianPhone.trim(),
      joinDate: r.joinDate,
      monthlyFee: r.monthlyFee ?? 0,
      status: normalizeStudentStatus(r.status),
      errors,
    };
  });
}

export async function validateRooms(
  raw: RoomRaw[],
  hostels: HostelRef[],
  buildings: BuildingRef[],
  blocks: BlockRef[],
): Promise<RoomValidation[]> {
  let existingKeys = new Set<string>();
  if (apiMode) {
    const rows = await api.get<Array<{ hostel_id: number; room_number: string }>>("/rooms/keys");
    existingKeys = new Set(
      rows.map((r) => `${r.hostel_id}|${String(r.room_number).trim().toLowerCase()}`),
    );
  } else {
    const { data: existing } = await supabase.from("rooms").select("hostel_id, room_number");
    existingKeys = new Set(
      ((existing ?? []) as { hostel_id: number; room_number: string }[]).map(
        (r) => `${r.hostel_id}|${r.room_number.trim().toLowerCase()}`,
      ),
    );
  }
  const seen = new Set<string>();

  return raw.map((r) => {
    const errors: string[] = [];
    const roomNumber = r.roomNumber.trim();
    const hostel = resolveHostel(r.hostelRaw, hostels);
    const floor = r.floor ?? 1;
    const capacity = r.capacity ?? 3;
    const status = normalizeRoomStatus(r.status);
    const roomType = r.roomType.trim() || "3-Seater Comfort";

    if (!roomNumber) errors.push("Missing room number");
    if (!hostel) errors.push(`Hostel "${r.hostelRaw}" not recognised`);

    let buildingId: number | null = null;
    let blockId: number | null = null;

    if (hostel) {
      if (r.buildingRaw.trim()) {
        const b = buildings.find(
          (x) =>
            x.hostel_id === hostel.id &&
            x.name.toLowerCase() === r.buildingRaw.trim().toLowerCase(),
        );
        if (b) buildingId = b.id;
        else errors.push(`Building "${r.buildingRaw}" not found`);
      }
      if (r.blockRaw.trim()) {
        const blk = blocks.find(
          (x) =>
            x.hostel_id === hostel.id &&
            (buildingId ? x.building_id === buildingId : true) &&
            x.name.toLowerCase() === r.blockRaw.trim().toLowerCase(),
        );
        if (blk) blockId = blk.id;
        else errors.push(`Block "${r.blockRaw}" not found`);
      }

      const key = `${hostel.id}|${roomNumber.toLowerCase()}`;
      if (existingKeys.has(key)) errors.push(`Room ${roomNumber} already exists`);
      if (seen.has(key)) errors.push("Duplicate room in file");
      seen.add(key);
    }

    if (capacity < 1 || capacity > 20) errors.push(`Invalid capacity ${capacity}`);
    if (floor < 1) errors.push(`Invalid floor ${floor}`);

    return {
      rowNumber: r.rowNumber,
      hostelId: hostel?.id ?? 0,
      roomNumber,
      floor,
      roomType,
      capacity,
      buildingId,
      blockId,
      status,
      errors,
    };
  });
}

// ---------- bulk insert ----------

export async function bulkInsertStudents(
  rows: StudentValidation[],
): Promise<{ inserted: number }> {
  if (!rows.length) return { inserted: 0 };
  if (apiMode) {
    return api.post<{ inserted: number }>("/students/bulk", { payload: rows });
  }
  const payload = rows.map((r) => ({
    name: r.name,
    father_name: r.fatherName || null,
    cnic: r.cnic || null,
    phone: r.phone || null,
    guardian_phone: r.guardianPhone || null,
    hostel_id: r.hostelId,
    room: r.room || null,
    bed: r.bed || null,
    room_type: r.roomType || null,
    university: r.university || null,
    program: r.program || null,
    join_date: r.joinDate,
    monthly_fee: r.monthlyFee,
    status: r.status,
  }));
  const { error } = await supabase.from("students").insert(payload);
  if (error) throw new Error(error.message);
  return { inserted: payload.length };
}

export async function bulkInsertRooms(
  rows: RoomValidation[],
): Promise<{ inserted: number; bedsCreated: number }> {
  if (!rows.length) return { inserted: 0, bedsCreated: 0 };
  if (apiMode) {
    return api.post<{ inserted: number; bedsCreated: number }>("/rooms/bulk", { payload: rows });
  }
  const payload = rows.map((r) => ({
    hostel_id: r.hostelId,
    room_number: r.roomNumber,
    floor: r.floor,
    room_type: r.roomType,
    capacity: r.capacity,
    building_id: r.buildingId,
    block_id: r.blockId,
    status: r.status,
  }));
  const { data: created, error } = await supabase
    .from("rooms")
    .insert(payload)
    .select("id, capacity");
  if (error) throw new Error(error.message);

  const rooms = (created ?? []) as { id: number; capacity: number }[];
  const bedRows = rooms.flatMap((r) =>
    Array.from({ length: r.capacity }, (_, i) => ({
      room_id: r.id,
      bed_number: i + 1,
    })),
  );
  if (bedRows.length) {
    const { error: bedErr } = await supabase.from("beds").insert(bedRows);
    if (bedErr) throw new Error(bedErr.message);
  }

  return { inserted: rooms.length, bedsCreated: bedRows.length };
}