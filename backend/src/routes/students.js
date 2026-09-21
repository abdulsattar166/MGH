import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const FIELDS = [
  "name", "father_name", "cnic", "phone", "hostel_id", "room", "bed",
  "room_type", "university", "program", "guardian_phone", "join_date",
  "monthly_fee", "status",
];

// GET /api/students
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/cnics — existing CNICs (used by the import validator)
router.get("/cnics", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT cnic FROM students");
    res.json(rows.map((r) => String(r.cnic ?? "").trim().toLowerCase()).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/bulk — bulk import of validated students
router.post("/bulk", async (req, res) => {
  try {
    const rows = Array.isArray(req.body.payload) ? req.body.payload : [];
    if (!rows.length) return res.json({ inserted: 0 });
    const values = rows.map((r) => [
      r.name || "",
      r.fatherName || "",
      r.cnic || "",
      r.phone || "",
      r.hostelId || 1,
      r.room || "",
      r.bed ?? 1,
      r.roomType || "",
      r.university || "",
      r.program || "",
      r.guardianPhone || "",
      r.joinDate ?? "",
      r.monthlyFee ?? 0,
      r.status || "Active",
    ]);
    await pool.query(
      `INSERT INTO students
         (name, father_name, cnic, phone, hostel_id, room, bed, room_type,
          university, program, guardian_phone, join_date, monthly_fee, status)
       VALUES ?`,
      [values]
    );
    res.json({ inserted: values.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students
router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const values = FIELDS.map((f) => {
      if (f === "bed") return b.bed ?? 1;
      if (f === "monthly_fee") return b.monthly_fee ?? 0;
      return b[f] ?? "";
    });
    const [result] = await pool.query(
      `INSERT INTO students (${FIELDS.join(", ")}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      values
    );
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const values = FIELDS.map((f) => {
      if (f === "bed") return b.bed ?? 1;
      if (f === "monthly_fee") return b.monthly_fee ?? 0;
      return b[f] ?? "";
    });
    await pool.query(
      `UPDATE students SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
      [...values, id]
    );
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM students WHERE id = ?", [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;