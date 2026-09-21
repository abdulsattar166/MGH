// ---------------------------------------------------------------------------
// Shared room catalog — the source of truth for room structure.
//
// 5 blocks (A–E) × 10 rooms each = 50 rooms. In API mode the structure comes
// from the `rooms` table; in live (Supabase) mode it's generated deterministically.
// ---------------------------------------------------------------------------

import { api, apiMode } from "@/lib/api";
import { roomTypes, type RoomType } from "@/mocks/management/rooms";

export const ROOM_BLOCKS = [
  { block: "A", floor: 1 },
  { block: "B", floor: 2 },
  { block: "C", floor: 3 },
  { block: "D", floor: 4 },
  { block: "E", floor: 5 },
];

export const ROOMS_PER_BLOCK = 10;

export type RoomCatalogEntry = {
  label: string;
  block: string;
  floor: number;
  type: RoomType;
  capacity: number;
};

export function allRoomLabels(): string[] {
  const labels: string[] = [];
  for (const { block } of ROOM_BLOCKS) {
    for (let n = 1; n <= ROOMS_PER_BLOCK; n++) {
      labels.push(`${block}${n}`);
    }
  }
  return labels;
}

function roomIndex(label: string): number {
  const block = label[0];
  const num = Number(label.slice(1));
  const blockIndex = ROOM_BLOCKS.findIndex((b) => b.block === block);
  return blockIndex * ROOMS_PER_BLOCK + (num - 1);
}

export function roomTypeForLabel(label: string): RoomType {
  const idx = roomIndex(label) % roomTypes.length;
  return roomTypes[idx].type;
}

export function roomCapacityForLabel(label: string): number {
  const type = roomTypeForLabel(label);
  return roomTypes.find((r) => r.type === type)?.capacity ?? 3;
}

export function roomFloorForLabel(label: string): number {
  return ROOM_BLOCKS.find((b) => b.block === label[0])?.floor ?? 1;
}

// Synchronous fallback catalog (live mode).
export function buildRoomCatalog(): RoomCatalogEntry[] {
  return allRoomLabels().map((label) => ({
    label,
    block: label[0],
    floor: roomFloorForLabel(label),
    type: roomTypeForLabel(label),
    capacity: roomCapacityForLabel(label),
  }));
}

// Dual-mode loader.
export async function loadRoomCatalog(): Promise<RoomCatalogEntry[]> {
  if (apiMode) {
    return api.get<RoomCatalogEntry[]>("/public/rooms");
  }
  return buildRoomCatalog();
}