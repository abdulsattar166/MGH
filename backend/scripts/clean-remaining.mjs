import { pool } from "../src/db.js";
import { pool as p } from "../src/db.js";
import { pool } from "../src/db.js";

await pool.query("DELETE FROM notifications WHERE type = 'improvement'");
await pool.end();
process.exit(0);