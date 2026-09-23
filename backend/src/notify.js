import { pool } from "./db.js";

/**
 * Create a notification row for a user.
 *  type   - e.g. "booking", "fee", "attendance", "complaint", "system"
 *  link   - optional frontend route the notification should open, e.g. "/manage/bookings"
 *  data   - optional JSON payload
 */
export async function notify(params) {
  const { user_id, type = "info", title = "", message = "", link = null, data = null } = params;
  if (!user_id) return null;
  const [result] = await pool.query(
    "INSERT INTO notifications (user_id, type, title, message, link, data) VALUES (?, ?, ?, ?, ?, ?)",
    [Number(user_id), type, title, message, link, data ? JSON.stringify(data) : null]
  );
  return Number(result.insertId);
}

/** Notify every user matching the given role, optionally scoped to a hostel. */
export async function notifyRole(params) {
  const { role, hostel_id = null } = params;
  let rows;
  if (hostel_id != null) {
    [rows] = await pool.query(
      "SELECT id FROM users WHERE role = ? AND hostel_id = ? AND is_active = 1",
      [role, Number(hostel_id)]
    );
  } else {
    [rows] = await pool.query(
      "SELECT id FROM users WHERE role = ? AND is_active = 1",
      [role]
    );
  }
  for (const r of rows) {
    await notify({ user_id: r.id, ...params });
  }
  return rows.length;
}

/** Insert an audit log row (never blocks the main operation). */
export async function audit({ user, action, resource = null, resource_id = null, details = null }) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, user_name, user_role, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        user?.id != null ? String(user.id) : null,
        user?.name ?? null,
        user?.role ?? null,
        action,
        resource,
        resource_id != null ? String(resource_id) : null,
        details,
      ]
    );
  } catch {
    // audit logging must never break the main flow
  }
}