import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

// Audit log — REST mirror of the Supabase `audit_logs` table.
//   GET  /api/audit-logs?limit=N  -> AuditLog[]
//   POST /api/audit-logs          -> log an event (author derived from token)
const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const [rows] = await pool.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    res.json(rows.map((r) => ({
      id: Number(r.id),
      user_name: r.user_name ?? null,
      user_role: r.user_role ?? null,
      action: r.action,
      resource: r.resource ?? null,
      resource_id: r.resource_id ?? null,
      details: r.details ?? null,
      created_at: r.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const [userRows] = await pool.query(
      "SELECT name, role FROM users WHERE id = ?",
      [req.user.id]
    );
    const user = userRows[0] ?? {};
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, user_role, action, resource, resource_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(req.user.id),
        user.name ?? req.user.email ?? "Unknown",
        user.role ?? "unknown",
        String(b.action || ""),
        b.resource ? String(b.resource) : null,
        b.resourceId ? String(b.resourceId) : null,
        b.details ? String(b.details) : null,
      ]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;