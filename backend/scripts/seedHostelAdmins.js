import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// One hostel admin (warden) per hostel. Change these before running, or update
// them later via the hostel admin management panel.
const HOSTEL_ADMINS = [
  { name: "Yousaf Mehsood", email: "yousafmehsood2121@gmail.com", password: "jinnah12", hostelId: 1 },
  { name: "Abdullah", email: "malikabdullahmalikaz@gmail.com", password: "sama123", hostelId: 2 },
  { name: "Bilah Ahmed", email: "bilalsudais74@gmail.com", password: "qadeer1234", hostelId: 3 },
  { name: "Arslan Tariq", email: "admin.dha@mubarakhostels.pk", password: "admin4dha", hostelId: 4 },
  { name: "Zeeshan Ali", email: "admin.wapda@mubarakhostels.pk", password: "admin5wapda", hostelId: 5 },
  { name: "Taimoor Shah", email: "admin.bahria@mubarakhostels.pk", password: "admin6bahria", hostelId: 6 },
];

async function main() {
  for (const a of HOSTEL_ADMINS) {
    const hash = bcrypt.hashSync(a.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, hostel_id)
       VALUES (?, ?, ?, 'warden', ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         hostel_id = VALUES(hostel_id)`,
      [a.name, a.email, hash, a.hostelId]
    );
    console.log(`Hostel admin ready: ${a.email} (hostel ${a.hostelId})`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});