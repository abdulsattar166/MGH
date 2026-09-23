// Pristine-DB final verifier (read-only — creates nothing).
import { pool } from "../src/db.js";

const q = async (s, p = []) => (await pool.query(s, p))[0];

const [feat] = await q("SELECT COUNT(*) n FROM bookings WHERE id LIKE 'BK-%'");
const [mghBook] = await q("SELECT COUNT(*) n FROM bookings WHERE id LIKE 'MGH-%' OR id LIKE 'MGH-%'");
const [stu] = await q("SELECT COUNT(*) n FROM students");
const [fee] = await q("SELECT COUNT(*) n FROM fees");
const [imp] = await q("SELECT COUNT(*) n FROM improvements");
const [noti] = await q("SELECT COUNT(*) n FROM notifications");
const [up] = await q("SELECT COUNT(*) n FROM uploads");

console.log(
  JSON.stringify(
    {
      hostels: (await q("SELECT COUNT(*) n FROM hostels"))[0].n,
      wardens: (await q("SELECT COUNT(*) n FROM users WHERE role='warden'"))[0].n,
      bookingsBK: feat[0].n,
      bookingsMGH: mghBook[0].n,
      students: stu[0].n,
      fees: fee[0].n,
      improvements: imp[0].n,
      notifications: noti[0].n,
      settings: (await q("SELECT COUNT(*) n FROM settings"))[0].n,
      notices: (await q("SELECT COUNT(*) n FROM notices"))[0].n,
      complaints: (await q("SELECT COUNT(*) n FROM complaints"))[0].n,
    },
    null,
    2
  )
);
await pool.end();