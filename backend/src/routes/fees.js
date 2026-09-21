import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/fees?month=YYYY-MM
router.get("/", async (req, res) => {
  try {
    const month = req.query.month;
    const [rows] = month
      ? await pool.query("SELECT * FROM fees WHERE month = ?", [month])
      : await pool.query("SELECT * FROM fees");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/upsert  (creates or updates a single student/month record)
router.post("/upsert", async (req, res) => {
  try {
    const { student_id, month, amount, paid, paid_at, method } = req.body;
    if (!student_id || !month) {
      return res.status(400).json({ error: "student_id and month are required." });
    }
    await pool.query(
      `INSERT INTO fees (student_id, month, amount, paid, paid_at, method)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount),
         paid = VALUES(paid),
         paid_at = VALUES(paid_at),
         method = VALUES(method)`,
      [student_id, month, amount ?? 0, paid ? 1 : 0, paid_at ?? null, method ?? null]
    );
    const [rows] = await pool.query(
      "SELECT * FROM fees WHERE student_id = ? AND month = ?",
      [student_id, month]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;