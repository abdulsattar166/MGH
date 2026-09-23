import { pool } from "../src/db.js";

const bookingId = "MGH-2026-000001";

// 1. raw booking row + fully-mapped shape the route uses
const [raw] = await pool.query("SELECT * FROM bookings WHERE id = ? LIMIT 1", [bookingId]);
if (!raw.length) {
  console.log("no booking", bookingId);
  await pool.end();
  process.exit(0);
}
const b = raw[0];
const appl = b.applicant ? (typeof b.applicant === "string" ? JSON.parse(b.applicant) : b.applicant) : {};
console.log("status:", b.status, "| hostel_id:", b.hostel_id, "| room_label:", b.room_label, "| bed:", b.bed_number, "| fee_amount:", b.fee_amount, "| warden_id:", b.warden_id);
console.log("applicant keys:", Object.keys(appl).join(","));
console.log("applicant sample:", JSON.stringify(appl).slice(0, 400));

// 2. what the approve route reads from applicant
console.log("fullName:", String(appl.fullName ?? appl.applicant_name ?? appl.name ?? ""));
console.log("cnic:", String(appl.cnic ?? appl.applicant_cnic ?? ""));
console.log("mobile:", String(appl.mobile ?? appl.phone ?? ""));
console.log("fatherName:", String(appl.fatherName ?? appl.father_name ?? ""));
console.log("guardianPhone:", String(appl.guardianPhone ?? appl.guardian_phone ?? appl.guardianPhone ?? ""));

// 3. mimic the bed-finder the route uses
const [roomRows] = await pool.query(
  "SELECT r.id, r.capacity, r.hostel_id, r.room_number FROM hostel_rooms r WHERE r.hostel_id = ? AND r.room_number = ? LIMIT 1",
  [Number(b.hostel_id), String(b.room_label)]
);
const room = roomRows[0] ?? null;
console.log("room:", JSON.stringify(room));
if (room) {
  const [bedRows] = await pool.query(
    "SELECT id, is_maintenance FROM hostel_beds WHERE room_id = ? AND bed_number = ? LIMIT 1",
    [room.id, Number(b.bed_number)]
  );
  console.log("bed:", JSON.stringify(bedRows[0] ?? null));
  if (bedRows[0]) {
    const [allocRows] = await pool.query(
      "SELECT id FROM room_allocations WHERE bed_id = ? LIMIT 1",
      [bedRows[0].id]
    );
    console.log("allocated?", allocRows.length > 0);
  }
}

// 4. does the fee record for this student + month exist (unique key collision = the classic 500)
const [feeColl] = await pool.query(
  `SELECT COUNT(*) n FROM fees f JOIN students s ON s.id = f.student_id WHERE s.cnic = ? AND f.month = ?`,
  [String(appl.cnic ?? ""), "2026-09"]
);
console.log("pre-existing fee for that student+month:", Number(feeColl[0].n));

await pool.end();