import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Notices — REST mirror of the Supabase `notices` table.
// The notice board is read anonymously on the public hostel pages; writes
// require an authenticated staff account.
//   GET    /api/notices?hostelId=N  -> Notice[]
//   POST   /api/notices             -> create
//   PUT    /api/notices/:id         -> update
//   DELETE /api/notices/:id         -> delete
const router = Router();

function mapNotice(r) {
  return {
    id: Number(r.id),
    hostel_id: Number(r.hostel_id),
    title: r.title,
    body: r.body,
    author_name: r.author_name ?? null,
    is_pinned: Boolean(r.is_pinned),
    expires_at: r.expires_at ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? null,
  };
}

router.get("/", async (req, res) => {
  try {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : null;
    const [rows] = hostelId
      ? await pool.query(
          "SELECT * FROM notices WHERE hostel_id = ? ORDER BY is_pinned DESC, created_at DESC",
          [hostelId]
        )
      : await pool.query("SELECT * FROM notices ORDER BY is_pinned DESC, created_at DESC");
    res.json(rows.map(mapNotice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const b = req.body;
    if (!b.hostelId || !b.title || !b.body) {
      return res.status(400).json({ error: "hostelId, title and body are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO notices (hostel_id, title, body, author_name, is_pinned, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(b.hostelId),
        String(b.title).trim(),
        String(b.body),
        b.authorName ? String(b.authorName) : null,
        b.isPinned ? 1 : 0,
        b.expiresAt || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM notices WHERE id = ?", [result.insertId]);
    res.status(201).json(mapNotice(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const fields = ["updated_at = NOW()"];
    const params = [];
    if (b.title !== undefined) { fields.push("title = ?"); params.push(String(b.title).trim()); }
    if (b.body !== undefined) { fields.push("body = ?"); params.push(String(b.body)); }
    if (b.isPinned !== undefined) { fields.push("is_pinned = ?"); params.push(b.isPinned ? 1 : 0); }
    if (b.expiresAt !== undefined) { fields.push("expires_at = ?"); params.push(b.expiresAt || null); }
    await pool.query(`UPDATE notices SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
    const [rows] = await pool.query("SELECT * FROM notices WHERE id = ?", [id]);
    res.json(mapNotice(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM notices WHERE id = ?", [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;