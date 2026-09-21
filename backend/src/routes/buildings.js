import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Buildings — REST mirror of the Supabase `buildings` table with derived stats.
//   GET    /api/buildings?hostelId=N  -> Building[] (with blocks/floors/rooms/beds/occupied)
//   POST   /api/buildings             -> create  { hostelId, name, description?, status }
//   PUT    /api/buildings/:id         -> update  { name?, description?, status?, hostelId? }
//   DELETE /api/buildings/:id         -> delete
const router = Router();
router.use(requireAuth);

async function withStats(buildings, poolRef) {
  const ids = buildings.map((b) => b.id);
  const stats = {};
  if (ids.length) {
    const [rooms] = await poolRef.query(
      "SELECT id, building_id, floor, capacity FROM hostel_rooms WHERE building_id IN (?)",
      [ids]
    );
    const roomIds = rooms.map((r) => r.id);
    const occupiedByRoom = {};
    if (roomIds.length) {
      const [allocRows] = await poolRef.query(
        "SELECT room_id, COUNT(*) AS n FROM room_allocations WHERE room_id IN (?) GROUP BY room_id",
        [roomIds]
      );
      for (const a of allocRows) occupiedByRoom[a.room_id] = Number(a.n);
    }
    for (const r of rooms) {
      const s = (stats[r.building_id] = stats[r.building_id] ?? { floors: new Set(), rooms: 0, beds: 0, occupied: 0 });
      s.floors.add(Number(r.floor));
      s.rooms += 1;
      s.beds += Number(r.capacity);
      s.occupied += occupiedByRoom[r.id] ?? 0;
    }
  }
  return buildings.map((b) => {
    const s = stats[b.id];
    return {
      id: Number(b.id),
      hostel_id: Number(b.hostel_id),
      name: b.name,
      description: b.description ?? null,
      status: b.status ?? "active",
      blocks: Number(b.blocks ?? 0),
      floors: s?.floors.size ?? 0,
      rooms: s?.rooms ?? 0,
      beds: s?.beds ?? 0,
      occupied: s?.occupied ?? 0,
    };
  });
}

router.get("/", async (req, res) => {
  try {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : null;
    const [rows] = hostelId
      ? await pool.query(
          `SELECT b.*, COUNT(blk.id) AS blocks
           FROM buildings b LEFT JOIN blocks blk ON blk.building_id = b.id
           WHERE b.hostel_id = ? GROUP BY b.id ORDER BY b.name ASC`,
          [hostelId]
        )
      : await pool.query(
          `SELECT b.*, COUNT(blk.id) AS blocks
           FROM buildings b LEFT JOIN blocks blk ON blk.building_id = b.id
           GROUP BY b.id ORDER BY b.name ASC`
        );
    res.json(await withStats(rows, pool));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    if (!b.hostelId || !b.name) return res.status(400).json({ error: "hostelId and name are required." });
    const [result] = await pool.query(
      "INSERT INTO buildings (hostel_id, name, description, status) VALUES (?, ?, ?, ?)",
      [Number(b.hostelId), String(b.name).trim(), b.description ? String(b.description) : null, String(b.status || "active")]
    );
    res.status(201).json({ ok: true, id: Number(result.insertId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const fields = [];
    const params = [];
    if (b.name !== undefined) { fields.push("name = ?"); params.push(String(b.name).trim()); }
    if (b.description !== undefined) { fields.push("description = ?"); params.push(b.description ? String(b.description) : null); }
    if (b.status !== undefined) { fields.push("status = ?"); params.push(String(b.status)); }
    if (b.hostelId !== undefined) { fields.push("hostel_id = ?"); params.push(Number(b.hostelId)); }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    await pool.query(`UPDATE buildings SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM buildings WHERE id = ?", [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;