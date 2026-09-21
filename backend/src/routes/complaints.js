import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Complaint flow (REST mirror of the Supabase `complaints-api` edge function):
//   POST /api/complaints/list    — role-scoped list w/ filters
//   POST /api/complaints/create  — anon or signed-in submission
//   POST /api/complaints/update  — staff/warden update
//   POST /api/complaints/lookup  — anon student lookup by CNIC / student id
//   GET  /api/complaints/:id/responses    — reply thread
//   POST /api/complaints/:id/responses    — add a reply
const router = Router();

function mapComplaint(r) {
  return {
    id: Number(r.id),
    code: r.code ?? null,
    student_id: r.student_id != null ? Number(r.student_id) : null,
    student_name: r.student_name ?? null,
    student_code: r.student_code ?? null,
    hostel_id: r.hostel_id != null ? Number(r.hostel_id) : null,
    warden_id: r.warden_id ?? null,
    room: r.room ?? null,
    category: r.category,
    description: r.description,
    priority: r.priority,
    status: r.status,
    remarks: r.remarks ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? null,
  };
}

// Derive the caller profile from the authenticated request (req.user is set
// by requireAuth), or from a Bearer token when present.
async function currentProfile(req) {
  let id = req.user?.id;
  if (!id) {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");
    if (!token) return null;
    try {
      const SECRET = () => process.env.JWT_SECRET || "dev_secret";
      id = jwt.verify(token, SECRET()).id;
    } catch {
      return null;
    }
  }
  const [rows] = await pool.query(
    "SELECT id, name, email, role, hostel_id, student_id FROM users WHERE id = ?",
    [id]
  );
  const u = rows[0];
  if (!u) return null;
  return {
    id: String(u.id),
    role: u.role,
    hostel_id: u.hostel_id != null ? Number(u.hostel_id) : null,
    name: u.name,
    student_id: u.student_id != null ? Number(u.student_id) : null,
  };
}

async function resolveWarden(hostelId) {
  if (!hostelId) return null;
  const [rows] = await pool.query(
    "SELECT id, name FROM users WHERE role = 'warden' AND hostel_id = ? ORDER BY id ASC LIMIT 1",
    [hostelId]
  );
  const w = rows[0];
  return w ? { id: String(w.id), name: w.name } : null;
}

