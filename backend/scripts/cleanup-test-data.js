import { pool } from "../src/db.js";

const conn = await pool.getConnection();
try {
  // Remove test bookings (MGH-*).
  await conn.query("DELETE FROM notifications WHERE JSON_EXTRACT(data, '$.booking_id') LIKE 'MGH-%'");
  await conn.query("DELETE FROM bookings WHERE id LIKE 'MGH-%'");

  // Reset any students my fee tests marked as Fee Due back to Active.
  const [due] = await conn.query("SELECT id, name FROM students WHERE status = 'Fee Due'");
  for (const s of due) {
    await conn.query("UPDATE students SET status = 'Active' WHERE id = ?", [s.id]);
    console.log("reset student", s.id, s.name, "-> Active");
  }

  // Restore the fee record my tests touched back to 'approved'.
  await conn.query(
    "UPDATE fees SET status = 'approved', paid = 0, paid_at = NULL, method = NULL, reference = NULL, remarks = NULL, collected_by = NULL WHERE reference LIKE 'FEE-2026-%'"
  );

  // Remove all test-generated notifications (they were all created by automated tests).
  await conn.query("DELETE FROM notifications");
  console.log("cleared notifications");

  console.log("final cleanup complete");
} catch (err) {
  console.error("cleanup error:", err.message);
}
conn.release();
await pool.end();
process.exit(0);