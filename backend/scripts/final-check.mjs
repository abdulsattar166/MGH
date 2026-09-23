import { pool } from "../src/db.js";

const [hs] = await pool.query("SELECT id, name, status FROM hostels ORDER BY id");
const [us] = await pool.query("SELECT id, name, role, hostel_id, is_active FROM users ORDER BY id");
const [sts] = await pool.query("SELECT id, name, status, hostel_id FROM students ORDER BY id");
const [fees] = await pool.query("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS amt FROM fees");
const [both] = await pool.query("SELECT COUNT(*) AS n FROM bookings");
const [impro] = await pool.query("SELECT COUNT(*) AS n FROM improvements");
const [notif] = await pool.query("SELECT COUNT(*) AS n FROM notifications");

console.log("HOSTELS", hs.map((x) => `${x.id}:${x.status}`).join(" | "));
console.log("USERS", us.map((x) => `${x.id}:${x.role}${x.hostel_id ? ":h" + x.hostel_id : ""}:${x.is_active}`).join(" | "));
console.log("STUDENTS", sts.map((x) => `${x.id}:${x.name}:${x.status}:h${x.hostel_id}`).join(" | "));
console.log("fees", fees[0].n, fees[0].amt, "| bookings", bookings[0].n, "| improvements", improvements[0].n, "| notifications", notifications[0].n recursive);
await pool.end();