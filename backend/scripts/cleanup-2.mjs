import { pool } from "../src/db.js";

await pool.query("DELETE FROM notifications WHERE type = 'improvement'");
await pool.query(
  "DELETE FROM improvements WHERE code LIKE 'IMP-2026-%' OR subject LIKE 'E2E-%' OR subject LIKE '%cooler%'"
);
const [rem] = await pool.query("SELECT id, code, status, warden_id FROM improvements");
const [notif] = await pool.query("SELECT id, type FROM notifications WHERE type='improvement'");
console.log("remaining improvements:", JSON.stringify(rem));
console.log("remaining improvement notifications:", JSON.stringify(notif));
await pool.end();
process.exit(0);
