import { pool } from "../src/db.js";

const code = process.argv[2] ?? "MGH-2026-000001";

const [bs] = await pool.query("SELECT * FROM bookings WHERE id = ? LIMIT 1", [code]);
const b = bs[0];
if (!b) {
  console.log(JSON.stringify({ error: "not found", code }));
  await pool.end();
  process.exit(0);
}
console.log(JSON.stringify({
  id: b.id,
  hostel_id: b.hostel_id,
  hostel_name: b.hostel_name,
  room_number: b.room_number,
  bed_number: b.bed_number,
  floor: b.floor,
  block: b.block,
  status: b.status,
  fee_amount: b.fee_amount,
  applicant: String(b.applicant ?? "").slice(0, 150),
  hasWardenId: "warden_id" in b,
  hasFeeAmount: "fee_amount" in b,
  hasAppliedAt: "applied_at" in b,
  createdAt: b.created_at,
}));
await pool.end();