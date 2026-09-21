import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Per-hostel room / bed / allocation management — REST mirror of the Supabase
// `rooms`, `beds` and `room_allocations` tables surfaced through roomsDb.ts.
//
//   GET    /api/rooms/data?hostelId=N       -> { rooms, beds, allocations }
//   POST   /api/rooms/assign                -> { studentId, hostelId, roomNumber, bedNumber }
//   POST   /api/rooms/unassign              -> { studentId }
//   POST   /api/rooms/beds/:bedId/maintenance -> { isMaintenance }
//   POST   /api/rooms/add                   -> add room + its beds
//   POST   /api/rooms/bulk                  -> bulk import of rooms + beds
//   PUT    /api/rooms/:roomId               -> update room (adds beds when capacity grows)
//   DELETE /api/rooms/:roomId               -> delete room + beds
//   GET    /api/rooms/occupancy?hostelIds=1,2 -> Record<hostelId, {totalBeds, occupiedBeds}>
//   GET    /api/rooms/keys                  -> existing [{hostel_id, room_number}] keys (import validation)
//   GET    /api/rooms/public-availability/:hostelId -> public room availability (no auth)
//   GET    /api/rooms/booking-rooms?hostelId=N      -> booking-ready room list (no auth)
const router = Router();

function publicError(res, err) {
  return res.status(500).json({ error: err.message });
}

