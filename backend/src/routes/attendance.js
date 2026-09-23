import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, notifyRole, audit } from "../notify.js";

const router = Router();
router.use(requireAuth);

async function meRow(req) {
  const [rows] = await pool.query("SELECT id, name, role, hostel_id FROM users WHERE id = ?", [req.user.id]);
  return rows[0] ?? { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

function mapRow(r) {
  return {
    id: Number(r.id),
    studentId: Number(r.student_id),
    studentName: r.student_name,
    hostelId: r.hostel_id != null ? Number(r.hostel_id) : null,
    room: r.room,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status,
    notes: r.notes ?? null,
    recordedBy: r.recorded_by ?? null,
    createdAt: r.created_at,
  };
}

const BASE_SELECT = `
  SELECT a.*, s.name AS student_name, s.hostel_id, s.room
  FROM attendance a
  JOIN students s ON s.id = a.student_id
`;

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// GET /api/attendance?date=&studentId=&hostelId=&status=
router.get("/", async (req, res) => {
  try {
    const me = await meRow(req);
    const where = [];
    const params = [];
    if (me.role === "warden") {
      where.push("s.hostel_id = ?");
      params.push(me.hostel_id);
    }
    if (req.query.date) {
      where.push("a.date = ?");
      params.push(String(req.query.date));
    }
    if (req.query.studentId) {
      where.push("a.student_id = ?");
      params.push(Number(req.query.studentId));
    }
    if (req.query.hostelId && me.role !== "warden") {
      where.push("s.hostel_id = ?");
      params.push(Number(req.query.hostelId));
    }
    if (req.query.status) {
      if (req.query.status === "checkedin") where.push("a.check_in IS NOT NULL AND a.check_out IS NULL");
      else if (req.query.status === "checkedout") where.push("a.check_out IS NOT NULL");
      else if (req.query.status === "absent") {
        where.push("a.status = 'absent' AND a.check_in IS NULL");
      } else {
        where.push("a.status = ?");
        params.push(String(req.query.status));
      }
    }
    const sql = `${BASE_SELECT}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY a.date DESC, s.name ASC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/upsert — record check-in / mark absent / update
router.post("/upsert", async (req, res) => {
  try {
    const me = await meRow(req);
    const { student_id, date, check_in, check_out, status } = req.body;
    if (!student_id || !date) {
      return res.status(400).json({ error: "student_id and date are required." });
    }
    const [stuRows] = await pool.query("SELECT id, name, hostel_id FROM students WHERE id = ?", [Number(student_id)]);
    if (!stuRows.length) return res.status(404).json({ error: "Student not found." });
    const student = stuRows[0];
    if (me.role === "warden" && Number(student.hostel_id) !== Number(me.hostel_id)) {
      return res.status(403).json({ error: "You cannot mark attendance for students outside your hostel." });
    }

    await pool.query(
      `INSERT INTO attendance (student_id, date, check_in, check_out, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         check_in = VALUES(check_in),
         check_out = VALUES(check_out),
         status = VALUES(status),
         recorded_by = VALUES(recorded_by)`,
      [
        Number(student_id),
        String(date),
        check_in ?? null,
        check_out ?? null,
        status ?? "present",
        me.name ?? null,
      ]
    );

    if (check_in && !check_out) {
      await notifyRole({
        role: "admin",
        type: "attendance",
        title: "Student checked in",
        message: `${student.name} was checked in${me.name ? " by " + me.name : ""} on ${date} at ${check_in}.`,
        link: "/manage/attendance",
      });
    }

    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE a.student_id = ? AND a.date = ? LIMIT 1`,
      [Number(student_id), String(date)]
    );
    res.json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkout — close an ongoing check-in
router.post("/checkout", async (req, res) => {
  try {
    const me = await meRow(req);
    const { student_id, date, check_out, status } = req.body;
    if (!student_id || !date) {
      return res.status(400).json({ error: "student_id and date are required." });
    }
    const [stuRows] = await pool.query("SELECT id, name, hostel_id FROM students WHERE id = ?", [Number(student_id)]);
    if (!stuRows.length) return res.status(404).json({ error: "Student not found." });
    const student = stuRows[0];
    if (me.role === "warden" && Number(student.hostel_id) !== Number(me.hostel_id)) {
      return res.status(403).json({ error: "You cannot check out students outside your hostel." });
    }

    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE a.student_id = ? AND a.date = ? LIMIT 1`,
      [Number(student_id), String(date)]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "This student has no record for this date yet. Check them in first." });
    }
    if (rows[0].check_in && rows[0].check_out) {
      return res.status(400).json({ error: "This student is already checked out for this day." });
    }
    if (!rows[0].check_in) {
      return res.status(400).json({ error: "A check-out requires a check-in first." });
    }

    await pool.query(
      "UPDATE attendance SET check_out = ?, status = ?, recorded_by = ? WHERE student_id = ? AND date = ?",
      [check_out ?? nowTime(), status ?? "present", me.name ?? null, Number(student_id), String(date)]
    );

    await notifyRole({
      role: "admin",
      type: "attendance",
      title: "Student checked out",
      message: `${student.name} was checked out${me.name ? " by " + me.name : ""} on ${date} at ${check_out ?? nowTime()}.`,
      link: "/manage/attendance",
    });

    const [updated] = await pool.query(
      `${BASE_SELECT} WHERE a.student_id = ? AND a.date = ? LIMIT 1`,
      [Number(student_id), String(date)]
    );
    res.json(mapRow(updated[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;