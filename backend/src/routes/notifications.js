import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, audit } from "../notify.js";

// Notifications — the data behind the bell icon on every dashboard.
//   GET /api/notifications          -> my notifications (newest first)
//   GET /api/notifications/unread   -> unread count
//   POST /api/notifications/:id/read
//   POST /api/notifications/read-all
//   DELETE /api/notifications/:id
const router = Router();
router.use(requireAuth);

function mapRow(r) {
  return {
    id: Number(r.id),
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    data: r.data ? (typeof r.data === "string" ? JSON.parse(r.data) : r.data) : null,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100",
      [req.user.id]
    );
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/unread", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    res.json({ count: Number(rows[0].n) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [Number(req.params.id), req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/read-all", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [
      Number(req.params.id),
      req.user.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expose notify helpers for other routes.
export { notify, audit };

export default router;