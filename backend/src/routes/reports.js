import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = Router();
router.use(requireAuth);

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace("T", " ");
}

async function meRow(req) {
  const [rows] = await pool.query("SELECT id, name, role, hostel_id FROM users WHERE id = ?", [req.user.id]);
  return rows[0] ?? { id: req.user.id, name: null, role: req.user.role, hostel_id: null };
}

function monthKey(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---- core data gathering ---------------------------------------------------

async function gather({ hostelId, wardenId, status, from, to, scopeHostel }) {
  const hostelsQ = `
    SELECT h.id, h.name, h.gender, h.code, h.location, h.phone, h.email,
           COUNT(hr.id) AS rooms, COALESCE(SUM(hr.capacity), 0) AS beds
    FROM hostels h
    LEFT JOIN hostel_rooms hr ON hr.hostel_id = h.id
    GROUP BY h.id, h.name, h.gender, h.code, h.location, h.phone, h.email
    ORDER BY h.id ASC`;
  const [allHostels] = await pool.query(hostelsQ);
  const [allStudents] = await pool.query(
    "SELECT id, name, hostel_id, room, bed, room_type, status, monthly_fee, join_date FROM students"
  );
  const [allComplaints] = await pool.query(
    "SELECT id, status, hostel_id, warden_id, priority, created_at, category FROM complaints"
  );
  const [allFees] = await pool.query(
    "SELECT id, student_id, month, amount, paid, status, collected_by, paid_at FROM fees"
  );
  const [allImprovements] = await pool.query(
    "SELECT id, status, hostel_id, warden_id, category, created_at FROM improvements"
  );
  const [allAttendance] = await pool.query(
    "SELECT id, student_id, date, check_in, check_out, status FROM attendance"
  );
  const [users] = await pool.query(
    "SELECT id, name, email, phone, position, role, hostel_id FROM users WHERE role = 'warden'"
  );

  let scope = scopeHostel ?? null;
  if (!scope && hostelId) scope = Number(hostelId);

  const visibleHostels = scope ? allHostels.filter((h) => Number(h.id) === scope) : allHostels;

  const students = scope ? allStudents.filter((s) => Number(s.hostel_id) === scope) : allStudents;
  const activeStudents = students.filter((s) => s.status !== "Left");

  let complaints = scope ? allComplaints.filter((c) => Number(c.hostel_id) === scope) : allComplaints;
  if (wardenId) complaints = complaints.filter((c) => c.warden_id === String(wardenId));
  if (status) complaints = complaints.filter((c) => c.status === status);
  if (from) complaints = complaints.filter((c) => (c.created_at ?? "") >= parseDate(from));
  if (to) complaints = complaints.filter((c) => (c.created_at ?? "") <= parseDate(to));

  const studentIds = new Set(students.map((s) => s.id));
  let fees = allFees.filter((f) => studentIds.has(Number(f.student_id)));
  if (from || to) {
    const fromMonth = from ? monthKey(parseDate(from)) : null;
    const toMonth = to ? monthKey(parseDate(to)) : null;
    fees = fees.filter((f) => {
      if (fromMonth && f.month < fromMonth) return false;
      if (toMonth && f.month > toMonth) return false;
      return true;
    });
  }

  const improvements = scope
    ? allImprovements.filter((i) => Number(i.hostel_id) === scope)
    : allImprovements;
  const improvementsScoped = wardenId
    ? improvements.filter((i) => String(i.warden_id) === String(wardenId))
    : improvements;

  const attendance = scope
    ? allAttendance.filter((a) => studentIds.has(Number(a.student_id)))
    : allAttendance;

  const bookings = scope
    ? await (async () => {
        const [rows] = await pool.query("SELECT * FROM bookings WHERE hostel_id = ?", [scope]);
        return rows;
      })()
    : await (async () => {
        const [rows] = await pool.query("SELECT * FROM bookings");
        return rows;
      })();

  // Warden-wise stats (used for the per-warden report).
  const wardenScope = wardenId ? users.filter((w) => String(w.id) === String(wardenId)) : users;
  const wardenStats = wardenScope
    .filter((w) => !scope || Number(w.hostel_id) === scope)
    .map((w) => {
      const wid = String(w.id);
      const hostelId = Number(w.hostel_id) || null;
      const hostelStudents = hostelId ? activeStudents.filter((s) => Number(s.hostel_id) === hostelId) : [];
      const wardedComplaints = complaints.filter((c) => c.warden_id === wid);
      const wardedFees = fees.filter(
        (f) => hostelId && studentIds.has(Number(f.student_id)) && hostelStudents.some((s) => s.id === f.student_id)
      );
      return {
        id: wid,
        name: w.name,
        email: w.email,
        phone: w.phone,
        position: w.position ?? "Warden",
        hostelId,
        hostel: hostelId ? visibleHostels.find((h) => Number(h.id) === hostelId)?.name ?? null : null,
        students: hostelStudents.length,
        complaints: wardedComplaints.length,
        resolved: wardedComplaints.filter((c) => c.status === "Resolved").length,
        pending: wardedComplaints.filter((c) => c.status === "Pending").length,
        feeCollected: wardedFees.filter((f) => f.status === "fetched").reduce((s, f) => s + Number(f.amount), 0),
        feePending: wardedFees
          .filter((f) => f.status !== "fetched")
          .reduce((s, f) => s + Number(f.amount), 0),
        improvements: improvementsScoped.filter((i) => String(i.warden_id) === wid).length,
        checkIns: attendance.filter(
          (a) => hostelId && hostelStudents.some((s) => s.id === a.student_id) && a.check_in
        ).length,
        checkOuts: attendance.filter(
          (a) => hostelId && hostelStudents.some((s) => s.id === a.student_id) && a.check_out
        ).length,
      };
    });

  const totalBeds = visibleHostels.reduce((s, h) => s + Number(h.beds), 0);
  const occupiedBeds = activeStudents.length;
  const byStatus = {};
  for (const c of complaints) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

  const feeCollected = fees.filter((f) => f.status === "fetched").reduce((s, f) => s + Number(f.amount), 0);
  const feePending = fees.filter((f) => f.status !== "fetched").reduce((s, f) => s + Number(f.amount), 0);
  const feeOverdue = fees.filter((f) => f.status === "unfetched").reduce((s, f) => s + Number(f.amount), 0);
  const feeTotal = fees.reduce((s, f) => s + Number(f.amount), 0);

  const improvementByStatus = {};
  for (const i of improvementsScoped) improvementByStatus[i.status] = (improvementByStatus[i.status] ?? 0) + 1;

  const checkIns = attendance.filter((a) => a.check_in).length;
  const checkOuts = attendance.filter((a) => a.check_out).length;

  const bookingByStatus = {};
  for (const b of bookings) bookingByStatus[b.status] = (bookingByStatus[b.status] ?? 0) + 1;

  const summary = {
    totalStudents: activeStudents.length,
    allStudents: students.length,
    totalBeds,
    occupiedBeds,
    vacantBeds: Math.max(0, totalBeds - occupiedBeds),
    occupancy: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    monthlyExpected: activeStudents.reduce((s, st) => s + Number(st.monthly_fee ?? 0), 0),
    totalComplaints: complaints.length,
    pendingComplaints: byStatus["Pending"] ?? 0,
    inProgressComplaints:
      (byStatus["In Progress"] ?? 0) + (byStatus["Under Review"] ?? 0) + (byStatus["Assigned"] ?? 0),
    resolvedComplaints: byStatus["Resolved"] ?? 0,
    rejectedComplaints: byStatus["Rejected"] ?? 0,
    feeCollected,
    feePending,
    feeOverdue,
    feeTotal,
    collectionRate: feeTotal ? Math.round((feeCollected / feeTotal) * 100) : 0,
    paidStudents: new Set(fees.filter((f) => f.status === "fetched").map((f) => f.student_id)).size,
    pendingFeeStudents: new Set(fees.filter((f) => f.status !== "fetched").map((f) => f.student_id)).size,
    totalImprovements: improvementsScoped.length,
    improvementsImplemented: improvementByStatus["Implemented"] ?? 0,
    improvementsAccepted: improvementByStatus["Accepted"] ?? 0,
    improvementsReviewing: improvementByStatus["Reviewing"] ?? 0,
    improvementsRejected: improvementByStatus["Rejected"] ?? 0,
    totalBookings: bookings.length,
    pendingBookings: bookingByStatus["pending"] ?? 0,
    approvedBookings: bookingByStatus["approved"] ?? 0,
    rejectedBookings: bookingByStatus["rejected"] ?? 0,
    cancelledBookings: bookingByStatus["cancelled"] ?? 0,
    completedBookings: bookingByStatus["completed"] ?? 0,
    checkIns,
    checkOuts,
    currentResidents: checkIns - checkOuts < 0 ? 0 : checkIns - checkOuts,
  };

  const studentsByHostel = visibleHostels.map((h) => {
    const id = Number(h.id);
    const count = activeStudents.filter((s) => Number(s.hostel_id) === id).length;
    return {
      id,
      name: h.name,
      gender: h.gender,
      students: count,
      beds: Number(h.beds),
      rooms: Number(h.rooms),
      occupied: count,
      vacant: Math.max(0, Number(h.beds) - count),
      occupancy: Number(h.beds) ? Math.round((count / Number(h.beds)) * 100) : 0,
      warden: users.find((w) => Number(w.hostel_id) === id)?.name ?? null,
    };
  });

  const roomMap = new Map();
  for (const s of activeStudents) {
    const key = `${Number(s.hostel_id) || "?"}|${s.room || "Unassigned"}`;
    roomMap.set(key, (roomMap.get(key) ?? 0) + 1);
  }
  const studentsByRoom = Array.from(roomMap.entries())
    .map(([key, count]) => {
      const parts = key.split("|");
      return { hostelId: Number(parts[0]), room: parts[1], count };
    })
    .sort((a, b) => a.room.localeCompare(b.room));

  const complaintsByHostel = visibleHostels.map((h) => {
    const id = Number(h.id);
    return {
      id,
      name: h.name,
      total: complaints.filter((c) => Number(c.hostel_id) === id).length,
      pending: complaints.filter((c) => Number(c.hostel_id) === id && c.status === "Pending").length,
      resolved: complaints.filter((c) => Number(c.hostel_id) === id && c.status === "Resolved").length,
    };
  });

  return {
    summary,
    byStatus: { ...byStatus, ...Object.fromEntries(COMPLAINT_STATUSES.map((s) => [s, byStatus[s] ?? 0])) },
    improvementByStatus,
    bookingByStatus,
    studentsByHostel,
    studentsByRoom,
    complaintsByHostel,
    wardenStats,
    totalBeds,
    occupiedBeds,
    wardens: users.map((w) => ({ id: String(w.id), name: w.name, hostelId: w.hostel_id != null ? Number(w.hostel_id) : null })),
    hostels: visibleHostels.map((h) => ({ id: Number(h.id), name: h.name })),
  };
}

const COMPLAINT_STATUSES = ["Pending", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"];

function buildResponse(data, me, { hostelId, wardenId, status, from, to }) {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: hostelId ? Number(hostelId) : null,
    summary: data.summary,
    byStatus: data.byStatus,
    improvementByStatus: data.improvementByStatus,
    bookingByStatus: data.bookingByStatus,
    studentsByHostel: data.studentsByHostel,
    studentsByRoom: data.studentsByRoom,
    complaintsByHostel: data.complaintsByHostel,
    wardenStats: data.wardenStats,
    wardens: data.wardens,
    hostels: data.hostels,
    generatedBy: me.name ?? null,
    filters: { hostelId: hostelId ? Number(hostelId) : null, wardenId: wardenId || null, status: status || null, from: from || null, to: to || null },
  };
}

// POST /api/reports — aggregated figures
router.post("/", async (req, res) => {
  try {
    const me = await meRow(req);
    if (!["admin", "warden"].includes(me.role)) {
      return res.status(403).json({ error: "You do not have access to reports." });
    }
    let hostelId = me.role === "warden" ? (me.hostel_id != null ? Number(me.hostel_id) : null) : null;
    if (me.role !== "warden" && req.body.hostelId) hostelId = Number(req.body.hostelId);
    const wardenId = req.body.wardenId ? String(req.body.wardenId) : null;
    const status = req.body.status ? String(req.body.status) : null;
    const from = req.body.from ? String(req.body.from) : null;
    const to = req.body.to ? String(req.body.to) : null;

    const data = await gather({ hostelId, wardenId, status, from, to });
    res.json(buildResponse(data, me, { hostelId, wardenId, status, from, to }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- PDF rendering ---------------------------------------------------------

function hex(n, w = 2) {
  return String(n).padStart(w, "0");
}
function shortDate(d) {
  const dt = d ? new Date(d) : new Date();
  return `${hex(dt.getFullYear(), 4)}-${hex(dt.getMonth() + 1)}-${hex(dt.getDate())}`;
}

function money(n) {
  return `PKR ${(Number(n) || 0).toLocaleString("en-US")}`;
}

function makeDoc() {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  return doc;
}

// Paint a footer with page numbers on every buffered page after content ends.
function paintFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc.fontSize(8).fillColor("#94a3b8");
    doc.text("Mubarak Hostels MGH", 48, doc.page.height - 40, { width: 200 });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, doc.page.width - 148, doc.page.height - 40, { width: 100, align: "right" });
    doc.restore();
  }
  doc.switchToPage(range.count - 1);
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - 70) {
    doc.addPage();
  }
}

function drawSectionTitle(doc, text) {
  ensureSpace(doc, 34);
  doc.moveDown(0.4);
  doc.fillColor("#0f172a").fontSize(13).text(text.toUpperCase(), { characterSpacing: 0.6 });
  doc.moveDown(0.25);
  const y = doc.y;
  doc.strokeColor("#1d4ed8").lineWidth(1.6);
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.moveDown(0.55);
}

function drawKVTable(doc, rows, colsPerRow = 3) {
  let x = doc.page.margins.left;
  let y = doc.y;
  const minRowH = 20;
  const labelW = 78;
  const colGap = 10;
  const widthPerCol = (doc.page.width - doc.page.margins.left - doc.page.margins.right - colGap * (colsPerRow - 1)) / colsPerRow;
  let row = [];
  const startY = y;
  const flushRow = () => {
    if (!row.length) return;
    row.forEach(({ label, value }, i) => {
      const cx = doc.page.margins.left + i * (widthPerCol + colGap);
      doc.fillColor("#f1f5f9").rect(cx, y, widthPerCol, minRowH).fill();
      doc.fillColor("#64748b").fontSize(7.5).text(label.toUpperCase(), cx + 6, y + 3, { characterSpacing: 0.3 });
      doc.fillColor("#0f172a").fontSize(8.5).text(value, cx + 6, y + 12, { width: widthPerCol - 12 });
    });
    y += minRowH;
    row = [];
  };
  for (const item of rows) {
    row.push(item);
    if (row.length === colsPerRow) flushRow();
    if (y > doc.page.height - 80) {
      flushRow();
      doc.addPage();
      y = doc.y;
    }
  }
  flushRow();
  doc.y = y;
  doc.moveDown(0.2);
  void startY;
}

function drawTable(doc, headers, dataRows, colWidths) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const usable = right - left;
  const widths = colWidths ?? headers.map(() => usable / headers.length);
  const rowH = 22;

  const drawHeader = () => {
    let x = left;
    doc.fillColor("#1e293b");
    doc.rect(left, doc.y, usable, rowH).fill();
    headers.forEach((h, i) => {
      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold").text(h, x + 5, doc.y + 7, { width: widths[i] - 10 });
      x += widths[i];
    });
    doc.moveDown(rowH);
  };

  ensureSpace(doc, rowH * 2);
  drawHeader();

  let i = 0;
  const drawRow = (cells, alt) => {
    if (doc.y + rowH > doc.page.height - 60) {
      doc.addPage();
      drawHeader();
    }
    let x = left;
    doc.fillColor(alt ? "#f8fafc" : "#ffffff");
    doc.rect(left, doc.y, usable, rowH).fill();
    cells.forEach((c, ci) => {
      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica").text(String(c ?? "—"), x + 5, doc.y + 7, { width: widths[ci] - 10 });
      x += widths[ci];
    });
    doc.moveDown(rowH);
  };

  for (; i < dataRows.length; i++) {
    drawRow(dataRows[i], i % 2 === 1);
  }
  doc.moveDown(0.2);
}

// GET /api/reports/pdf?wardenId=&hostelId=&from=&to=
router.get("/pdf", async (req, res) => {
  try {
    const me = await meRow(req);
    if (!["admin", "warden"].includes(me.role)) {
      return res.status(403).json({ error: "You do not have access to reports." });
    }
    const wardenId = req.query.wardenId ? String(req.query.wardenId) : null;
    const hostelFilter = req.query.hostelId ? Number(req.query.hostelId) : null;

    let hostelId = me.role === "warden" ? (me.hostel_id != null ? Number(me.hostel_id) : null) : hostelFilter;
    if (wardenId) {
      const [wRows] = await pool.query("SELECT id, hostel_id FROM users WHERE id = ? AND role = 'warden'", [wardenId]);
      if (wRows.length && wRows[0].hostel_id != null) hostelId = Number(wRows[0].hostel_id);
    }

    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;
    const status = req.query.status ? String(req.query.status) : null;

    const data = await gather({ hostelId, wardenId, status, from, to });

    const doc = makeDoc();
    const s = data.summary;

    // ---- header ----
    doc.fillColor("#1d4ed8").rect(0, 0, doc.page.width, 96).fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("MUBARAK HOSTELS MGH", 48, 28);
    doc.font("Helvetica").fontSize(10).text("Hostel Management System — Official Report", 48, 54);
    doc.fontSize(8).text("Main Campus · Rawalpindi · Pakistan", 48, 68);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1d4ed8").text("MANAGEMENT REPORT", 48, 112);
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text(
      `Report ID: RPT-${shortDate(new Date())}-${String(Date.now()).slice(-5)}`,
      48, 128
    );
    doc.text(`Generated on: ${new Date().toLocaleString("en-US")}`, 48, 140);
    doc.text(`Generated by: ${me.name ?? "Super Admin"}`, 48, 152);
    if (from || to) doc.text(`Period: ${from ? shortDate(from) : "..."} to ${to ? shortDate(to) : "..."}`, 48, 164);

    const warden = wardenId ? data.wardenStats.find((w) => String(w.id) === String(wardenId)) : null;

    // ---- warden block ----
    if (warden) {
      drawSectionTitle(doc, "Warden Information");
      drawKVTable(doc, [
        { label: "Warden name", value: warden.name },
        { label: "Position", value: warden.position },
        { label: "Warden ID", value: `#${warden.id}` },
        { label: "Email", value: warden.email || "—" },
        { label: "Phone", value: warden.phone || "—" },
        { label: "Assigned hostel", value: warden.hostel || "Unassigned" },
        { label: "Students", value: String(warden.students) },
        { label: "Fees collected", value: money(warden.feeCollected) },
        { label: "Complaints", value: String(warden.complaints) },
      ], 3);
    } else {
      drawSectionTitle(doc, "Report Scope");
      drawKVTable(doc, [
        { label: "Scope", value: hostelId ? "Single hostel" : "All hostels" },
        { label: "Generated by", value: me.name ?? "Super Admin" },
        { label: "Report format", value: "A4 PDF" },
      ], 3);
    }

    // ---- summary stats ----
    drawSectionTitle(doc, "Summary Statistics");
    drawKVTable(doc, [
      { label: "Total students", value: String(s.totalStudents) },
      { label: "Active residents", value: String(s.totalStudents) },
      { label: "Occupancy", value: `${s.occupancy}%` },
      { label: "Total beds", value: String(s.totalBeds) },
      { label: "Vacant beds", value: String(s.vacantBeds) },
      { label: "Occupied beds", value: String(s.occupiedBeds) },
      { label: "Fee collected", value: money(s.feeCollected) },
      { label: "Fee pending", value: money(s.feePending) },
      { label: "Collection rate", value: `${s.collectionRate}%` },
      { label: "Total complaints", value: String(s.totalComplaints) },
      { label: "Open complaints", value: String(s.pendingComplaints + s.inProgressComplaints) },
      { label: "Resolved complaints", value: String(s.resolvedComplaints) },
    ], 3);

    // ---- bookings ----
    drawSectionTitle(doc, "Booking Statistics");
    drawKVTable(doc, [
      { label: "Total bookings", value: String(s.totalBookings) },
      { label: "Pending", value: String(s.pendingBookings) },
      { label: "Approved", value: String(s.approvedBookings) },
      { label: "Rejected", value: String(s.rejectedBookings) },
      { label: "Cancelled", value: String(s.cancelledBookings) },
      { label: "Completed", value: String(s.completedBookings) },
    ], 3);

    // ---- fee table ----
    drawSectionTitle(doc, "Fee Collection Summary");
    drawTable(doc,
      ["Metric", "Value"],
      [
        ["Total expected fees", money(s.feeTotal)],
        ["Collected (fetched)", money(s.feeCollected)],
        ["Pending", money(s.feePending)],
        ["Overdue (unfetched)", money(s.feeOverdue)],
        ["Collection percentage", `${s.collectionRate}%`],
        ["Students fully paid", String(s.paidStudents)],
        ["Students with pending fees", String(s.pendingFeeStudents)],
      ],
      [doc.page.width - 260, 120]
    );

    // ---- students table ----
    drawSectionTitle(doc, "Students by Hostel");
    if (data.studentsByHostel.length) {
      drawTable(doc,
        ["Hostel", "Warden", "Students", "Beds", "Vacant", "Occupancy %"],
        data.studentsByHostel.map((h) => [h.name, h.warden ?? "—", String(h.students), String(h.beds), String(h.vacant), `${h.occupancy}%`]),
        [130, 130, 80, 60, 60, 70]
      );
    } else {
      doc.fillColor("#64748b").fontSize(9).text("No hostels in scope.");
      doc.moveDown(0.3);
    }

    // ---- attendance ----
    drawSectionTitle(doc, "Attendance");
    drawTable(doc,
      ["Metric", "Value"],
      [
        ["Total check-ins", String(s.checkIns)],
        ["Total check-outs", String(s.checkOuts)],
        ["Current residents", String(s.currentResidents)],
      ],
      [doc.page.width - 260, 120]
    );

    // ---- complaints ----
    drawSectionTitle(doc, "Complaints");
    drawTable(doc,
      ["Metric", "Count"],
      [
        ["Total complaints", String(s.totalComplaints)],
        ["Pending", String(s.pendingComplaints)],
        ["In progress / review", String(s.inProgressComplaints)],
        ["Resolved", String(s.resolvedComplaints)],
        ["Rejected", String(s.rejectedComplaints)],
      ],
      [doc.page.width - 260, 120]
    );

    // ---- improvements ----
    drawSectionTitle(doc, "Improvements & Suggestions");
    drawTable(doc,
      ["Metric", "Count"],
      [
        ["Total suggestions", String(s.totalImprovements)],
        ["Under review", String(s.improvementsReviewing)],
        ["Accepted", String(s.improvementsAccepted)],
        ["Implemented", String(s.improvementsImplemented)],
        ["Rejected", String(s.improvementsRejected)],
      ],
      [doc.page.width - 260, 120]
    );

    // ---- warden-wise detail ----
    if (!warden && data.wardenStats.length) {
      drawSectionTitle(doc, "Warden-wise Statistics");
      drawTable(doc,
        ["Warden", "Hostel", "Students", "Fees collected", "Complaints", "Resolved", "Suggestions"],
        data.wardenStats.map((w) => [
          w.name, w.hostel ?? "—", String(w.students), money(w.feeCollected),
          String(w.complaints), String(w.resolved), String(w.improvements),
        ]),
        [110, 120, 60, 90, 70, 60, 70]
      );
    }

    // ---- footer notes ----
    ensureSpace(doc, 90);
    drawSectionTitle(doc, "Additional Information");
    doc.fillColor("#334155").fontSize(8.5).text(
      "This report was generated automatically from live records in the Mubarak Hostels MGH database. " +
      "Figures for fees, attendance, complaints and improvements reflect the selected scope and date period. " +
      "Any concerns about the data shown above should be raised with the Super Admin.",
      { width: doc.page.width - 96 }
    );
    doc.moveDown(1.4);
    doc.fontSize(9).fillColor("#0f172a");
    doc.text("Prepared by: Mubarak Hostels MGH Management System", 48, doc.y);
    doc.moveDown(0.3);
    doc.text(`Signed-in user: ${me.name ?? "Super Admin"} (${me.role})`, 48, doc.y);

    // With bufferPages the footer must be painted before the stream ends.
    paintFooters(doc);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="MGH-Report-${shortDate(new Date())}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;