import { Router } from "express";
import { pool } from "../db.js";

// Public endpoints — no authentication required (used by the public website).
const router = Router();

async function nextBookingId() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    "SELECT id FROM bookings WHERE id LIKE ? ORDER BY id DESC LIMIT 1",
    [`BK-${year}-%`]
  );
  const last = rows[0]?.id;
  const next = last ? Number(String(last).split("-")[2]) + 1 : 1;
  return `BK-${year}-${String(next).padStart(4, "0")}`;
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

// POST /api/public/bookings
router.post("/bookings", async (req, res) => {
  try {
    const { hostel_id, hostel_name, room_label, block, floor, bed_number, applicant } = req.body;
    if (!hostel_id || !room_label) {
      return res.status(400).json({ error: "hostel_id and room_label are required." });
    }

    const id = await nextBookingId();
    await pool.query(
      `INSERT INTO bookings
         (id, hostel_id, hostel_name, room_label, block, floor, bed_number, status, applicant)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        hostel_id,
        hostel_name ?? "",
        room_label,
        block ?? "",
        floor ?? 1,
        bed_number ?? 1,
        JSON.stringify(applicant ?? {}),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    res.status(201).json({ ...rows[0], applicant: parseApplicant(rows[0].applicant) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;