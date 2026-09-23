import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const FIELDS = [
  "name", "father_name", "cnic", "phone", "hostel_id", "room", "bed",
  "room_type", "university", "program", "guardian_phone", "join_date",
  "monthly_fee", "status", "image_url",
];

async function meRow(req) {
  const [rows] = await pool.query("SELECT id, name, role, hostel_id FROM users WHERE id = ?", [req.user.id]);
  return rows[0] ?? { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

// Returns true when the acting user may manage the student record.
async function mayManage(me, studentId) {
  if (me.role === "admin") return true;
  if (me.role === "warden") {
    const [rows] = await pool.query("SELECT hostel_id FROM students WHERE id = ?", [studentId]);
    return rows.length > 0 && Number(rows[0].hostel_id) === Number(me.hostel_id);
  }
  return false;
}

// GET /api/students — role-scoped (a warden only ever sees their own hostel)
router.get("/", async (req, res) => {
  try {
    const me = await meRow(req);
    const where = me.role === "warden" ? "WHERE hostel_id = ?" : "";
    const params = me.role === "warden" ? [me.hostel_id] : [];
    const [rows] = await pool.query(`SELECT * FROM students ${where} ORDER BY name ASC`, params);
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

// POST /api/students/bulk — bulk import of validated students (admin only)
router.post("/bulk", async (req, res) => {
  try {
    const me = await meRow(req);
    if (me.role !== "admin") return res.status(403).json({ error: "Only the super admin can bulk import." });
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
      r.imageUrl ?? "",
    ]);
    await pool.query(
      `INSERT INTO students
         (name, father_name, cnic, phone, hostel_id, room, bed, room_type,
          university, program, guardian_phone, join_date, monthly_fee, status, image_url)
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
    const me = await meRow(req);
    const b = req.body;
    if (me.role === "warden") {
      b.hostel_id = me.hostel_id;
    }
    const values = FIELDS.map((f) => {
      if (f === "bed") return b.bed ?? 1;
      if (f === "monthly_fee") return b.monthly_fee ?? 0;
      return b[f] ?? "";
    });
    const [result] = await pool.query(
      `INSERT INTO students (${FIELDS.join(", ")}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
    const me = await meRow(req);
    const id = Number(req.params.id);
    if (!(await mayManage(me, id))) {
      return res.status(403).json({ error: "You cannot modify students outside your hostel." });
    }
    const b = req.body;
    if (me.role === "warden") {
      b.hostel_id = me.hostel_id;
      b.status = b.status === "Left" ? "Left" : b.status;
    }
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
    const me = await meRow(req);
    const id = Number(req.params.id);
    if (!(await mayManage(me, id))) {
      return res.status(403).json({ error: "You cannot remove students outside your hostel." });
    }
    await pool.query("DELETE FROM room_allocations WHERE student_id = ?", [id]);
    await pool.query("DELETE FROM students WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;