// ---------------------------------------------------------------------------
// Booking data layer.
//
// Supports two backends:
//   - localStorage (default, used by the live site)
//   - REST API (the local Node/Express + MySQL backend, via /api/bookings)
//
// The async functions below (loadBookings, createBookingAsync, etc.) are the
// dual-mode entry points used by the UI. The synchronous localStorage helpers
// remain for the live-site (Supabase-era) path.
// ---------------------------------------------------------------------------

import { api, apiMode } from "@/lib/api";
import { getRoomImage } from "@/lib/roomImages";
import { buildRoomCatalog, type RoomCatalogEntry } from "@/lib/roomCatalog";
import { buildMaintenance, type MaintenanceBed } from "@/lib/maintenance";
import { fetchBookingRooms } from "@/lib/roomsDb";
import {
  approveBookingRecord,
  createBookingRecord,
  fetchBookingRecords,
  setBookingStatus,
} from "@/lib/bookingsDb";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type BedStatus = "available" | "reserved" | "occupied" | "maintenance";

export type Bed = {
  number: number;
  status: BedStatus;
};

export type RoomBeds = {
  label: string; // e.g. "A1"
  block: string; // e.g. "A"
  floor: number; // e.g. 1
  capacity: number;
  beds: Bed[];
  availableCount: number;
  image: string;
};

export type Applicant = {
  fullName: string;
  fatherName: string;
  gender: string;
  dob: string;
  mobile: string;
  whatsapp: string;
  email: string;
  cnic: string;
  cnicFront: string; // data URL
  cnicBack: string; // data URL
  district: string;
  city: string;
  tehsil: string;
  province: string;
  country: string;
  address: string;
  area: string;
  joiningDate: string;
  duration: string;
  message: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  occupation: string;
};

export type Booking = {
  id: string;
  hostelId: number;
  hostelName: string;
  roomLabel: string;
  block: string;
  floor: number;
  bedNumber: number;
  status: BookingStatus;
  createdAt: string;
  applicant: Applicant;
};

export type AvailabilitySummary = {
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  availableRooms: number;
};

export type ResidentOccupancy = {
  room: string;
  bed: number;
};

export type ReservationOccupancy = {
  room: string;
  bed: number;
  status: "pending" | "approved";
};

// Snake-case shape returned by the REST API (MySQL columns).
type BookingRow = {
  id: string;
  hostel_id: number;
  hostel_name: string;
  room_label: string;
  block: string;
  floor: number;
  bed_number: number;
  status: BookingStatus;
  created_at: string;
  applicant: Applicant;
};

export const BOOKING_BLOCKS = [
  { block: "A", floor: 1 },
  { block: "B", floor: 2 },
  { block: "C", floor: 3 },
  { block: "D", floor: 4 },
  { block: "E", floor: 5 },
];

export const ROOMS_PER_BLOCK = 10;
export const BEDS_PER_ROOM = 4;

export const DURATION_OPTIONS = ["1 Month", "3 Months", "6 Months", "1 Year", "Other"];
export const GENDER_OPTIONS = ["Male", "Female"];
export const PROVINCE_OPTIONS = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan",
];
export const RELATION_OPTIONS = ["Father", "Mother", "Brother", "Sister", "Uncle", "Friend", "Other"];

const BOOKINGS_KEY = "mubarak_bookings_v1";
const COUNTER_KEY = "mubarak_booking_counter_v1";
const CHANGE_EVENT = "mubarak-bookings-changed";

export const emptyApplicant: Applicant = {
  fullName: "",
  fatherName: "",
  gender: "",
  dob: "",
  mobile: "",
  whatsapp: "",
  email: "",
  cnic: "",
  cnicFront: "",
  cnicBack: "",
  district: "",
  city: "",
  tehsil: "",
  province: "",
  country: "Pakistan",
  address: "",
  area: "",
  joiningDate: "",
  duration: "",
  message: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  occupation: "",
};

