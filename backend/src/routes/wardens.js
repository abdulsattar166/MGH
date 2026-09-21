import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

// Warden (hostel admin) management — REST mirror of the Supabase
// `manage-wardens` edge function.
//
//   GET  /api/wardens                — list (admin)
//   POST /api/wardens                — list (admin) { action: "list" }
//   POST /api/wardens/manage         — create/update/set-hostel/reset-password/
//                                      set-active/delete  { action, ... }
const router = Router();
router.use(requireAuth, requireAdmin);

const COLS = "id, name, email, phone, hostel_id, avatar_url, role, position, is_active";

function mapWarden(r) {
  return {
    id: String(r.id),
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    hostel_id: r.hostel_id != null ? Number(r.hostel_id) : null,
    avatar_url: r.avatar_url ?? null,
    role: r.role,
    position: r.position ?? null,
    is_active: Boolean(r.is_active),
  };
}

// GET /  — list (documented, kept for convenience)
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM users WHERE role = 'warden' ORDER BY name ASC`
    );
    res.json({ ok: true, wardens: rows.map(mapWarden) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /  — list (frontend posts { action: "list" } here)
router.post("/", async (req, res) => {
  try {
    const action = String(req.body.action ?? "list");
    if (action !== "list") {
      return res.status(400).json({ error: "Unknown action." });
    }
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM users WHERE role = 'warden' ORDER BY name ASC`
    );
    res.json({ ok: true, wardens: rows.map(mapWarden) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /manage — dispatch on body.action
router.post("/manage", async (req, res) => {
  try {
    const action = String(req.body.action ?? "");
    const userId = req.body.userId ? String(req.body.userId) : "";

    if (action === "create") {
      const email = String(req.body.email ?? "").trim().toLowerCase();
      const password = String(req.body.password ?? "");
      const name = String(req.body.name ?? "").trim();
      const phone = req.body.phone ? String(req.body.phone).trim() : null;
      const hostelId = req.body.hostelId ? Number(req.body.hostelId) : null;
      const role = req.body.role === "superintendent" ? "superintendent" : "warden";
      const avatarUrl = req.body.avatarUrl ? String(req.body.avatarUrl) : null;
      if (!email || !name || password.length < 6) {
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
        `INSERT INTO users (name, email, password_hash, role, hostel_id, phone, avatar_url, position, is_active)
         VALUES (?, ?, ?, 'warden', ?, ?, ?, ?, 1)`,
        [
          name,
          email,
          hash,
          hostelId,
          phone,
          avatarUrl,
          role === "superintendent" ? "Superintendent" : "Warden",
        ]
      );
      return res.status(201).json({ ok: true, userId: String(result.insertId) });
    }

    if (action === "update") {
      if (!userId) return res.status(400).json({ error: "Missing account id." });
      const fields = [];
      const params = [];
      const id = Number(userId);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid account id." });

      if (req.body.name !== undefined) {
        fields.push("name = ?");
        params.push(String(req.body.name).trim());
      }
      if (req.body.phone !== undefined) {
        fields.push("phone = ?");
        params.push(req.body.phone ? String(req.body.phone).trim() : null);
      }
      if (req.body.position !== undefined) {
        fields.push("position = ?");
        params.push(req.body.position ? String(req.body.position) : null);
      }
      if (req.body.avatarUrl !== undefined) {
        fields.push("avatar_url = ?");
        params.push(req.body.avatarUrl ? String(req.body.avatarUrl) : null);
      }
      if (req.body.hostelId !== undefined) {
        fields.push("hostel_id = ?");
        params.push(req.body.hostelId === null || req.body.hostelId === "" ? null : Number(req.body.hostelId));
      }
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;
      if (email) {
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
        if (existing.length) {
          return res.status(400).json({ error: "An account with this email already exists." });
        }
        fields.push("email = ?");
        params.push(email);
      }
      if (fields.length) {
        await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
      }
      return res.json({ ok: true });
    }

    if (action === "set-hostel") {
      if (!userId) return res.status(400).json({ error: "Missing account id." });
      const id = Number(userId);
      const hostelId = req.body.hostelId === null || req.body.hostelId === "" ? null : Number(req.body.hostelId);
      await pool.query("UPDATE users SET hostel_id = ? WHERE id = ?", [hostelId, id]);
      // Re-point this warden's open complaints to the new warden (mirrors Supabase).
      if (hostelId) {
        await pool.query(
          "UPDATE complaints SET warden_id = ? WHERE hostel_id = ? AND warden_id IS NULL",
          [String(id), hostelId]
        );
      }
      return res.json({ ok: true });
    }

    if (action === "reset-password") {
      if (!userId) return res.status(400).json({ error: "Missing account id." });
      const id = Number(userId);
      const password = String(req.body.password ?? "");
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }
      const hash = bcrypt.hashSync(password, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);
      return res.json({ ok: true });
    }

    if (action === "set-active") {
      if (!userId) return res.status(400).json({ error: "Missing account id." });
      const id = Number(userId);
      const active = Boolean(req.body.isActive);
      await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [active ? 1 : 0, id]);
      return res.json({ ok: true });
    }

    if (action === "delete") {
      if (!userId) return res.status(400).json({ error: "Missing account id." });
      const id = Number(userId);
      await pool.query(
        "UPDATE complaints SET warden_id = NULL WHERE warden_id = ?",
        [userId]
      );
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;