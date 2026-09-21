import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Blocks — REST mirror of the Supabase `blocks` table with derived stats.
//   GET    /api/blocks?buildingId=N  -> Block[] (with floors/rooms/beds/occupied)
//   POST   /api/blocks               -> create  { hostelId, buildingId, name, status }
//   PUT    /api/blocks/:id           -> update  { name?, status?, buildingId?, hostelId? }
//   DELETE /api/blocks/:id           -> delete
const router = Router();
router.use(requireAuth);

async function withStats(blocks, poolRef) {
  const ids = blocks.map((b) => b.id);
  const stats = {};
  if (ids.length) {
    const [rooms] = await poolRef.query(
      "SELECT id, block_id, floor, capacity FROM hostel_rooms WHERE block_id IN (?)",
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
      const s = (stats[r.block_id] = stats[r.block_id] ?? { floors: new Set(), rooms: 0, beds: 0, occupied: 0 });
      s.floors.add(Number(r.floor));
      s.rooms += 1;
      s.beds += Number(r.capacity);
      s.occupied += occupiedByRoom[r.id] ?? 0;
    }
  }
  return blocks.map((b) => {
    const s = stats[b.id];
    return {
      id: Number(b.id),
      hostel_id: Number(b.hostel_id),
      building_id: Number(b.building_id),
      name: b.name,
      status: b.status ?? "active",
      floors: s?.floors.size ?? 0,
      rooms: s?.rooms ?? 0,
      beds: s?.beds ?? 0,
      occupied: s?.occupied ?? 0,
    };
  });
}

router.get("/", async (req, res) => {
  try {
    const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
    const [rows] = buildingId
      ? await pool.query("SELECT * FROM blocks WHERE building_id = ? ORDER BY name ASC", [buildingId])
      : await pool.query("SELECT * FROM blocks ORDER BY name ASC");
    res.json(await withStats(rows, pool));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    if (!b.hostelId || !b.buildingId || !b.name) {
      return res.status(400).json({ error: "hostelId, buildingId and name are required." });
    }
    const [result] = await pool.query(
      "INSERT INTO blocks (hostel_id, building_id, name, status) VALUES (?, ?, ?, ?)",
      [Number(b.hostelId), Number(b.buildingId), String(b.name).trim(), String(b.status || "active")]
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
    if (b.status !== undefined) { fields.push("status = ?"); params.push(String(b.status)); }
    if (b.buildingId !== undefined) { fields.push("building_id = ?"); params.push(Number(b.buildingId)); }
    if (b.hostelId !== undefined) { fields.push("hostel_id = ?"); params.push(Number(b.hostelId)); }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    await pool.query(`UPDATE blocks SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM blocks WHERE id = ?", [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;