// POST /list
router.post("/list", requireAuth, async (req, res) => {
  try {
    const me = await currentProfile(req);
    if (!me) return res.status(401).json({ error: "You are not signed in." });

    const conditions = [];
    const params = [];

    if (me.role === "warden") {
      if (!me.hostel_id) return res.json({ ok: true, complaints: [] });
      conditions.push("hostel_id = ?");
      params.push(me.hostel_id);
    } else if (me.role === "admin") {
      if (req.body.hostelId) {
        conditions.push("hostel_id = ?");
        params.push(Number(req.body.hostelId));
      }
      if (req.body.wardenId) {
        conditions.push("warden_id = ?");
        params.push(String(req.body.wardenId));
      }
    } else if (me.role === "student") {
      if (!me.student_id) return res.json({ ok: true, complaints: [] });
      conditions.push("student_id = ?");
      params.push(me.student_id);
    } else {
      return res.status(403).json({ error: "You do not have access to complaints." });
    }

    if (req.body.status) {
      conditions.push("status = ?");
      params.push(String(req.body.status));
    }
    if (req.body.priority) {
      conditions.push("priority = ?");
      params.push(String(req.body.priority));
    }
    if (req.body.from) {
      conditions.push("created_at >= ?");
      params.push(String(req.body.from));
    }
    if (req.body.to) {
      conditions.push("created_at <= ?");
      params.push(String(req.body.to));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT * FROM complaints ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ ok: true, complaints: rows.map(mapComplaint) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lookup
router.post("/lookup", async (req, res) => {
  try {
    const code = String(req.body.studentCode ?? "").trim();
    if (!code) return res.status(400).json({ error: "Please enter your CNIC or Student ID." });

    let student = null;
    const [byCnic] = await pool.query(
      "SELECT id, name, cnic FROM students WHERE cnic = ? LIMIT 1",
      [code]
    );
    if (byCnic.length) student = byCnic[0];
    if (!student && /^\d+$/.test(code)) {
      const [byId] = await pool.query(
        "SELECT id, name, cnic FROM students WHERE id = ? LIMIT 1",
        [Number(code)]
      );
      if (byId.length) student = byId[0];
    }
    if (!student) {
      return res.status(404).json({ error: "No student found with that CNIC or Student ID." });
    }

    const [complaints] = await pool.query(
      "SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC",
      [student.id]
    );
    let responses = [];
    if (complaints.length) {
      const [resp] = await pool.query(
        "SELECT * FROM complaint_responses WHERE complaint_id IN (?) ORDER BY created_at ASC",
        [complaints.map((c) => c.id)]
      );
      responses = resp;
    }

    res.json({ ok: true, complaints: complaints.map(mapComplaint), responses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /create
router.post("/create", async (req, res) => {
  try {
    const description = String(req.body.description ?? "").trim();
    const category = String(req.body.category ?? "Other");
    const priority = String(req.body.priority ?? "Normal");
    if (!description) return res.status(400).json({ error: "Please describe your complaint." });

    const me = await currentProfile(req);

    let studentId = me?.student_id ?? null;
    if (!studentId && req.body.studentId) studentId = Number(req.body.studentId);
    if (!studentId && req.body.studentCode) {
      const [byCode] = await pool.query(
        "SELECT id FROM students WHERE cnic = ? LIMIT 1",
        [String(req.body.studentCode)]
      );
      if (byCode.length) studentId = Number(byCode[0].id);
    }

    let student = null;
    if (studentId) {
      const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);
      student = rows[0] ?? null;
    }

    const hostelId = student?.hostel_id ?? me?.hostel_id ?? null;
    const warden = await resolveWarden(hostelId);

    const [countRows] = await pool.query("SELECT COUNT(*) AS n FROM complaints");
    const year = new Date().getFullYear();
    const code = `CMP-${year}-${String(Number(countRows[0].n) + 1).padStart(4, "0")}`;

    const studentName =
      student?.name ?? me?.name ?? (String(req.body.studentName ?? "") || null);
    const room = student?.room ?? (String(req.body.room ?? "") || null);

    const [result] = await pool.query(
      `INSERT INTO complaints
         (code, student_id, student_name, student_code, hostel_id, warden_id, room,
          category, description, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        code,
        studentId,
        studentName,
        student?.cnic ?? null,
        hostelId,
        warden?.id ?? null,
        room,
        category,
        description,
        priority,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM complaints WHERE id = ?", [result.insertId]);
    res.json({ ok: true, complaint: mapComplaint(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /update
router.post("/update", requireAuth, async (req, res) => {
  try {
    const me = await currentProfile(req);
    if (!me) return res.status(401).json({ error: "You are not signed in." });

    const id = Number(req.body.id);
    if (!id) return res.status(400).json({ error: "Missing complaint id." });

    const [found] = await pool.query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (!found.length) return res.status(404).json({ error: "Complaint not found." });
    const complaint = found[0];

    const isStaff = me.role === "admin";
    const isOwnWarden = me.role === "warden" && me.hostel_id === Number(complaint.hostel_id);
    if (!isStaff && !isOwnWarden) {
      return res.status(403).json({ error: "You cannot modify complaints for another hostel." });
    }

    const fields = { updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") };
    if (req.body.status !== undefined) fields.status = String(req.body.status);
    if (req.body.remarks !== undefined) fields.remarks = String(req.body.remarks);
    if (req.body.priority !== undefined) fields.priority = String(req.body.priority);

    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
    const values = Object.values(fields);
    await pool.query(`UPDATE complaints SET ${sets} WHERE id = ?`, [...values, id]);

    const [rows] = await pool.query("SELECT * FROM complaints WHERE id = ?", [id]);
    res.json({ ok: true, complaint: mapComplaint(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/responses
router.get("/:id/responses", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM complaint_responses WHERE complaint_id = ? ORDER BY created_at ASC",
      [Number(req.params.id)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/responses
router.post("/:id/responses", requireAuth, async (req, res) => {
  try {
    const complaintId = Number(req.params.id);
    const message = String(req.body.message ?? "").trim();
    if (!message) return res.status(400).json({ error: "Message is required." });

    const me = await currentProfile(req);
    if (!me) return res.status(401).json({ error: "You are not signed in." });

    await pool.query(
      `INSERT INTO complaint_responses (complaint_id, author_id, author_name, author_role, message)
       VALUES (?, ?, ?, ?, ?)`,
      [complaintId, me.id, me.name, me.role, message]
    );
    const [rows] = await pool.query(
      "SELECT * FROM complaint_responses WHERE complaint_id = ? ORDER BY created_at ASC",
      [complaintId]
    );
    res.json({ ok: true, responses: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;