import { api, apiMode } from "@/lib/api";
import { allRoomLabels, roomCapacityForLabel } from "@/lib/roomCatalog";

export type MaintenanceBed = {
  room: string;
  bed: number;
};

function isMaintenance(label: string, bed: number): boolean {
  const last = Number(label.charAt(label.length - 1));
  return (last + bed) % 5 === 0;
}

// Synchronous fallback (live mode) — deterministic mock maintenance.
export function buildMaintenance(): MaintenanceBed[] {
  const out: MaintenanceBed[] = [];
  for (const label of allRoomLabels()) {
    const capacity = roomCapacityForLabel(label);
    for (let b = 1; b <= capacity; b++) {
      if (isMaintenance(label, b)) out.push({ room: label, bed: b });
    }
  }
  return out;
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