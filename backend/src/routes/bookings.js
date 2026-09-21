import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Generate a sequential booking id like BK-2026-0001
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

// GET /api/bookings
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
    res.json(rows.map((r) => ({ ...r, applicant: parseApplicant(r.applicant) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
router.post("/", async (req, res) => {
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

// PUT /api/bookings/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    res.json({ ...rows[0], applicant: parseApplicant(rows[0].applicant) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;