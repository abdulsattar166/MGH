// ---------------------------------------------------------------------------
// Supabase-backed bookings data layer.
//
// Replaces the old localStorage booking store with the real `bookings` table.
// The public booking page inserts pending rows anonymously; the admin/warden
// page reads and updates them (approve/reject) under row-level security.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";
import type { Applicant, Booking, BookingStatus } from "@/lib/booking";

type BookingRow = {
  id: number;
  reference: string;
  hostel_id: number;
  hostel_name: string;
  room_number: string;
  floor: number;
  bed_number: number;
  status: BookingStatus;
  applicant: Applicant;
  created_at: string;
};

function mapRow(r: BookingRow): Booking {
  return {
    id: r.reference,
    hostelId: r.hostel_id,
    hostelName: r.hostel_name,
    roomLabel: r.room_number,
    block: r.room_number.charAt(0),
    floor: r.floor,
    bedNumber: r.bed_number,
    status: r.status,
    createdAt: r.created_at,
    applicant: r.applicant,
  };
}

export type CreateBookingInput = {
  hostelId: number;
  hostelName: string;
  roomLabel: string;
  block: string;
  floor: number;
  bedNumber: number;
  applicant: Applicant;
};

// Converts a data-URL (from the file picker) into a Blob for Storage upload.
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Uploads a CNIC image to Storage and returns its public URL. Values that are
// already remote URLs (or empty) are returned unchanged.
async function uploadCnicImage(dataUrl: string, side: "front" | "back"): Promise<string> {
  if (!dataUrl) return "";
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const blob = dataUrlToBlob(dataUrl);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `cnic-${side}-${unique}.${ext}`;

  const { error } = await supabase.storage.from("cnic").upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw new Error(`Could not upload your ${side} CNIC image: ${error.message}`);

  const { data: urlData } = supabase.storage.from("cnic").getPublicUrl(path);
  return urlData.publicUrl;
}

export async function createBookingRecord(input: CreateBookingInput): Promise<Booking> {
  const applicant: Applicant = { ...input.applicant };
  applicant.cnicFront = await uploadCnicImage(applicant.cnicFront, "front");
  applicant.cnicBack = await uploadCnicImage(applicant.cnicBack, "back");

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      hostel_id: input.hostelId,
      hostel_name: input.hostelName,
      room_number: input.roomLabel,
      floor: input.floor,
      bed_number: input.bedNumber,
      status: "pending",
      applicant,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not create your booking. Please try again.");
  return mapRow(data as BookingRow);
}

export async function fetchBookingRecords(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BookingRow[]).map(mapRow);
}

export async function setBookingStatus(reference: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("reference", reference);
  if (error) throw new Error(error.message);
}

export async function approveBookingRecord(reference: string): Promise<void> {
  const { data, error } = await supabase.rpc("approve_booking", { p_reference: reference });
  if (error) throw new Error(error.message);
  const result = data as { ok?: boolean } | null;
  if (!result || result.ok !== true) {
    throw new Error("Could not approve this booking.");
  }
}

export type BookingStatusView = {
  reference: string;
  hostel_name: string;
  room_number: string;
  floor: number;
  bed_number: number;
  status: BookingStatus;
  created_at: string;
};

// Public lookup of a booking's approval status by its reference. Returns only
// safe columns (no applicant details) — safe for anonymous use.
export async function fetchBookingByReference(
  reference: string,
): Promise<BookingStatusView | null> {
  if (apiMode) {
    return api.get<BookingStatusView | null>(`/public/track/${encodeURIComponent(reference)}`);
  }
  const { data, error } = await supabase.rpc("track_booking", { p_reference: reference });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as BookingStatusView[];
  if (rows.length === 0) return null;
  return rows[0];
}