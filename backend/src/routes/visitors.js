import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/visitors
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM visitors ORDER BY check_in DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visitors
router.post("/", async (req, res) => {
  try {
    const { hostel_id, name, cnic, visiting_student, purpose } = req.body;
    if (!hostel_id || !name) {
      return res.status(400).json({ error: "hostel_id and name are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO visitors (hostel_id, name, cnic, visiting_student, purpose, check_in)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [hostel_id, name, cnic ?? null, visiting_student ?? null, purpose ?? null]
    );
    const [rows] = await pool.query("SELECT * FROM visitors WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/visitors/:id/checkout
router.put("/:id/checkout", async (req, res) => {
  try {
    await pool.query("UPDATE visitors SET check_out = NOW() WHERE id = ?", [
      Number(req.params.id),
    ]);
    const [rows] = await pool.query("SELECT * FROM visitors WHERE id = ?", [
      Number(req.params.id),
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;