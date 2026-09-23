import { pool } from "../src/db.js";

async function col(table, name) {
  const [c] = await pool.query(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, name]
  );
  return Number(c[0].n) > 0;
}
async function add(table, name, ddl) {
  if (await col(table, name)) return console.log(`skip ${table}.${name} (exists)`);
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${ddl}`);
  console.log(`added ${table}.${name}`);
}

// students.image_url — approve route writes this when attaching the uploaded
// CNIC photo to the new student record.
await add("students", "image_url", "VARCHAR(500) NULL");

// hostel_rooms.image_url — room photo uploads.
await add("hostel_rooms", "image_url", "VARCHAR(500) NULL");

// guards for warden avatar + hostel cover in case the earlier smoke ran
// against a different schema.
await add("users", "image_url", "VARCHAR(500) NULL");
await add("hostels", "image_url", "VARCHAR(500) NULL");

// Complete remaining columns the approve → student/fee/notify lifecycle needs.
await add("bookings", "warden_id", "INT UNSIGNED NULL");
await add("bookings", "fee_amount", "INT NOT NULL DEFAULT 0");
await add("bookings", "tracking", "TEXT NULL");
await add("fee_amount_booking_safe", "");
for (const t of ["fees", "bookings"]) {
  try {
    const [q] = await pool.query(
      "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME IN ('status','collected_by','reference','paid','month')",
      [t]
    );
    console.log(`columns info ${t}:`, q[0].n);
  } catch (e) {
    console.log(`info err ${t}:`, e.message);
  }
}

await pool.end();
