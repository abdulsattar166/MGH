import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

// A "hostel admin" is stored as role 'warden' (matching the frontend and
// Supabase) and is scoped to a single hostel via users.hostel_id.
const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/hostel-admins — list all hostel admins with their hostel name
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.hostel_id, h.name AS hostel_name
       FROM users u
       LEFT JOIN hostels h ON h.id = u.hostel_id
       WHERE u.role = 'warden'
       ORDER BY u.name ASC`
    );
    res.json(rows.map((r) => ({ ...r, id: String(r.id) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hostel-admins — create a hostel admin
router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const hostelId = req.body.hostelId ? Number(req.body.hostelId) : null;

    if (!name || !email || password.length < 6) {
      return res.status(400).json({
        error: "Please provide a name, a valid email and a password of at least 6 characters.",
      });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, hostel_id) VALUES (?, ?, ?, 'warden', ?)",
      [name, email, hash, hostelId]
    );
    res.status(201).json({ ok: true, userId: String(result.insertId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hostel-admins/:id/hostel — reassign a hostel admin to a hostel
router.put("/:id/hostel", async (req, res) => {
  try {
    const hostelId =
      req.body.hostel_id === null || req.body.hostel_id === ""
        ? null
        : Number(req.body.hostel_id);
    await pool.query("UPDATE users SET hostel_id = ? WHERE id = ? AND role = 'warden'", [
      hostelId,
      Number(req.params.id),
    ]);
    const [rows] = await pool.query(
      "SELECT id, name, email, role, hostel_id FROM users WHERE id = ?",
      [Number(req.params.id)]
    );
    res.json(rows[0] ? { ...rows[0], id: String(rows[0].id) } : { ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hostel-admins/:id — remove a hostel admin
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'warden'", [
      Number(req.params.id),
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;