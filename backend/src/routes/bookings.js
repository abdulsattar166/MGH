import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, notifyRole, audit } from "../notify.js";

const router = Router();
router.use(requireAuth);

const BOOKING_FEE_DEFAULT = 18000;

// Generate a sequential tracking id like MGH-2026-000184
async function nextBookingId() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    "SELECT MAX(id) AS last FROM bookings WHERE id LIKE ?",
    [`MGH-${year}-%`]
  );
  const last = rows[0]?.last;
  const next = last ? Number(String(last).split("-")[2]) + 1 : 1;
  return `MGH-${year}-${String(next).padStart(6, "0")}`;
}

function parseApplicant(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value ?? {};
}

function parseTracking(value) {
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nowStamp() {
  return new Date().toISOString();
}

// Resolves the acting user's row (name/role for audit + notifications).
async function meRow(req) {
  const [rows] = await pool.query("SELECT id, name, role, hostel_id FROM users WHERE id = ?", [req.user.id]);
  return rows[0] ?? { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

// Returns true when the acting user may manage bookings of the given hostel.
function mayManage(me, hostelId) {
  return me.role === "admin" || (me.role === "warden" && Number(me.hostel_id) === Number(hostelId));
}

async function fetchBookingRows(scopeSql, scopeParams) {
  const [rows] = await pool.query(
    `SELECT b.*, w.name AS warden_name
     FROM bookings b
     JOIN (SELECT id FROM bookings b ${scopeSql} ORDER BY b.id DESC) ids ON ids.id = b.id
     LEFT JOIN users w ON w.id = b.warden_id`,
    scopeParams
  );
  return rows.map((r) => ({
    id: r.id,
    hostelId: Number(r.hostel_id),
    hostelName: r.hostel_name,
    roomLabel: r.room_label,
    block: r.block,
    floor: Number(r.floor),
    bedNumber: Number(r.bed_number),
    status: r.status,
    feeAmount: Number(r.fee_amount ?? 0),
    wardenId: r.warden_id != null ? Number(r.warden_id) : null,
    wardenName: r.warden_name ?? null,
    approvedBy: r.approved_by ?? null,
    approvedAt: r.approved_at ?? null,
    rejectedBy: r.rejected_by ?? null,
    rejectedAt: r.rejected_at ?? null,
    reason: r.reason ?? null,
    tracking: parseTracking(r.tracking),
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
    applicant: parseApplicant(r.applicant),
  }));
}

// GET /api/bookings — role-scoped list
router.get("/", async (req, res) => {
  try {
    const me = await meRow(req);
    let rows;
    if (me.role === "warden") {
      rows = await fetchBookingRows("WHERE b.hostel_id = ?", [me.hostel_id]);
    } else {
      rows = await fetchBookingRows("", []);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id
router.get("/:id", async (req, res) => {
  try {
    const me = await meRow(req);
    const rows = await fetchBookingRows("WHERE b.id = ?", [String(req.params.id)]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!mayManage(me, booking.hostelId)) {
      return res.status(403).json({ error: "You do not have access to this booking." });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/status — generic state change (cancel, under_review, etc.)
router.put("/:id/status", async (req, res) => {
  try {
    const me = await meRow(req);
    const { status } = req.body;
    const ALLOWED = ["pending", "under_review", "approved", "rejected", "cancelled", "checked_in", "completed"];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: `Invalid booking status: ${status}` });
    }

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [String(req.params.id)]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!mayManage(me, Number(booking.hostel_id))) {
      return res.status(403).json({ error: "You do not have access to this booking." });
    }

    // Enforce a sane lifecycle: an approved booking can only move to checked_in/completed/cancelled.
    const from = String(booking.status);
    const validNext = {
      pending: ["under_review", "approved", "rejected", "cancelled"],
      under_review: ["approved", "rejected", "cancelled"],
      approved: ["checked_in", "completed", "cancelled"],
      checked_in: ["completed", "cancelled"],
      completed: [],
      rejected: [],
      cancelled: [],
    }[from] ?? [];
    if (status !== from && !validNext.includes(status)) {
      return res.status(400).json({
        error: `Cannot change a booking from "${from}" to "${status}".`,
      });
    }

    const tracking = parseTracking(booking.tracking);
    tracking.push({ status, at: nowStamp(), by: me.name ?? null });

    await pool.query(
      "UPDATE bookings SET status = ?, tracking = ? WHERE id = ?",
      [status, JSON.stringify(tracking), booking.id]
    );

    await audit({
      user: me,
      action: `booking.status.${status}`,
      resource: "bookings",
      resource_id: booking.id,
      details: `Booking ${booking.id} moved from ${from} to ${status}`,
    });

    if (status === "cancelled") {
      await notifyRole({
        role: "admin",
        type: "booking",
        title: "Booking cancelled",
        message: `Booking ${booking.id} (${booking.hostel_name}) was cancelled.`,
        link: "/manage/bookings",
      });
    }

    const [updated] = await pool.query("SELECT * FROM bookings WHERE id = ?", [booking.id]);
    res.json({ ok: true, booking: { ...updated, applicant: parseApplicant(updated.applicant), tracking: parseTracking(updated.tracking) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/approve — transactional approve
router.put("/:id/approve", async (req, res) => {
  const conn = await pool.getConnection();
  let released = false;
  const releaseOnce = async () => {
    if (released) return;
    released = true;
    try {
      conn.release();
    } catch { /* noop */ }
  };
  try {
    const me = await meRow(req);
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM bookings WHERE id = ?", [String(req.params.id)]);
    const booking = rows[0];
    if (!booking) {
      await conn.rollback();
      await releaseOnce();
      return res.status(404).json({ error: "Booking not found." });
    }
    if (!mayManage(me, Number(booking.hostel_id))) {
      await conn.rollback();
      await releaseOnce();
      return res.status(403).json({ error: "You do not have access to this booking." });
    }
    if (!["pending", "under_review"].includes(String(booking.status))) {
      await conn.rollback();
      await releaseOnce();
      return res.status(400).json({ error: `A booking with status "${booking.status}" cannot be approved.` });
    }

    const hostelId = Number(booking.hostel_id);
    const roomLabel = String(booking.room_label);
    const bedNumber = Number(booking.bed_number);
    const applicant = parseApplicant(booking.applicant);

    // ---- reserve the target bed atomically ----
    const [roomRows] = await conn.query(
      "SELECT id, capacity FROM hostel_rooms WHERE hostel_id = ? AND room_number = ? LIMIT 1",
      [hostelId, roomLabel]
    );
    if (!roomRows.length) {
      await conn.rollback();
      await releaseOnce();
      return res.status(400).json({ error: `Room ${roomLabel} no longer exists in this hostel.` });
    }
    const room = roomRows[0];
    const [bedRows] = await conn.query(
      "SELECT id, is_maintenance FROM hostel_beds WHERE room_id = ? AND bed_number = ? LIMIT 1",
      [room.id, bedNumber]
    );
    if (!bedRows.length) {
      await conn.rollback();
      await releaseOnce();
      return res.status(400).json({ error: `Bed ${bedNumber} in room ${roomLabel} does not exist.` });
    }
    const bed = bedRows[0];
    if (bed.is_maintenance) {
      await conn.rollback();
      await releaseOnce();
      return res.status(400).json({ error: `Bed ${bedNumber} is under maintenance and cannot be allocated.` });
    }
    const [allocRows] = await conn.query(
      "SELECT id FROM room_allocations WHERE bed_id = ? LIMIT 1",
      [bed.id]
    );
    if (allocRows.length) {
      await conn.rollback();
      await releaseOnce();
      return res.status(400).json({ error: `Bed ${bedNumber} in room ${roomLabel} is already occupied.` });
    }

    const feeAmount = Number(booking.fee_amount) || BOOKING_FEE_DEFAULT;

    // ---- create the student record ----
    const [studentResult] = await conn.query(
      `INSERT INTO students
         (name, father_name, cnic, phone, hostel_id, room, bed, room_type,
          university, program, guardian_phone, join_date, monthly_fee, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
      [
        applicant.fullName || "Applicant",
        applicant.fatherName ?? "",
        applicant.cnic ?? "",
        applicant.mobile ?? applicant.whatsapp ?? "",
        hostelId,
        roomLabel,
        bedNumber,
        "Seater",
        applicant.occupation ?? "",
        "",
        applicant.emergencyPhone ?? "",
        applicant.joiningDate ?? "",
        feeAmount,
        applicant.dob ?? "",
      ]
    );
    const studentId = Number(studentResult.insertId);

    // ---- allocation ----
    await conn.query(
      "INSERT INTO room_allocations (student_id, room_id, bed_id) VALUES (?, ?, ?)",
      [studentId, room.id, bed.id]
    );

    // ---- approve the booking ----
    const tracking = parseTracking(booking.tracking);
    tracking.push({ status: "approved", at: nowStamp(), by: me.name ?? null });
    await conn.query(
      `UPDATE bookings
       SET status = 'approved', approved_by = ?, approved_at = ?, tracking = ?
       WHERE id = ?`,
      [me.name ?? `#${me.id}`, nowStamp(), JSON.stringify(tracking), booking.id]
    );

    // ---- generate this month's fee record (approved) ----
    const month = currentMonth();
    await conn.query(
      `INSERT INTO fees (student_id, month, amount, paid, status)
       VALUES (?, ?, ?, 0, 'approved')
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'approved'`,
      [studentId, month, feeAmount]
    );

    await conn.commit();
    await releaseOnce();

    // ---- notifications (outside the transaction) ----
    await notifyRole({
      role: "admin",
      type: "booking",
      title: "Booking approved",
      message: `Booking ${booking.id} for ${applicant.fullName || "an applicant"} in ${booking.hostel_name} was approved by ${me.name ?? "admin"}.`,
      link: "/manage/bookings",
    });
    if (booking.warden_id != null) {
      await notify({
        user_id: booking.warden_id,
        type: "booking",
        title: "New student assigned",
        message: `${applicant.fullName || "A new student"} was approved into ${booking.hostel_name}, Room ${roomLabel} · Bed ${bedNumber}. A fee of PKR ${feeAmount.toLocaleString()} was generated for this month.`,
        link: "/manage/fees",
        data: { booking_id: booking.id, student_id: studentId },
      });
    }

    await audit({
      user: me,
      action: "booking.approved",
      resource: "bookings",
      resource_id: booking.id,
      details: `Approved ${booking.id} and created student #${studentId} in ${booking.hostel_name} room ${roomLabel}`,
    });

    const [updatedRows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [booking.id]);
    res.json({
      ok: true,
      studentId,
      booking: {
        ...updatedRows[0],
        applicant: parseApplicant(updatedRows[0].applicant),
        tracking: parseTracking(updatedRows[0].tracking),
      },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch { /* noop */ }
    await releaseOnce();
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/reject — rejection with reason
router.put("/:id/reject", async (req, res) => {
  try {
    const me = await meRow(req);
    const reason = String(req.body.reason || "").trim() || "Not specified";

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [String(req.params.id)]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!mayManage(me, Number(booking.hostel_id))) {
      return res.status(403).json({ error: "You do not have access to this booking." });
    }
    if (!["pending", "under_review"].includes(String(booking.status))) {
      return res.status(400).json({ error: `A booking with status "${booking.status}" cannot be rejected.` });
    }

    const tracking = parseTracking(booking.tracking);
    tracking.push({ status: "rejected", at: nowStamp(), by: me.name ?? null, note: reason });

    await pool.query(
      `UPDATE bookings
       SET status = 'rejected', rejected_by = ?, rejected_at = ?, reason = ?, tracking = ?
       WHERE id = ?`,
      [me.name ?? `#${me.id}`, nowStamp(), reason, JSON.stringify(tracking), booking.id]
    );

    if (booking.warden_id != null) {
      await notify({
        user_id: booking.warden_id,
        type: "booking",
        title: "Booking rejected",
        message: `Booking ${booking.id} (${booking.hostel_name}) was rejected by ${me.name ?? "admin"}. Reason: ${reason}`,
        link: "/manage/bookings",
        data: { booking_id: booking.id },
      });
    }

    await audit({
      user: me,
      action: "booking.rejected",
      resource: "bookings",
      resource_id: booking.id,
      details: `Rejected ${booking.id}. Reason: ${reason}`,
    });

    const [updated] = await pool.query("SELECT * FROM bookings WHERE id = ?", [booking.id]);
    res.json({
      ok: true,
      booking: { ...updated, applicant: parseApplicant(updated.applicant), tracking: parseTracking(updated.tracking) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;