// GET /data
router.get("/data", requireAuth, async (req, res) => {
  try {
    const hostelId = Number(req.query.hostelId);
    if (!hostelId) return res.status(400).json({ error: "hostelId is required." });

    const [rooms] = await pool.query(
      "SELECT * FROM hostel_rooms WHERE hostel_id = ? ORDER BY floor ASC, room_number ASC",
      [hostelId]
    );
    const roomIds = rooms.map((r) => r.id);

    let beds = [];
    let allocations = [];
    if (roomIds.length) {
      const [b] = await pool.query(
        "SELECT * FROM hostel_beds WHERE room_id IN (?) ORDER BY room_id ASC, bed_number ASC",
        [roomIds]
      );
      beds = b;

      const [a] = await pool.query(
        `SELECT ra.id, ra.student_id, ra.room_id, ra.bed_id, s.name
         FROM room_allocations ra
         LEFT JOIN students s ON s.id = ra.student_id
         WHERE ra.room_id IN (?)
         ORDER BY ra.room_id ASC`,
        [roomIds]
      );
      allocations = a.map((row) => ({
        id: Number(row.id),
        student_id: Number(row.student_id),
        room_id: Number(row.room_id),
        bed_id: Number(row.bed_id),
        students: row.name ? { name: row.name } : null,
      }));
    }

    res.json({
      rooms: rooms.map((r) => ({
        id: Number(r.id),
        hostel_id: Number(r.hostel_id),
        room_number: r.room_number,
        floor: Number(r.floor),
        room_type: r.room_type,
        capacity: Number(r.capacity),
        status: r.status,
        building_id: r.building_id != null ? Number(r.building_id) : null,
        block_id: r.block_id != null ? Number(r.block_id) : null,
      })),
      beds: beds.map((b) => ({
        id: Number(b.id),
        room_id: Number(b.room_id),
        bed_number: Number(b.bed_number),
        is_maintenance: Boolean(b.is_maintenance),
      })),
      allocations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /assign
router.post("/assign", requireAuth, async (req, res) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const conn = await pool.getConnection();
    try {
      const { studentId, hostelId, roomNumber, bedNumber } = req.body;
      if (!studentId || !hostelId || !roomNumber || !bedNumber) {
        conn.release();
        return res.status(400).json({ error: "studentId, hostelId, roomNumber and bedNumber are required." });
      }
      await conn.beginTransaction();

      const [rooms] = await conn.query(
        "SELECT id, capacity FROM hostel_rooms WHERE hostel_id = ? AND room_number = ? LIMIT 1",
        [hostelId, roomNumber]
      );
      if (!rooms.length) throw new Error("Room not found.");
      const room = rooms[0];

      const [beds] = await conn.query(
        "SELECT id, is_maintenance FROM hostel_beds WHERE room_id = ? AND bed_number = ? LIMIT 1",
        [room.id, bedNumber]
      );
      if (!beds.length) throw new Error("Bed not found.");
      const bed = beds[0];
      if (bed.is_maintenance) throw new Error("This bed is under maintenance.");

      const [existing] = await conn.query(
        "SELECT id, student_id FROM room_allocations WHERE bed_id = ? LIMIT 1",
        [bed.id]
      );
      if (existing.length && Number(existing[0].student_id) !== Number(studentId)) {
        throw new Error("This bed is already occupied.");
      }

      await conn.query("DELETE FROM room_allocations WHERE student_id = ?", [studentId]);
      await conn.query(
        "INSERT INTO room_allocations (student_id, room_id, bed_id) VALUES (?, ?, ?)",
        [studentId, room.id, bed.id]
      );
      await conn.query(
        "UPDATE students SET room = ?, bed = ?, hostel_id = ? WHERE id = ?",
        [roomNumber, bedNumber, hostelId, studentId]
      );

      await conn.commit();
      conn.release();
      return res.json({ ok: true });
    } catch (err) {
      await conn.rollback();
      conn.release();
      if (err.code === "ER_LOCK_DEADLOCK") continue;
      return res.status(err.status || 400).json({ error: err.message });
    }
  }
  return res.status(500).json({ error: "Could not assign the bed, please try again." });
});

// POST /unassign
router.post("/unassign", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId is required." });
    await pool.query("DELETE FROM room_allocations WHERE student_id = ?", [studentId]);
    await pool.query("UPDATE students SET room = NULL, bed = NULL WHERE id = ?", [studentId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /beds/:bedId/maintenance
router.post("/beds/:bedId/maintenance", requireAuth, async (req, res) => {
  try {
    const isMaintenance = Boolean(req.body.isMaintenance);
    await pool.query("UPDATE hostel_beds SET is_maintenance = ? WHERE id = ?", [
      isMaintenance ? 1 : 0,
      Number(req.params.bedId),
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /add
router.post("/add", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body;
    const hostelId = Number(b.hostelId);
    const roomNumber = String(b.roomNumber || "").trim();
    if (!hostelId || !roomNumber) {
      conn.release();
      return res.status(400).json({ error: "hostelId and roomNumber are required." });
    }
    await conn.beginTransaction();

    const [dup] = await conn.query(
      "SELECT id FROM hostel_rooms WHERE hostel_id = ? AND room_number = ?",
      [hostelId, roomNumber]
    );
    if (dup.length) throw new Error("A room with this number already exists in this hostel.");

    const [result] = await conn.query(
      `INSERT INTO hostel_rooms (hostel_id, building_id, block_id, room_number, floor, room_type, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hostelId,
        b.buildingId ? Number(b.buildingId) : null,
        b.blockId ? Number(b.blockId) : null,
        roomNumber,
        Number(b.floor ?? 1),
        String(b.roomType || ""),
        Number(b.capacity ?? 3),
        String(b.status || "active"),
      ]
    );
    const roomId = Number(result.insertId);
    const capacity = Number(b.capacity ?? 3);
    for (let n = 1; n <= capacity; n++) {
      await conn.query(
        "INSERT INTO hostel_beds (room_id, bed_number) VALUES (?, ?)",
        [roomId, n]
      );
    }
    await conn.commit();
    conn.release();
    res.status(201).json({ ok: true, id: roomId });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(400).json({ error: err.message });
  }
});

// POST /bulk — bulk import of rooms + beds
router.post("/bulk", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const rows = Array.isArray(req.body.payload) ? req.body.payload : [];
    if (!rows.length) {
      conn.release();
      return res.json({ inserted: 0, bedsCreated: 0 });
    }
    await conn.beginTransaction();
    let inserted = 0;
    let bedsCreated = 0;
    for (const r of rows) {
      const [dup] = await conn.query(
        "SELECT id FROM hostel_rooms WHERE hostel_id = ? AND room_number = ?",
        [r.hostelId, String(r.roomNumber || "")]
      );
      if (dup.length) continue;
      const [result] = await conn.query(
        `INSERT INTO hostel_rooms (hostel_id, building_id, block_id, room_number, floor, room_type, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(r.hostelId),
          r.buildingId ? Number(r.buildingId) : null,
          r.blockId ? Number(r.blockId) : null,
          String(r.roomNumber || "").trim(),
          Number(r.floor ?? 1),
          String(r.roomType || ""),
          Number(r.capacity ?? 3),
          String(r.status || "active"),
        ]
      );
      inserted += 1;
      const roomId = Number(result.insertId);
      const capacity = Number(r.capacity ?? 3);
      for (let n = 1; n <= capacity; n++) {
        await conn.query(
          "INSERT INTO hostel_beds (room_id, bed_number) VALUES (?, ?)",
          [roomId, n]
        );
        bedsCreated += 1;
      }
    }
    await conn.commit();
    conn.release();
    res.json({ inserted, bedsCreated });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: err.message });
  }
});

// PUT /:roomId
router.put("/:roomId", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const roomId = Number(req.params.roomId);
    const b = req.body;
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT capacity FROM hostel_rooms WHERE id = ?", [roomId]);
    if (!rows.length) throw new Error("Room not found.");
    const currentCapacity = Number(rows[0].capacity);

    const fields = [];
    const params = [];
    if (b.room_number !== undefined) { fields.push("room_number = ?"); params.push(String(b.room_number)); }
    if (b.floor !== undefined) { fields.push("floor = ?"); params.push(Number(b.floor)); }
    if (b.room_type !== undefined) { fields.push("room_type = ?"); params.push(String(b.room_type)); }
    if (b.status !== undefined) { fields.push("status = ?"); params.push(String(b.status)); }
    if (b.capacity !== undefined) { fields.push("capacity = ?"); params.push(Number(b.capacity)); }
    if (b.building_id !== undefined) { fields.push("building_id = ?"); params.push(b.building_id ? Number(b.building_id) : null); }
    if (b.block_id !== undefined) { fields.push("block_id = ?"); params.push(b.block_id ? Number(b.block_id) : null); }

    if (fields.length) {
      await conn.query(`UPDATE hostel_rooms SET ${fields.join(", ")} WHERE id = ?`, [...params, roomId]);
    }

    if (b.capacity !== undefined && Number(b.capacity) > currentCapacity) {
      for (let n = currentCapacity + 1; n <= Number(b.capacity); n++) {
        await conn.query(
          "INSERT INTO hostel_beds (room_id, bed_number) VALUES (?, ?)",
          [roomId, n]
        );
      }
    }

    await conn.commit();
    conn.release();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(400).json({ error: err.message });
  }
});

// DELETE /:roomId
router.delete("/:roomId", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const roomId = Number(req.params.roomId);
    await conn.beginTransaction();
    const [beds] = await conn.query("SELECT id FROM hostel_beds WHERE room_id = ?", [roomId]);
    if (beds.length) {
      await conn.query("DELETE FROM room_allocations WHERE bed_id IN (?)", [beds.map((x) => x.id)]);
    }
    await conn.query("DELETE FROM hostel_beds WHERE room_id = ?", [roomId]);
    await conn.query("DELETE FROM hostel_rooms WHERE id = ?", [roomId]);
    await conn.commit();
    conn.release();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: err.message });
  }
});

