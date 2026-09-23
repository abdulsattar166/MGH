import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, notifyRole, audit } from "../notify.js";

const router = Router();
router.use(requireAuth);

// Fee status lifecycle:
//   approved  -> fee generated/approved for the student (default)
//   fetched   -> fee collected by warden/admin (paid)
//   unfetched -> marked as not collected (fee due)
const VALID_STATUS = ["approved", "fetched", "unfetched"];

function mapRow(r) {
  return {
    id: Number(r.id),
    studentId: Number(r.student_id),
    studentName: r.student_name,
    hostelId: r.hostel_id != null ? Number(r.hostel_id) : null,
    hostelName: r.hostel_name,
    room: r.room,
    bed: r.bed != null ? Number(r.bed) : null,
    studentStatus: r.student_status,
    month: r.month,
    amount: Number(r.amount),
    paid: Boolean(r.paid),
    paidAt: r.paid_at,
    method: r.method,
    reference: r.reference,
    status: r.status,
    collectedBy: r.collected_by,
    remarks: r.remarks,
    createdAt: r.created_at,
  };
}

const BASE_SELECT = `
  SELECT f.*, s.name AS student_name, s.hostel_id, h.name AS hostel_name,
         s.room, s.bed, s.status AS student_status
  FROM fees f
  JOIN students s ON s.id = f.student_id
  LEFT JOIN hostels h ON h.id = s.hostel_id
`;

