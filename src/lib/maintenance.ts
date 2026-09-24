import { api, apiMode } from "@/lib/api";

export type MaintenanceBed = {
  room: string;
  bed: number;
};

// No fabricated maintenance: every bed starts available. Real maintenance is
// tracked in the database and loaded via loadMaintenance().
export function buildMaintenance(): MaintenanceBed[] {
  return [];
}

export async function loadMaintenance(hostelId: number): Promise<MaintenanceBed[]> {
  if (apiMode) {
    const rows = await api.get<MaintenanceBed[]>(`/maintenance?hostelId=${hostelId}`);
    return rows.map((r) => ({ room: r.room, bed: Number(r.bed) }));
  }
  return buildMaintenance();
}

export async function toggleMaintenance(
  hostelId: number,
  room: string,
  bed: number,
): Promise<void> {
  if (apiMode) {
    await api.post("/maintenance/toggle", { hostel_id: hostelId, room_label: room, bed });
    return;
  }
  // Live mode: mock maintenance is fixed — no-op.
}