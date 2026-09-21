import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/maintenance?hostelId=N
router.get("/", async (req, res) => {
  try {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : null;
    const [rows] = hostelId
      ? await pool.query(
          "SELECT id, hostel_id, room_label, bed FROM maintenance WHERE hostel_id = ? ORDER BY room_label, bed",
          [hostelId]
        )
      : await pool.query(
          "SELECT id, hostel_id, room_label, bed FROM maintenance ORDER BY hostel_id, room_label, bed"
        );
    res.json(
      rows.map((r) => ({
        id: Number(r.id),
        hostelId: Number(r.hostel_id),
        room: r.room_label,
        bed: Number(r.bed),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance/toggle — mark/unmark a bed as under maintenance
router.post("/toggle", async (req, res) => {
  try {
    const { hostel_id, room_label, bed } = req.body;
    if (!hostel_id || !room_label || !bed) {
      return res.status(400).json({ error: "hostel_id, room_label and bed are required." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM maintenance WHERE hostel_id = ? AND room_label = ? AND bed = ?",
      [hostel_id, room_label, bed]
    );

    if (existing.length) {
      await pool.query("DELETE FROM maintenance WHERE id = ?", [existing[0].id]);
      res.json({ ok: true, toggled: "off" });
    } else {
      await pool.query(
        "INSERT INTO maintenance (hostel_id, room_label, bed) VALUES (?, ?, ?)",
        [hostel_id, room_label, bed]
      );
      res.json({ ok: true, toggled: "on" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;