async function meRow(req) {
  const [rows] = await pool.query("SELECT id, name, role, hostel_id FROM users WHERE id = ?", [req.user.id]);
  return rows[0] ?? { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

// GET /api/fees?month=YYYY-MM&hostelId=&status=&studentId=
router.get("/", async (req, res) => {
  try {
    const me = await meRow(req);
    const where = [];
    const params = [];
    if (me.role === "warden") {
      where.push("s.hostel_id = ?");
      params.push(me.hostel_id);
    }
    if (req.query.month) {
      where.push("f.month = ?");
      params.push(String(req.query.month));
    }
    if (req.query.status) {
      where.push("f.status = ?");
      params.push(String(req.query.status));
    }
    if (req.query.hostelId && me.role !== "warden") {
      where.push("s.hostel_id = ?");
      params.push(Number(req.query.hostelId));
    }
    if (req.query.studentId) {
      where.push("f.student_id = ?");
      params.push(Number(req.query.studentId));
    }
    const sql = `${BASE_SELECT}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY s.name ASC, f.month DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/upsert — create or update a single student/month record
router.post("/upsert", async (req, res) => {
  try {
    const me = await meRow(req);
    const { student_id, month, amount, paid, paid_at, method } = req.body;
    if (!student_id || !month) {
      return res.status(400).json({ error: "student_id and month are required." });
    }
    const isPaid = Boolean(paid);
    const status = isPaid ? "fetched" : "approved";
    await pool.query(
      `INSERT INTO fees (student_id, month, amount, paid, paid_at, method, status, collected_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount),
         paid = VALUES(paid),
         paid_at = VALUES(paid_at),
         method = VALUES(method),
         status = VALUES(status),
         collected_by = VALUES(collected_by)`,
      [
        Number(student_id),
        String(month),
        Number(amount ?? 0),
        isPaid ? 1 : 0,
        isPaid ? (paid_at ?? new Date().toISOString().slice(0, 10)) : null,
        isPaid ? (method ?? null) : null,
        status,
        isPaid ? (me.name ?? null) : null,
      ]
    );
    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE f.student_id = ? AND f.month = ? LIMIT 1`,
      [Number(student_id), String(month)]
    );
    res.json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/collect — collect (fetch) a fee for a student/month
//   { student_id, month, amount, method, reference?, remarks? }
router.post("/collect", async (req, res) => {
  try {
    const me = await meRow(req);
    const { student_id, month, amount, method, reference, remarks } = req.body;
    if (!student_id || !month) {
      return res.status(400).json({ error: "student_id and month are required." });
    }

    const [stuRows] = await pool.query("SELECT * FROM students WHERE id = ?", [Number(student_id)]);
    if (!stuRows.length) return res.status(404).json({ error: "Student not found." });
    const student = stuRows[0];
    if (me.role === "warden" && Number(student.hostel_id) !== Number(me.hostel_id)) {
      return res.status(403).json({ error: "You cannot collect fees for students outside your hostel." });
    }

    const feeAmount = Number(amount > 0 ? amount : student.monthly_fee ?? 0);
    const ref = reference || `FEE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO fees (student_id, month, amount, paid, paid_at, method, reference, status, collected_by, remarks)
       VALUES (?, ?, ?, 1, ?, ?, ?, 'fetched', ?, ?)
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount), paid = 1, paid_at = VALUES(paid_at),
         method = VALUES(method), reference = VALUES(reference),
         status = 'fetched', collected_by = VALUES(collected_by), remarks = VALUES(remarks)`,
      [
        Number(student_id),
        String(month),
        feeAmount,
        today,
        method ?? "cash",
        ref,
        me.name ?? null,
        remarks ?? null,
      ]
    );

    // Collecting the fee returns the student to an active state.
    await pool.query("UPDATE students SET status = 'Active' WHERE id = ?", [Number(student_id)]);

    await audit({
      user: me,
      action: "fee.collected",
      resource: "fees",
      resource_id: String(student_id),
      details: `Collected PKR ${feeAmount.toLocaleString()} for ${student.name} (${month}) — ${ref}`,
    });

    await notify({
      user_id: me.id,
      type: "fee",
      title: "Fee collected",
      message: `PKR ${feeAmount.toLocaleString()} was collected from ${student.name} for ${month}.`,
      link: "/manage/fees",
    });
    await notifyRole({
      role: "admin",
      type: "fee",
      title: "Fee update",
      message: `${me.name ?? "A warden"} collected PKR ${feeAmount.toLocaleString()} from ${student.name} for ${month}.`,
      link: "/manage/fees",
    });

    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE f.student_id = ? AND f.month = ? LIMIT 1`,
      [Number(student_id), String(month)]
    );
    res.json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/:id/status — toggle fee status (approved / fetched / unfetched)
router.post("/:id/status", async (req, res) => {
  try {
    const me = await meRow(req);
    const { status } = req.body;
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `Invalid fee status: ${status}` });
    }
    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE f.id = ? LIMIT 1`,
      [Number(req.params.id)]
    );
    const fee = rows[0];
    if (!fee) return res.status(404).json({ error: "Fee record not found." });
    const studentHostel = Number(fee.hostel_id);
    if (me.role === "warden" && Number(me.hostel_id) !== studentHostel) {
      return res.status(403).json({ error: "You cannot change fees for students outside your hostel." });
    }

    const isPaid = status === "fetched";
    await pool.query(
      "UPDATE fees SET status = ?, paid = ?, paid_at = ?, collected_by = ? WHERE id = ?",
      [
        status,
        isPaid ? 1 : 0,
        isPaid ? new Date().toISOString().slice(0, 10) : null,
        isPaid ? (me.name ?? null) : null,
        Number(req.params.id),
      ]
    );

    // Student status follows the fee the way the hostel expects it.
    let studentStatus = "Active";
    if (status === "unfetched") studentStatus = "Fee Due";
    await pool.query("UPDATE students SET status = ? WHERE id = ?", [studentStatus, fee.student_id]);

    await audit({
      user: me,
      action: `fee.status.${status}`,
      resource: "fees",
      resource_id: String(fee.student_id),
      details: `Marked fee for ${fee.student_name} (${fee.month}) as ${status}`,
    });

    const [updated] = await pool.query(
      `${BASE_SELECT} WHERE f.id = ? LIMIT 1`,
      [Number(req.params.id)]
    );
    res.json(mapRow(updated[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/stats — dashboard totals (role scoped)
router.get("/stats", async (req, res) => {
  try {
    const me = await meRow(req);
    let where = "1 = 1";
    const params = [];
    if (me.role === "warden") {
      where += " AND s.hostel_id = ?";
      params.push(me.hostel_id);
    }
    if (req.query.month) {
      where += " AND f.month = ?";
      params.push(String(req.query.month));
    }
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN f.status = 'fetched' THEN f.amount ELSE 0 END), 0) AS collected,
         COALESCE(SUM(CASE WHEN f.status IN ('approved','unfetched') THEN f.amount ELSE 0 END), 0) AS pending,
         COALESCE(SUM(CASE WHEN f.status = 'unfetched' THEN f.amount ELSE 0 END), 0) AS overdue,
         COALESCE(SUM(f.amount), 0) AS total,
         COUNT(*) AS records,
         COUNT(DISTINCT CASE WHEN f.status = 'fetched' THEN f.student_id END) AS fetchedStudents,
         COUNT(DISTINCT CASE WHEN f.status IN ('approved','unfetched') THEN f.student_id END) AS pendingStudents
       FROM fees f
       JOIN students s ON s.id = f.student_id
       WHERE ${where}`,
      params
    );
    const r = rows[0];
    const total = Number(r.total);
    res.json({
      collected: Number(r.collected),
      pending: Number(r.pending),
      overdue: Number(r.overdue),
      total,
      records: Number(r.records),
      fetchedStudents: Number(r.fetchedStudents),
      pendingStudents: Number(r.pendingStudents),
      collectionRate: total ? Math.round((Number(r.collected) / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;