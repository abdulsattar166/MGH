import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// One hostel admin (warden) per hostel. Change these before running, or update
// them later via the hostel admin management panel.
const HOSTEL_ADMINS = [
  {
    name: "Yousaf Mehsood",
    email: "yousafmehsood2121@gmail.com",
    password: "jinnah12",
    hostelId: 1,
    position: "Warden, Jinnah Boys House",
  },
  {
    name: "Abdullah",
    email: "malikabdullahmalikaz@gmail.com",
    password: "sama123",
    hostelId: 2,
    position: "Warden, Sama Boys House",
  },
  {
    name: "Bilah Ahmed",
    email: "bilalsudais74@gmail.com",
    password: "qadeer1234",
    hostelId: 3,
    position: "Warden, Abdul Qadeer Boys House",
  },
];

async function main() {
  for (const a of HOSTEL_ADMINS) {
    const hash = bcrypt.hashSync(a.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, hostel_id, position)
       VALUES (?, ?, ?, 'warden', ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         hostel_id = VALUES(hostel_id),
         position = VALUES(position)`,
      [a.name, a.email, hash, a.hostelId, a.position]
    );
    console.log(`Hostel admin ready: ${a.email} (hostel ${a.hostelId})`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});