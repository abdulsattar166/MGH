import { Router } from "express";
import { pool } from "../db.js";

// Public endpoints — no authentication required (used by the public website).
const router = Router();

async function nextBookingId() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    "SELECT MAX(id) AS last FROM bookings WHERE id LIKE ?",
    [`MGH-${year}-%`]
  );
  const last = rows[0]?.last;
  const next = last ? Number(String(last).split("-")[2]) + 1 : 1;
  return `MGH-${year}-${String(next).padStart(6, "0")}`;
}

function parseApplicant(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value ?? {};
}

// GET /api/public/rooms — the room catalog
router.get("/rooms", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT label, block, floor, room_type, capacity FROM rooms ORDER BY id"
    );
    res.json(
      rows.map((r) => ({
        label: r.label,
        block: r.block,
        floor: r.floor,
        type: r.room_type,
        capacity: r.capacity,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/availability/:hostelId
// Returns room catalog + real resident occupancy + reservations + maintenance.
router.get("/availability/:hostelId", async (req, res) => {
  try {
    const hostelId = Number(req.params.hostelId);

    const [rooms] = await pool.query(
      "SELECT label, block, floor, room_type, capacity FROM rooms ORDER BY id"
    );
    const [students] = await pool.query(
      "SELECT room, bed FROM students WHERE hostel_id = ? AND status != 'Left'",
      [hostelId]
    );
    const [bookings] = await pool.query(
      "SELECT room_label, bed_number, status FROM bookings WHERE hostel_id = ? AND status IN ('pending','approved')",
      [hostelId]
    );
    const [maint] = await pool.query(
      "SELECT room_label, bed FROM maintenance WHERE hostel_id = ?",
      [hostelId]
    );

    res.json({
      rooms: rooms.map((r) => ({
        label: r.label,
        block: r.block,
        floor: r.floor,
        type: r.room_type,
        capacity: r.capacity,
      })),
      occupied: students.map((s) => ({ room: s.room, bed: Number(s.bed) })),
      reserved: bookings.map((b) => ({
        room: b.room_label,
        bed: Number(b.bed_number),
        status: b.status,
      })),
      maintenance: maint.map((m) => ({ room: m.room_label, bed: Number(m.bed) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/wardens — public warden directory (no auth required)
router.get("/wardens", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, avatar_url, position, hostel_id
       FROM users
       WHERE role = 'warden' AND is_active = 1
       ORDER BY name ASC`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        phone: r.phone,
        hostelId: r.hostel_id != null ? Number(r.hostel_id) : null,
        avatarUrl: r.avatar_url,
        position: r.position ?? "Warden",
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/track/:reference — safe (anon) booking status lookup
router.get("/track/:reference", async (req, res) => {
  try {
    const reference = String(req.params.reference ?? "").trim().toUpperCase();
    if (!reference) return res.status(400).json({ error: "Booking reference is required." });
    const [rows] = await pool.query(
      "SELECT id, hostel_name, room_label, floor, bed_number, status, fee_amount, approved_by, approved_at, rejected_by, rejected_at, reason, tracking, created_at FROM bookings WHERE id = ?",
      [reference]
    );
    if (!rows.length) return res.json(null);
    const r = rows[0];

    function parseTracking(value) {
      if (value == null || value === "") return [];
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return Array.isArray(value) ? value : [];
    }

    res.json({
      reference: r.id,
      hostel_name: r.hostel_name,
      room_number: r.room_label,
      floor: Number(r.floor),
      bed_number: Number(r.bed_number),
      status: r.status,
      fee_amount: Number(r.fee_amount ?? 0),
      approved_by: r.approved_by ?? null,
      approved_at: r.approved_at ?? null,
      rejected_by: r.rejected_by ?? null,
      rejected_at: r.rejected_at ?? null,
      reason: r.reason ?? null,
      tracking: parseTracking(r.tracking),
      created_at: r.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/bookings
router.post("/bookings", async (req, res) => {
  try {
    const { hostel_id, hostel_name, room_label, block, floor, bed_number, applicant } = req.body;
    if (!hostel_id || !room_label) {
      return res.status(400).json({ error: "hostel_id and room_label are required." });
    }

    // Prevent overbooking: the target bed must still be free.
    const [roomRows] = await pool.query(
      "SELECT id FROM hostel_rooms WHERE hostel_id = ? AND room_number = ? LIMIT 1",
      [hostel_id, room_label]
    );
    if (!roomRows.length) {
      return res.status(400).json({ error: `Room ${room_label} is no longer available in this hostel.` });
    }
    const [bedRows] = await pool.query(
      "SELECT id FROM hostel_beds WHERE room_id = ? AND bed_number = ? LIMIT 1",
      [roomRows[0].id, Number(bed_number ?? 1)]
    );
    if (!bedRows.length) {
      return res.status(400).json({ error: `Bed ${bed_number} does not exist in room ${room_label}.` });
    }
    if (bedRows[0].is_maintenance) {
      return res.status(400).json({ error: `Bed ${bed_number} is under maintenance and cannot be booked right now.` });
    }
    const [allocs] = await pool.query(
      "SELECT id FROM room_allocations WHERE bed_id = ? LIMIT 1",
      [bedRows[0].id]
    );
    if (allocs.length) {
      return res.status(400).json({ error: `Bed ${bed_number} in room ${room_label} has just become occupied. Please pick another bed.` });
    }
    const [existingPending] = await pool.query(
      "SELECT id FROM bookings WHERE hostel_id = ? AND room_label = ? AND bed_number = ? AND status IN ('pending','under_review') LIMIT 1",
      [hostel_id, room_label, Number(bed_number ?? 1)]
    );
    if (existingPending.length) {
      return res.status(400).json({ error: `Bed ${bed_number} in room ${room_label} is already reserved. Please pick another bed.` });
    }

    // Find the hostel warden so the booking is routed to them automatically.
    const [wardens] = await pool.query(
      "SELECT id FROM users WHERE role = 'warden' AND hostel_id = ? AND is_active = 1 LIMIT 1",
      [hostel_id]
    );

    const id = await nextBookingId();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO bookings
         (id, hostel_id, hostel_name, room_label, block, floor, bed_number, status,
          applicant, warden_id, fee_amount, tracking)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 18000, ?)`,
      [
        id,
        hostel_id,
        hostel_name ?? "",
        room_label,
        block ?? "",
        floor ?? 1,
        Number(bed_number ?? 1),
        JSON.stringify(applicant ?? {}),
        wardens[0] ? Number(wardens[0].id) : null,
        JSON.stringify([{ status: "pending", at: now, by: null }]),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    res.status(201).json({ ...rows[0], applicant: parseApplicant(rows[0].applicant) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;