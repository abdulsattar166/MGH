import { pool } from "../src/db.js";

// Remove everything produced by the automated smoke/lifecycle/role verification
// runs so the seeded demo dataset stays pristine for the user.

// 1. improvements created by tests (public-create test + smoke)
await pool.query("DELETE FROM improvements WHERE code LIKE 'IMP-2026-%'");

// 2. notifications created for those improvements + booking/fee test notifications
await pool.query("DELETE FROM notifications WHERE type IN ('improvement')");
await pool.query(
  "DELETE FROM notifications WHERE data IS NOT NULL AND (data LIKE '%booking_id%' OR data LIKE '%fee_id%' OR data LIKE '%student_id%')"
);

// 3. improve / booking test records created on public demo hostels
const [mgh] = await pool.query("SELECT id FROM bookings WHERE id LIKE 'MGH-2026-%'");
const mghIds = mgh.map((b) => b.id);
if (mghIds.length) {
  await pool.query("DELETE FROM notifications WHERE id IN (SELECT id FROM notifications WHERE user_id IN (SELECT id FROM users WHERE role = 'warden')) AND type = 'booking'");
}

// 4. test students created by approve flow (name markers) + their fees/allocations
const [testStu] = await pool.query("SELECT id FROM students WHERE name LIKE '%Lifecycle Test%' OR name LIKE '%Test Student%' OR name LIKE 'E2E Test%'");
for (const s of testStu) {
  await pool.query("DELETE FROM room_allocations WHERE student_id = ?", [s.id]);
  await pool.query("DELETE FROM fees WHERE student_id = ?", [s.id]);
  await pool.query("DELETE FROM attendance WHERE student_id = ?", [s.id]);
  await pool.query("DELETE FROM students WHERE id = ?", [s.id]);
}

// 5. delete the smoke-created MGH bookings (bed 4 was real so booking exists)
if (mghIds.length) {
  await pool.query(
    "DELETE FROM notifications WHERE type = 'booking' AND data LIKE ?",
    [`%${mghIds[0]}%`]
  );
  await pool.query("DELETE FROM bookings WHERE id LIKE 'MGH-2026-%'");
}

const [h] = await pool.query("SELECT id, name, status FROM hostels ORDER BY id");
const [b] = await pool.query("SELECT id, status FROM bookings ORDER BY id");
const [s] = await pool.query("SELECT id, name, status FROM students ORDER BY id");
const [f] = await pool.query("SELECT COUNT(*) n FROM fees");
const [n] = await pool.query("SELECT COUNT(*) n FROM notifications");
const [i] = await pool.query("SELECT COUNT(*) n FROM improvements");
console.log(
  JSON.stringify({
    hostels: h.map((x) => `${x.id}:${x.name}:${x.status}`),
    bookings: b.map((x) => `${x.id}:${x.status}`),
    students: s.map((x) => `${x.id}:${x.name.slice(0, 18)}:${x.status}`),
    counts: { fees: Number(f[0].n), notifications: Number(n[0].n), improvements: Number(i[0].n) },
  })
);
await pool.end();