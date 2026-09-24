import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// ---------------------------------------------------------------------------
// One-time reset to a clean, production-ready state:
//   * keep only Jinnah, Sama and Abdul Qadeer hostels
//   * recreate their rooms + beds, all empty and available for booking
//   * remove every student, fee, attendance, visitor, booking, complaint,
//     notice, allocation, maintenance, audit-log and notification record
//   * replace accounts with the CEO super admin + the three hostel wardens
//
// Safe to run more than once.
// ---------------------------------------------------------------------------

const KEEP_HOSTEL_IDS = [1, 2, 3];

const HOSTEL_NAMES = {
  1: "Jinnah Hostel",
  2: "Sama Hostel",
  3: "Abdul Qadeer Hostel",
};

const SUPER_ADMINS = [
  {
    name: "Abdul Sattar",
    email: "abdulsattar1717asm@gmail.com",
    password: "Admin@12345",
    position: "Super Admin",
  },
  {
    name: "Mubarak Mehdi",
    email: "mubarakgroupofhostels@gmail.com",
    password: "mubarakgroupofhostels1122",
    position: "Founder & CEO",
  },
];

const WARDENS = [
  {
    name: "Yousaf Mehsood",
    email: "yousafmehsood2121@gmail.com",
    password: "jinnah12",
    phone: "03419715017",
    hostelId: 1,
    position: "Warden, Jinnah Boys House",
  },
  {
    name: "Abdullah",
    email: "malikabdullahmalikaz@gmail.com",
    password: "sama123",
    phone: "03105948138",
    hostelId: 2,
    position: "Warden, Sama Boys House",
  },
  {
    name: "Bilah Ahmed",
    email: "bilalsudais74@gmail.com",
    password: "qadeer1234",
    phone: "03045889984",
    hostelId: 3,
    position: "Warden, Abdul Qadeer Boys House",
  },
];

const KEEP_EMAILS = new Set([
  ...SUPER_ADMINS.map((a) => a.email),
  ...WARDENS.map((w) => w.email),
]);

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log("Removing demo / transactional data…");
    for (const table of [
      "room_allocations",
      "attendance",
      "fees",
      "visitors",
      "bookings",
      "complaint_responses",
      "complaints",
      "notices",
      "improvements",
      "notifications",
      "audit_logs",
      "maintenance",
      "students",
    ]) {
      try {
        await conn.query(`DELETE FROM \`${table}\``);
        console.log(`  cleared ${table}`);
      } catch (err) {
        console.log(`  skipped ${table}: ${err.message}`);
      }
    }

    console.log("Removing extra hostels…");
    const placeholders = KEEP_HOSTEL_IDS.map(() => "?").join(",");
    await conn.query(
      `DELETE FROM hostel_beds WHERE room_id IN (SELECT id FROM hostel_rooms WHERE hostel_id NOT IN (${placeholders}))`,
      KEEP_HOSTEL_IDS
    );
    await conn.query(`DELETE FROM hostel_rooms WHERE hostel_id NOT IN (${placeholders})`, KEEP_HOSTEL_IDS);
    await conn.query(`DELETE FROM blocks WHERE hostel_id NOT IN (${placeholders})`, KEEP_HOSTEL_IDS);
    await conn.query(`DELETE FROM buildings WHERE hostel_id NOT IN (${placeholders})`, KEEP_HOSTEL_IDS);
    await conn.query(`DELETE FROM hostels WHERE id NOT IN (${placeholders})`, KEEP_HOSTEL_IDS);
    console.log("  extra hostels removed");

    console.log("Rebuilding empty rooms + beds for kept hostels…");
    await conn.query("DELETE FROM hostel_beds");
    await conn.query("DELETE FROM hostel_rooms");
    await conn.query("DELETE FROM blocks");
    await conn.query("DELETE FROM buildings");

    for (const hid of KEEP_HOSTEL_IDS) {
      const [b] = await conn.query(
        "INSERT INTO buildings (hostel_id, name, description, status) VALUES (?, 'Main Building', 'Five floors: Blocks A–E.', 'active')",
        [hid]
      );
      for (const name of ["A", "B", "C", "D", "E"]) {
        await conn.query(
          "INSERT INTO blocks (hostel_id, building_id, name, status) VALUES (?, ?, ?, 'active')",
          [hid, b.insertId, name]
        );
      }
    }

    await conn.query(`
      INSERT INTO hostel_rooms (hostel_id, building_id, block_id, room_number, floor, room_type, capacity, status)
      SELECT h.id, b.id, blk.id, r.label, r.floor, r.room_type, r.capacity, 'active'
      FROM hostels h
      JOIN buildings b ON b.hostel_id = h.id
      JOIN blocks blk ON blk.building_id = b.id
      JOIN rooms r ON r.block = blk.name
      WHERE h.id IN (${placeholders})`, KEEP_HOSTEL_IDS);

    await conn.query(`
      INSERT INTO hostel_beds (room_id, bed_number)
      SELECT hr.id, n.n
      FROM hostel_rooms hr
      JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) n
        ON n.n <= hr.capacity`);

    for (const hid of KEEP_HOSTEL_IDS) {
      const [[agg]] = await conn.query(
        "SELECT COUNT(*) AS rooms, COALESCE(SUM(capacity),0) AS beds FROM hostel_rooms WHERE hostel_id = ?",
        [hid]
      );
      await conn.query("UPDATE hostels SET name = ?, rooms = ?, beds = ? WHERE id = ?", [
        HOSTEL_NAMES[hid],
        agg.rooms,
        agg.beds,
        hid,
      ]);
    }

    const [[rooms]] = await conn.query("SELECT COUNT(*) AS n FROM hostel_rooms");
    const [[beds]] = await conn.query("SELECT COUNT(*) AS n FROM hostel_beds");
    console.log(`  created ${rooms.n} rooms and ${beds.n} beds (all available)`);

    console.log("Resetting accounts…");
    const [users] = await conn.query("SELECT id, email FROM users");
    for (const u of users) {
      if (!KEEP_EMAILS.has(u.email)) {
        await conn.query("DELETE FROM users WHERE id = ?", [u.id]);
        console.log(`  removed old account ${u.email}`);
      }
    }

    const upsertUser = async (u, role) => {
      const hash = bcrypt.hashSync(u.password, 10);
      await conn.query(
        `INSERT INTO users (name, email, password_hash, role, hostel_id, phone, position, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           hostel_id = VALUES(hostel_id),
           phone = VALUES(phone),
           position = VALUES(position),
           is_active = 1`,
        [u.name, u.email, hash, role, u.hostelId ?? null, u.phone ?? null, u.position ?? null]
      );
    };

    for (const admin of SUPER_ADMINS) {
      await upsertUser(admin, "admin");
      console.log(`  super admin ready: ${admin.email}`);
    }
    for (const w of WARDENS) {
      await upsertUser(w, "warden");
      console.log(`  warden ready: ${w.email} (hostel ${w.hostelId})`);
    }

    console.log("Reset complete. The project is ready to use.");
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