// GET /occupancy
router.get("/occupancy", requireAuth, async (_req, res) => {
  try {
    const [rooms] = await pool.query("SELECT id, hostel_id, capacity FROM hostel_rooms");
    const result = {};
    for (const r of rooms) {
      const key = Number(r.hostel_id);
      result[key] = result[key] ?? { totalBeds: 0, occupiedBeds: 0 };
      result[key].totalBeds += Number(r.capacity);
    }
    if (rooms.length) {
      const ids = rooms.map((r) => r.id);
      const [allocRows] = await pool.query(
        "SELECT room_id, COUNT(*) AS n FROM room_allocations WHERE room_id IN (?) GROUP BY room_id",
        [ids]
      );
      const byRoom = {};
      for (const a of allocRows) byRoom[a.room_id] = Number(a.n);
      for (const r of rooms) {
        result[Number(r.hostel_id)].occupiedBeds += byRoom[r.id] ?? 0;
      }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /keys — existing (hostel_id, room_number) pairs for import validation
router.get("/keys", requireAuth, async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT hostel_id, room_number FROM hostel_rooms");
    res.json(rows.map((r) => ({ hostel_id: Number(r.hostel_id), room_number: r.room_number })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /public-availability/:hostelId — the public rooms page payload
router.get("/public-availability/:hostelId", async (req, res) => {
  try {
    const hostelId = Number(req.params.hostelId);
    const [rooms] = await pool.query(
      "SELECT * FROM hostel_rooms WHERE hostel_id = ? AND status = 'active'",
      [hostelId]
    );
    const roomIds = rooms.map((r) => r.id);
    let beds = [];
    let allocations = [];
    if (roomIds.length) {
      const [b] = await pool.query(
        "SELECT id, room_id, bed_number, is_maintenance FROM hostel_beds WHERE room_id IN (?)",
        [roomIds]
      );
      beds = b;
      const [a] = await pool.query(
        "SELECT room_id, bed_id FROM room_allocations WHERE room_id IN (?)",
        [roomIds]
      );
      allocations = a;
    }

    const occupiedBeds = new Set(allocations.map((a) => a.bed_id));
    const roomsView = rooms
      .sort(
        (a, b) =>
          Number(a.floor) - Number(b.floor) ||
          String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })
      )
      .map((r) => {
        const roomBeds = beds.filter((x) => Number(x.room_id) === Number(r.id));
        const occupied = roomBeds.filter((x) => occupiedBeds.has(x.id)).length;
        const maintenance = roomBeds.filter((x) => x.is_maintenance).length;
        return {
          id: Number(r.id),
          hostelId: Number(r.hostel_id),
          roomNumber: r.room_number,
          block: String(r.room_number).charAt(0),
          floor: Number(r.floor),
          roomType: r.room_type,
          capacity: Number(r.capacity),
          occupied,
          maintenance,
          available: Math.max(0, Number(r.capacity) - occupied - maintenance),
        };
      });

    const totalBeds = roomsView.reduce((s, r) => s + r.capacity, 0);
    const occupiedCount = roomsView.reduce((s, r) => s + r.occupied, 0);
    const maintenanceBeds = roomsView.reduce((s, r) => s + r.maintenance, 0);

    res.json({
      rooms: roomsView,
      totalRooms: roomsView.length,
      totalBeds,
      occupiedBeds: occupiedCount,
      availableBeds: Math.max(0, totalBeds - occupiedCount - maintenanceBeds),
      maintenanceBeds,
      availableRooms: roomsView.filter((r) => r.available > 0).length,
      fullRooms: roomsView.filter((r) => r.available <= 0).length,
      floors: new Set(roomsView.map((r) => r.floor)).size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /booking-rooms?hostelId=N — bed-level availability for the booking flow
router.get("/booking-rooms", async (req, res) => {
  try {
    const hostelId = Number(req.query.hostelId);
    if (!hostelId) return res.status(400).json({ error: "hostelId is required." });

    const [rooms] = await pool.query(
      "SELECT * FROM hostel_rooms WHERE hostel_id = ? AND status = 'active'",
      [hostelId]
    );
    const roomIds = rooms.map((r) => r.id);

    let beds = [];
    let allocations = [];
    let pending = [];
    if (roomIds.length) {
      const [b] = await pool.query(
        "SELECT id, room_id, bed_number, is_maintenance FROM hostel_beds WHERE room_id IN (?) ORDER BY bed_number ASC",
        [roomIds]
      );
      beds = b;
      const [a] = await pool.query(
        "SELECT room_id, bed_id FROM room_allocations WHERE room_id IN (?)",
        [roomIds]
      );
      allocations = a;
      const [p] = await pool.query(
        "SELECT room_label, bed_number FROM bookings WHERE hostel_id = ? AND status = 'pending'",
        [hostelId]
      );
      pending = p;
    }

    const occupiedBeds = new Set(allocations.map((a) => a.bed_id));
    const pendingBeds = new Set(pending.map((p) => `${p.room_label}-${Number(p.bed_number)}`));

    const out = rooms
      .sort(
        (a, b) =>
          Number(a.floor) - Number(b.floor) ||
          String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })
      )
      .map((r) => {
        const roomBeds = beds.filter((x) => Number(x.room_id) === Number(r.id));
        const mapped = roomBeds.map((bed) => {
          let status = "available";
          if (bed.is_maintenance) status = "maintenance";
          else if (occupiedBeds.has(bed.id)) status = "occupied";
          else if (pendingBeds.has(`${r.room_number}-${Number(bed.bed_number)}`)) status = "reserved";
          return { number: Number(bed.bed_number), status };
        });
        return {
          label: r.room_number,
          block: String(r.room_number).charAt(0),
          floor: Number(r.floor),
          capacity: Number(r.capacity),
          beds: mapped,
          availableCount: mapped.filter((m) => m.status === "available").length,
        };
      });

    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;