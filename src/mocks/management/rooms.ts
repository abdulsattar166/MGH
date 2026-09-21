export type RoomType = "2-Seater Deluxe" | "3-Seater Comfort" | "4-Seater Standard" | "5-Seater Economy";

export const roomTypes: { type: RoomType; capacity: number }[] = [
  { type: "2-Seater Deluxe", capacity: 2 },
  { type: "3-Seater Comfort", capacity: 3 },
  { type: "4-Seater Standard", capacity: 4 },
  { type: "5-Seater Economy", capacity: 5 },
];

export const roomTypeCapacity: Record<RoomType, number> = {
  "2-Seater Deluxe": 2,
  "3-Seater Comfort": 3,
  "4-Seater Standard": 4,
  "5-Seater Economy": 5,
};

export const floors = [1, 2, 3, 4, 5];

export const roomsPerFloor = 3;