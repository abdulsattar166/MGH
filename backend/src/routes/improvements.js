import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, notifyRole } from "../notify.js";

const router = Router();

const VALID_STATUS = ["Submitted", "Reviewing", "Accepted", "Implemented", "Rejected"];

function mapRow(r) {
  return {
    id: Number(r.id),
    code: r.code,
    studentName: r.student_name,
    hostelId: r.hostel_id != null ? Number(r.hostel_id) : null,
    wardenId: r.warden_id != null ? Number(r.warden_id) : null,
    category: r.category,
    subject: r.subject,
    description: r.description,
    status: r.status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function meRow(req) {
  const [rows] = await pool.query(
    "SELECT id, name, role, hostel_id FROM users WHERE id = ?",
    [req.user.id]
  );
  const u = rows[0];
  return u
    ? { id: u.id, name: u.name, role: u.role, hostel_id: u.hostel_id != null ? Number(u.hostel_id) : null }
    : { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

// POST /api/improvements/list — role-scoped list
router.post("/list", requireAuth, async (req, res) => {
  try {
    const me = await meRow(req);
    const where = [];
    const params = [];
    if (me.role === "warden") {
      where.push("hostel_id = ?");
      params.push(me.hostel_id);
    } else if (me.role === "admin") {
      if (req.body.hostelId) {
        where.push("hostel_id = ?");
        params.push(Number(req.body.hostelId));
      }
      if (req.body.wardenId) {
        where.push("warden_id = ?");
        params.push(Number(req.body.wardenId));
      }
    } else {
      return res.status(403).json({ error: "You do not have access to improvements." });
    }
    if (req.body.status) {
      where.push("status = ?");
      params.push(String(req.body.status));
    }
    const sql = `SELECT * FROM improvements${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, improvements: rows.map(mapRow) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/improvements/create — student/anon submission
router.post("/create", async (req, res) => {
  try {
    const { subject, category, description, studentName, studentId, studentCode, hostelId } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: "Subject, description and category are required." });
    }

    let hostel = hostelId ? Number(hostelId) : null;
    let student = null;
    if (studentId) {
      const [rows] = await pool.query("SELECT id, name, hostel_id FROM students WHERE id = ?", [Number(studentId)]);
      if (rows.length) {
        student = rows[0];
        hostel = hostel ?? Number(student.hostel_id);
      }
    }
    if (!student && studentCode) {
      const [byCnic] = await pool.query("SELECT id, name, hostel_id FROM students WHERE cnic = ? LIMIT 1", [String(studentCode)]);
      if (byCnic.length) {
        student = byCnic[0];
        hostel = hostel ?? Number(student.hostel_id);
      }
    }

    const [wardens] = hostel
      ? await pool.query("SELECT id FROM users WHERE role = 'warden' AND hostel_id = ? AND is_active = 1 LIMIT 1", [hostel])
      : [[]];

    const [count] = await pool.query("SELECT COUNT(*) AS n FROM improvements");
    const year = new Date().getFullYear();
    const code = `IMP-${year}-${String(Number(count[0].n) + 1).padStart(4, "0")}`;

    const [result] = await pool.query(
      `INSERT INTO improvements (code, student_name, hostel_id, warden_id, category, subject, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
      [
        code,
        student?.name ?? studentName ?? null,
        hostel,
        wardens[0] ? Number(wardens[0].id) : null,
        category ?? "Other",
        String(subject),
        String(description),
      ]
    );

    if (wardens[0]) {
      await notify({
        user_id: Number(wardens[0].id),
        type: "improvement",
        title: "New improvement suggestion",
        message: `${student?.name ?? "A student"} suggested: ${String(subject).slice(0, 120)}`,
        link: "/manage/complaints",
      });
    }
    await notifyRole({
      role: "admin",
      type: "improvement",
      title: "New improvement suggestion",
      message: `${student?.name ?? "A student"} suggested: ${String(subject).slice(0, 120)}`,
      link: "/manage/complaints",
    });

    const [rows] = await pool.query("SELECT * FROM improvements WHERE id = ?", [result.insertId]);
    res.json({ ok: true, improvement: mapRow(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/improvements/update — staff updates status/remarks
router.post("/update", requireAuth, async (req, res) => {
  try {
    const me = await meRow(req);
    const id = Number(req.body.id);
    if (!id) return res.status(400).json({ error: "Missing improvement id." });

    const [found] = await pool.query("SELECT * FROM improvements WHERE id = ?", [id]);
    if (!found.length) return res.status(404).json({ error: "Improvement not found." });
    const item = found[0];

    const isStaff = me.role === "admin";
    const isOwnWarden = me.role === "warden" && me.hostel_id === Number(item.hostel_id);
    if (!isStaff && !isOwnWarden) {
      return res.status(403).json({ error: "You cannot modify improvements for another hostel." });
    }

    const fields = { updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") };
    if (req.body.status !== undefined) {
      if (!VALID_STATUS.includes(String(req.body.status))) {
        return res.status(400).json({ error: `Invalid status: ${req.body.status}` });
      }
      fields.status = String(req.body.status);
    }
    if (req.body.remarks !== undefined) fields.remarks = String(req.body.remarks);

    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
    await pool.query(`UPDATE improvements SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);

    const [rows] = await pool.query("SELECT * FROM improvements WHERE id = ?", [id]);
    res.json({ ok: true, improvement: mapRow(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/improvements/stats — counts for reports/dashboards
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const me = await meRow(req);
    const where = [];
    const params = [];
    if (me.role === "warden") {
      where.push("hostel_id = ?");
      params.push(me.hostel_id);
    }
    const [rows] = await pool.query(
      `SELECT
         status,
         COUNT(*) AS n
       FROM improvements${where.length ? " WHERE " + where.join(" AND ") : ""}
       GROUP BY status`,
      params
    );
    const byStatus = {};
    for (const r of rows) byStatus[r.status] = Number(r.n);
    res.json({ byStatus, total: rows.reduce((s, r) => s + Number(r.n), 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;