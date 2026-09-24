import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// Default admin account. Change these to your own before running, or update
// them later via the admin panel.
const ADMIN = {
  name: "Mubarak Mehdi",
  email: "mubarikmehdi@admin.com",
  password: "admin@12345",
};

async function main() {
  const hash = bcrypt.hashSync(ADMIN.password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, hostel_id)
     VALUES (?, ?, ?, 'admin', NULL)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
    [ADMIN.name, ADMIN.email, hash]
  );
  console.log(`Admin account ready: ${ADMIN.email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});