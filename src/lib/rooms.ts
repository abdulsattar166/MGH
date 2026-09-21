import { getRoomImage } from "@/lib/roomImages";

export type RoomStatus = "available" | "occupied" | "maintenance";

export type Room = {
  id: string;
  hostelId: number;
  block: string;
  number: number;
  label: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  image: string;
};

export const ROOM_BLOCKS = [
  { block: "A", floor: 1 },
  { block: "B", floor: 2 },
  { block: "C", floor: 3 },
  { block: "D", floor: 4 },
  { block: "E", floor: 5 },
];

export const ROOMS_PER_BLOCK = 10;
export const ROOM_CAPACITY = 3;

const MAINTENANCE_LABELS = ["B9", "D4"];

export function generateRooms(hostelId: number, occupiedCount: number): Room[] {
  const rooms: Room[] = [];
  let occupiedSoFar = 0;

  for (const { block, floor } of ROOM_BLOCKS) {
    for (let n = 1; n <= ROOMS_PER_BLOCK; n++) {
      const label = `${block}${n}`;

      let status: RoomStatus = "available";
      if (MAINTENANCE_LABELS.includes(label)) {
        status = "maintenance";
      } else if (occupiedSoFar < occupiedCount) {
        status = "occupied";
        occupiedSoFar++;
      }

      rooms.push({
        id: `${hostelId}-${label}`,
        hostelId,
        block,
        number: n,
        label,
        floor,
        capacity: ROOM_CAPACITY,
        status,
        image: getRoomImage(`${hostelId}-${label}`),
      });
    }
  }

  return rooms;
}

export function roomsSummary(rooms: Room[]) {
  const total = rooms.length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const available = rooms.filter((r) => r.status === "available").length;
  const maintenance = rooms.filter((r) => r.status === "maintenance").length;
  return { total, occupied, available, maintenance };
}