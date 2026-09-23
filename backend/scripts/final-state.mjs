import { pool } from "../src/db.js";

// Remove any rows that smoke/lifecycle tests created so the demo DB only has
// the hand-seeded records.
const codes = ["IMP-2026-0001"];

for (const c of codes) {
  const [imps] = await pool.query("SELECT id FROM improvements WHERE code = ?", [c]);
  for (const im of imps) {
    await pool.query("DELETE FROM notifications WHERE type = 'improvement' AND data LIKE ?", [`%${im.code}%`]);
  }
  await pool.query("DELETE FROM improvements WHERE code = ?", [c]);
}

// Also remove any notifications linked to the test bookings / fees / improvements
// that may still reference the cleaned-up records.
await pool.query(
  "DELETE FROM notifications WHERE type IN ('booking','fee','improvement') AND created_at > NOW() - INTERVAL 1 DAY"
);

const [fees] = await pool.query("SELECT id, status, student_id FROM fees ORDER BY id");
const [stu] = await pool.query("SELECT id, name, status FROM students ORDER BY id");
const [impRows] = await pool.query("SELECT code, status FROM improvements ORDER BY id");
const [noti] = await pool.query("SELECT COUNT(*) n FROM notifications");
const [boo] = await pool.query("SELECT id, status FROM bookings ORDER BY id");

console.log(JSON.stringify({ fees: fees.map((f) => `${f.id}:${f.status}:s${f.student_id}`), students: stu.map((s) => `${s.id}:${s.name}:${s.status}`), improvements: impRows, notifications: Number(noti[0].n), bookings: boo.map((b) => `${b.id}:${b.status}`) }, null, 2));
await pool.end();