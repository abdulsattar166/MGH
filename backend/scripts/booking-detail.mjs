import { pool } from "../src/db.js";

const [b] = await pool.query(
  "SELECT id, hostel_id, hostel_name, room_label, block, floor, bed_number, status, fee_amount, warden_id FROM bookings WHERE id = ? LIMIT 1",
  ["MGH-2026-000001"]
);
const booking = b[0];
console.log("booking:", JSON.stringify(booking));

const [applicantRows] = await pool.query(
  "SELECT applicant FROM bookings WHERE id = ? LIMIT 1",
  ["MGH-2026-000001"]
);
const app = JSON.parse(applicantRows[0]?.applicant ?? "{}");
console.log("applicant keys:", Object.keys(app).join(","));
console.log(
  "cnicFront:",
  String(app?.cnicFront ?? app?.cnic_front ?? "").slice(0, 90),
  "| len:",
  String(app?.cnicFront ?? app?.cnic_front ?? "").length
 étape
);

const [rooms] = await pool.query(
  "SELECT id, capacity FROM hostel_rooms WHERE hostel_id = ? AND room_number = ? LIMIT 1",
  [booking?.hostel_id, booking?.room_label]
);
console.log("room:", JSON.stringify(rooms[0]));

const [beds] = await pool.query(
  "SELECT id, bed_number FROM hostel_beds WHERE room_id = ? AND bed_number = ? LIMIT 1",
  [rooms[0]?.id, booking?.bed_number]
);
console.log("bed:", JSON.stringify(beds[0]));

const [existingBooking] = await pool.query(
  "SELECT id, status, warden_id FROM bookings WHERE id = ? LIMIT 1",
  ["MGH-2026-000001"]
);

// warden linked?
const [warden] = await pool.query(
  "SELECT id, name, role, hostel_id FROM users WHERE role='warden' AND hostel_id = ? LIMIT 1",
  [booking?.hostel_id]
);
console.log("warden:", JSON.stringify(warden[0]));

const [studentsRows] = await pool.query(
  "SELECT id, name, cnic, status FROM students WHERE cnic = ? LIMIT 1",
  [String(app?.studentCnic ?? app?.cnic ?? "").trim()]
);
console.log("existing student:", JSON.stringify(studentsRows[0]));

await pool.end();
