import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Hostels — REST mirror of the Supabase `hostels` table + derived figures.
// The read endpoints are public (the home page lists hostels anonymously);
// writes require an authenticated staff account.
//   GET    /api/hostels        -> [{ id, name, code }]            (refs)
//   GET    /api/hostels/full   -> Hostel[]                        (derived stats)
//   POST   /api/hostels        -> create hostel
//   PUT    /api/hostels/:id    -> update hostel
//   DELETE /api/hostels/:id    -> delete hostel
const router = Router();

function parseFacilities(value) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function deriver(poolRef) {
  const [rooms] = await poolRef.query(
    "SELECT id, hostel_id, floor, capacity FROM hostel_rooms"
  );
  const roomIds = rooms.map((r) => r.id);
  const occupiedByRoom = {};
  if (roomIds.length) {
    const [allocRows] = await poolRef.query(
      `SELECT room_id, COUNT(*) AS n FROM room_allocations WHERE room_id IN (?) GROUP BY room_id`,
      [roomIds]
    );
    for (const a of allocRows) occupiedByRoom[a.room_id] = Number(a.n);
  }
  const agg = {};
  for (const r of rooms) {
    const key = Number(r.hostel_id);
    const a = (agg[key] = agg[key] ?? { rooms: 0, floors: new Set(), beds: 0, occupied: 0 });
    a.rooms += 1;
    a.floors.add(Number(r.floor));
    a.beds += Number(r.capacity);
    a.occupied += occupiedByRoom[r.id] ?? 0;
  }
  return agg;
}

async function fullHostels(poolRef) {
  const [hostels] = await poolRef.query(
    "SELECT * FROM hostels ORDER BY id ASC"
  );
  const agg = await deriver(poolRef);
  return hostels.map((h) => {
    const a = agg[Number(h.id)];
    const beds = a?.beds ?? 0;
    const occupied = a?.occupied ?? 0;
    return {
      id: Number(h.id),
      name: h.name,
      gender: h.gender,
      location: h.location ?? null,
      address: h.address ?? null,
      phone: h.phone ?? null,
      email: h.email ?? null,
      image: h.image_url ?? null,
      rooms: a?.rooms ?? 0,
      floors: a?.floors.size ?? 0,
      beds,
      available: Math.max(0, beds - occupied),
      facilities: parseFacilities(h.facilities),
      code: h.code ?? null,
      description: h.description ?? null,
      status: h.status ?? "active",
    };
  });
}

// GET / — refs
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, code FROM hostels ORDER BY id ASC");
    res.json(rows.map((r) => ({ id: Number(r.id), name: r.name, code: r.code ?? null })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /full — hostels with derived rooms/beds/occupancy
router.get("/full", async (_req, res) => {
  try {
    res.json(await fullHostels(pool));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create
router.post("/", requireAuth, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Hostel name is required." });
    const gender = String(req.body.gender || "boys");
    const facilities = Array.isArray(req.body.facilities) ? JSON.stringify(req.body.facilities) : null;
    const [result] = await pool.query(
      `INSERT INTO hostels
         (name, gender, location, address, phone, email, image_url, facilities, code, description, status, rooms, beds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        name,
        gender,
        String(req.body.location || ""),
        req.body.address ? String(req.body.address) : null,
        req.body.phone ? String(req.body.phone) : null,
        req.body.email ? String(req.body.email) : null,
        req.body.imageUrl ? String(req.body.imageUrl) : null,
        facilities,
        req.body.code ? String(req.body.code) : null,
        req.body.description ? String(req.body.description) : null,
        String(req.body.status || "active"),
      ]
    );
    res.status(201).json({ ok: true, id: Number(result.insertId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fields = [];
    const params = [];
    const b = req.body;
    if (b.name !== undefined) { fields.push("name = ?"); params.push(String(b.name).trim()); }
    if (b.gender !== undefined) { fields.push("gender = ?"); params.push(String(b.gender)); }
    if (b.location !== undefined) { fields.push("location = ?"); params.push(String(b.location)); }
    if (b.address !== undefined) { fields.push("address = ?"); params.push(b.address ? String(b.address) : null); }
    if (b.phone !== undefined) { fields.push("phone = ?"); params.push(b.phone ? String(b.phone) : null); }
    if (b.email !== undefined) { fields.push("email = ?"); params.push(b.email ? String(b.email) : null); }
    if (b.code !== undefined) { fields.push("code = ?"); params.push(b.code ? String(b.code) : null); }
    if (b.description !== undefined) { fields.push("description = ?"); params.push(b.description ? String(b.description) : null); }
    if (b.status !== undefined) { fields.push("status = ?"); params.push(String(b.status)); }
    if (b.imageUrl !== undefined) { fields.push("image_url = ?"); params.push(b.imageUrl ? String(b.imageUrl) : null); }
    if (b.facilities !== undefined) {
      fields.push("facilities = ?");
      params.push(Array.isArray(b.facilities) ? JSON.stringify(b.facilities) : null);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    await pool.query(`UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM hostels WHERE id = ?", [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;