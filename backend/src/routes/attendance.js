import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/attendance
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM attendance ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/upsert  (create or update a single student/date record)
router.post("/upsert", async (req, res) => {
  try {
    const { student_id, date, check_in, check_out, status } = req.body;
    if (!student_id || !date) {
      return res.status(400).json({ error: "student_id and date are required." });
    }
    await pool.query(
      `INSERT INTO attendance (student_id, date, check_in, check_out, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         check_in = VALUES(check_in),
         check_out = VALUES(check_out),
         status = VALUES(status)`,
      [student_id, date, check_in ?? null, check_out ?? null, status ?? "present"]
    );
    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
      [student_id, date]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkout
router.post("/checkout", async (req, res) => {
  try {
    const { student_id, date, check_out, status } = req.body;
    if (!student_id || !date) {
      return res.status(400).json({ error: "student_id and date are required." });
    }
    await pool.query(
      "UPDATE attendance SET check_out = ?, status = ? WHERE student_id = ? AND date = ?",
      [check_out ?? null, status ?? "present", student_id, date]
    );
    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
      [student_id, date]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;