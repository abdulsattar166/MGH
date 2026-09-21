import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

function toUser(row) {
  return {
    id: String(row.id),
    role: row.role,
    name: row.name,
    email: row.email,
    hostelId: row.hostel_id ?? null,
    avatarUrl: row.avatar_url ?? null,
    position: row.position ?? null,
    isActive: row.is_active !== 0,
    studentId: row.student_id != null ? Number(row.student_id) : null,
  };
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "This account has been deactivated." });
    }

    res.json({ token: signToken(user), user: toUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
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

    const user = { id: result.insertId, role: "warden", name, email, hostel_id: hostelId };
    res.status(201).json({ token: signToken(user), user: toUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(toUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password-request
// NOTE: production should email a reset link; this demo simply acknowledges.
router.post("/reset-password-request", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  res.json({ ok: true });
});

// POST /api/auth/update-password  (requires a valid session)
router.post("/update-password", requireAuth, async (req, res) => {
  try {
    const password = String(req.body.password || "");
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const hash = bcrypt.hashSync(password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;