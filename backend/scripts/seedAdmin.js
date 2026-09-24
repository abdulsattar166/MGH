import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// Super admin accounts. Change these to your own before running, or update
// them later via the admin panel.
const ADMINS = [
  {
    name: "Abdul Sattar",
    email: "abdulsattar1717asm@gmail.com",
    password: "Admin@12345",
    position: "Super Admin",
  },
  {
    name: "Mubarak Mehdi",
    email: "mubarakmehdi@admin.com",
    password: "mubarakhostels@12345",
    position: "Founder & CEO",
  },
];

async function main() {
  for (const admin of ADMINS) {
    const hash = bcrypt.hashSync(admin.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, hostel_id, position)
       VALUES (?, ?, ?, 'admin', NULL, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         position = VALUES(position)`,
      [admin.name, admin.email, hash, admin.position]
    );
    console.log(`Admin account ready: ${admin.email}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
