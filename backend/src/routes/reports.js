import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Aggregated management reports — REST mirror of the Supabase `reports-api`
// edge function.  POST /api/reports  { hostelId?, wardenId?, status?, from?, to? }
const router = Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const [meRows] = await pool.query(
      "SELECT id, role, hostel_id FROM users WHERE id = ?",
      [req.user.id]
    );
    const me = meRows[0];
    if (!me || !["admin", "warden"].includes(me.role)) {
      return res.status(403).json({ error: "You do not have access to reports." });
    }

    const [hostels] = await pool.query(
      `SELECT h.id, h.name, h.gender,
              COUNT(hr.id) AS rooms,
              COALESCE(SUM(hr.capacity), 0) AS beds
       FROM hostels h
       LEFT JOIN hostel_rooms hr ON hr.hostel_id = h.id
       GROUP BY h.id, h.name, h.gender
       ORDER BY h.id ASC`
    );
    const [students] = await pool.query(
      "SELECT id, name, hostel_id, room, room_type, status, monthly_fee FROM students"
    );
    const [allComplaints] = await pool.query(
      "SELECT id, status, hostel_id, warden_id, priority, created_at, category FROM complaints"
    );
    const [users] = await pool.query(
      "SELECT id, name, role, hostel_id, position FROM users WHERE role = 'warden'"
    );

    const wardenByHostel = new Map();
    for (const w of users) if (w.hostel_id) wardenByHostel.set(Number(w.hostel_id), w.name);
    const wardenByHostelId = new Map();
    for (const w of users) if (w.hostel_id) wardenByHostelId.set(Number(w.hostel_id), String(w.id));

    let scope = me.role === "warden" ? (me.hostel_id ? Number(me.hostel_id) : null) : null;
    if (me.role !== "warden" && req.body.hostelId) scope = Number(req.body.hostelId);

    const wardenFilter = req.body.wardenId ? String(req.body.wardenId) : null;
    const statusFilter = req.body.status ? String(req.body.status) : null;
    const fromFilter = req.body.from ? String(req.body.from) : null;
    const toFilter = req.body.to ? String(req.body.to) : null;

    const allStudents = students;
    const studentsScoped = scope ? allStudents.filter((s) => Number(s.hostel_id) === scope) : allStudents;

    let complaints = scope
      ? allComplaints.filter((c) => Number(c.hostel_id) === scope)
      : allComplaints;
    if (wardenFilter) complaints = complaints.filter((c) => c.warden_id === wardenFilter);
    if (statusFilter) complaints = complaints.filter((c) => c.status === statusFilter);
    if (fromFilter) complaints = complaints.filter((c) => c.created_at >= fromFilter);
    if (toFilter) complaints = complaints.filter((c) => c.created_at <= toFilter);

    const visibleHostels = scope ? hostels.filter((h) => Number(h.id) === scope) : hostels;
    const activeStudents = studentsScoped.filter((s) => s.status !== "Left");

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
        warden: wardenByHostel.get(id) ?? null,
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

    const totalBeds = visibleHostels.reduce((s, h) => s + Number(h.beds), 0);
    const occupiedBeds = activeStudents.length;

    const byStatus = {};
    for (const c of allComplaints) {
      if (scope && Number(c.hostel_id) !== scope) continue;
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    }

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

    const wardenScope = scope ? users.filter((w) => Number(w.hostel_id) === scope) : users;
    const wardenStats = wardenScope
      .filter((w) => !wardenFilter || String(w.id) === wardenFilter)
      .map((w) => {
        const wid = String(w.id);
        const hostelId = w.hostel_id ? Number(w.hostel_id) : null;
        return {
          id: wid,
          name: w.name,
          position: w.position ?? "Warden",
          hostelId,
          hostel: hostelId ? visibleHostels.find((h) => Number(h.id) === hostelId)?.name ?? null : null,
          students: hostelId ? activeStudents.filter((s) => Number(s.hostel_id) === hostelId).length : 0,
          complaints: complaints.filter((c) => c.warden_id === wid).length,
          resolved: complaints.filter((c) => c.warden_id === wid && c.status === "Resolved").length,
          pending: complaints.filter((c) => c.warden_id === wid && c.status === "Pending").length,
        };
      });

    const monthlyExpected = activeStudents.reduce((s, st) => s + Number(st.monthly_fee ?? 0), 0);

    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scope,
      summary: {
        totalStudents: activeStudents.length,
        allStudents: studentsScoped.length,
        totalBeds,
        occupiedBeds,
        vacantBeds: Math.max(0, totalBeds - occupiedBeds),
        occupancy: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        monthlyExpected,
        totalComplaints: complaints.length,
        pendingComplaints: byStatus["Pending"] ?? 0,
        inProgressComplaints:
          (byStatus["In Progress"] ?? 0) +
          (byStatus["Under Review"] ?? 0) +
          (byStatus["Assigned"] ?? 0),
        resolvedComplaints: byStatus["Resolved"] ?? 0,
        rejectedComplaints: byStatus["Rejected"] ?? 0,
      },
      byStatus,
      studentsByHostel,
      studentsByRoom,
      complaintsByHostel,
      wardenStats,
      wardens: users.map((w) => ({ id: String(w.id), name: w.name, hostelId: w.hostel_id ? Number(w.hostel_id) : null })),
      hostels: visibleHostels.map((h) => ({ id: Number(h.id), name: h.name })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;