// --- deterministic seed residents (stable across reloads, ~55% occupied) ---
function seedOccupied(hostelId: number, label: string, bedNumber: number): boolean {
  const str = `${hostelId}-${label}-${bedNumber}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % 100 < 55;
}

function seedResidents(hostelId: number): ResidentOccupancy[] {
  const residents: ResidentOccupancy[] = [];
  for (const c of buildRoomCatalog()) {
    for (let b = 1; b <= c.capacity; b++) {
      if (seedOccupied(hostelId, c.label, b)) residents.push({ room: c.label, bed: b });
    }
  }
  return residents;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full (e.g. large CNIC images) — silently no-op for the demo
  }
}

function notify(): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function mapBookingRow(r: BookingRow): Booking {
  return {
    id: r.id,
    hostelId: Number(r.hostel_id),
    hostelName: r.hostel_name,
    roomLabel: r.room_label,
    block: r.block,
    floor: Number(r.floor),
    bedNumber: Number(r.bed_number),
    status: r.status,
    createdAt: r.created_at,
    applicant: r.applicant,
  };
}

// --- bookings CRUD (sync, localStorage) ------------------------------------

export function getBookings(): Booking[] {
  return readJSON<Booking[]>(BOOKINGS_KEY, []);
}

export function getBooking(id: string): Booking | undefined {
  return getBookings().find((b) => b.id === id);
}

export function nextBookingId(): string {
  const year = new Date().getFullYear();
  const counter = readJSON<number>(COUNTER_KEY, 0) + 1;
  writeJSON(COUNTER_KEY, counter);
  return `BK-${year}-${String(counter).padStart(4, "0")}`;
}

export function createBooking(input: Omit<Booking, "id" | "createdAt" | "status">): Booking {
  const booking: Booking = {
    ...input,
    id: nextBookingId(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const all = getBookings();
  all.unshift(booking);
  writeJSON(BOOKINGS_KEY, all);
  notify();
  return booking;
}

export function updateBookingStatus(id: string, status: BookingStatus): void {
  const all = getBookings().map((b) => (b.id === id ? { ...b, status } : b));
  writeJSON(BOOKINGS_KEY, all);
  notify();
}

export function subscribeBookings(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// --- bed-level availability -------------------------------------------------

function buildRoomsFromData(
  hostelId: number,
  catalog: RoomCatalogEntry[],
  residents: ResidentOccupancy[],
  reservations: ReservationOccupancy[],
  maintenance: MaintenanceBed[],
): RoomBeds[] {
  const rooms: RoomBeds[] = [];
  for (const c of catalog) {
    const beds: Bed[] = [];

    for (let b = 1; b <= c.capacity; b++) {
      let status: BedStatus = "available";
      if (residents.some((r) => r.room === c.label && r.bed === b)) status = "occupied";
      if (maintenance.some((m) => m.room === c.label && m.bed === b)) status = "occupied";
      const res = reservations.find((r) => r.room === c.label && r.bed === b);
      if (res && status !== "occupied") status = res.status === "approved" ? "occupied" : "reserved";
      beds.push({ number: b, status });
    }

    rooms.push({
      label: c.label,
      block: c.block,
      floor: c.floor,
      capacity: c.capacity,
      beds,
      availableCount: beds.filter((bd) => bd.status === "available").length,
      image: getRoomImage(`${hostelId}-${c.label}`),
    });
  }
  return rooms;
}

function reservationsFromBookings(hostelId: number, bookings: Booking[]): ReservationOccupancy[] {
  return bookings
    .filter((b) => b.hostelId === hostelId && (b.status === "pending" || b.status === "approved"))
    .map((b) => ({ room: b.roomLabel, bed: b.bedNumber, status: b.status as "pending" | "approved" }));
}

export function getHostelRooms(hostelId: number): RoomBeds[] {
  return buildRoomsFromData(
    hostelId,
    buildRoomCatalog(),
    seedResidents(hostelId),
    reservationsFromBookings(hostelId, getBookings()),
    buildMaintenance(),
  );
}

function summarizeRooms(rooms: RoomBeds[]): AvailabilitySummary {
  const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = rooms.reduce(
    (s, r) => s + r.beds.filter((b) => b.status !== "available").length,
    0,
  );
  const available = totalBeds - occupied;
  const availableRooms = rooms.filter((r) => r.availableCount > 0).length;
  return { totalRooms: rooms.length, totalBeds, availableBeds: available, availableRooms };
}

export function hostelAvailabilitySummary(hostelId: number): AvailabilitySummary {
  return summarizeRooms(getHostelRooms(hostelId));
}

export function isRoomFull(room: RoomBeds): boolean {
  return room.availableCount === 0;
}

// --- async dual-mode entry points (used by the UI) -------------------------

export async function loadBookings(): Promise<Booking[]> {
  if (apiMode) {
    const rows = await api.get<BookingRow[]>("/bookings");
    return rows.map(mapBookingRow);
  }
  return fetchBookingRecords();
}

export async function createBookingAsync(
  input: Omit<Booking, "id" | "createdAt" | "status">,
): Promise<Booking> {
  if (apiMode) {
    const row = await api.post<BookingRow>("/public/bookings", {
      hostel_id: input.hostelId,
      hostel_name: input.hostelName,
      room_label: input.roomLabel,
      block: input.block,
      floor: input.floor,
      bed_number: input.bedNumber,
      applicant: input.applicant,
    });
    const booking = mapBookingRow(row);
    notify();
    return booking;
  }
  return createBookingRecord(input);
}

export async function updateBookingStatusAsync(id: string, status: BookingStatus): Promise<void> {
  if (apiMode) {
    await api.put(`/bookings/${id}/status`, { status });
    notify();
    return;
  }
  if (status === "approved") {
    await approveBookingRecord(id);
  } else {
    await setBookingStatus(id, status);
  }
}

export async function loadHostelRooms(hostelId: number): Promise<RoomBeds[]> {
  if (apiMode) {
    const rows = await api.get<
      Array<{
        label: string;
        block: string;
        floor: number;
        capacity: number;
        beds: Bed[];
        availableCount: number;
      }>
    >(`/rooms/booking-rooms?hostelId=${hostelId}`);
    return rows.map((r) => ({
      label: r.label,
      block: r.block,
      floor: r.floor,
      capacity: r.capacity,
      beds: r.beds,
      availableCount: r.availableCount,
      image: getRoomImage(`${hostelId}-${r.label}`),
    }));
  }
  const rooms = await fetchBookingRooms(hostelId);
  return rooms as RoomBeds[];
}

export async function loadAvailabilitySummaries(
  hostelIds: number[],
): Promise<Record<number, AvailabilitySummary>> {
  if (apiMode) {
    const result: Record<number, AvailabilitySummary> = {};
    const perHostel = await Promise.all(
      hostelIds.map(async (id) => {
        const data = await api.get<{
          totalRooms: number;
          totalBeds: number;
          availableBeds: number;
          availableRooms: number;
        }>(`/rooms/public-availability/${id}`);
        return {
          id,
          summary: {
            totalRooms: Number(data.totalRooms),
            totalBeds: Number(data.totalBeds),
            availableBeds: Number(data.availableBeds),
            availableRooms: Number(data.availableRooms),
          },
        };
      }),
    );
    for (const { id, summary } of perHostel) result[id] = summary;
    return result;
  }
  const result: Record<number, AvailabilitySummary> = {};
  for (const id of hostelIds) {
    const rooms = await fetchBookingRooms(id);
    const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
    const availableBeds = rooms.reduce((s, r) => s + r.availableCount, 0);
    const availableRooms = rooms.filter((r) => r.availableCount > 0).length;
    result[id] = { totalRooms: rooms.length, totalBeds, availableBeds, availableRooms };
  }
  return result;
}