import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Mubarak Hostels MGH — feature migration (2026)
//
// Adds the tables and columns needed for:
//   - booking lifecycle (tracking, approval information, warden linkage)
//   - notifications (bell icon on every dashboard)
//   - fee collection workflow (approved / fetched / unfetched)
//   - improvement suggestions
//   - image uploads (hostels, rooms, students, wardens)
//
// Idempotent — safe to run more than once.
// ---------------------------------------------------------------------------

async function tableHasColumn(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  return Number(rows[0].n) > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table]
  );
  return Number(rows[0].n) > 0;
}

async function addColumn(conn, table, column, definition) {
  if (await tableHasColumn(conn, table, column)) {
    console.log(`  column ${table}.${column} already exists`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
  console.log(`  added ${table}.${column}`);
}

async function ensureTable(conn, ddl, name) {
  if (await tableExists(conn, name)) {
    console.log(`  table ${name} already exists`);
    return;
  }
  await conn.query(ddl);
  console.log(`  created ${name}`);
}

async function main() {
  const conn = await pool.getConnection();

  console.log("Expanding bookings…");
  await addColumn(conn, "bookings", "warden_id", "INT UNSIGNED NULL");
  await addColumn(conn, "bookings", "fee_amount", "INT NOT NULL DEFAULT 0");
  await addColumn(conn, "bookings", "approved_by", "VARCHAR(255) NULL");
  await addColumn(conn, "bookings", "approved_at", "VARCHAR(30) NULL");
  await addColumn(conn, "bookings", "rejected_by", "VARCHAR(255) NULL");
  await addColumn(conn, "bookings", "rejected_at", "VARCHAR(30) NULL");
  await addColumn(conn, "bookings", "reason", "VARCHAR(500) NULL");
  await addColumn(conn, "bookings", "updated_at", "TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");
  // historical tracking timeline (JSON array of {status, at, by, note})
  await addColumn(conn, "bookings", "tracking", "JSON NULL");

  console.log("Expanding fees…");
  await addColumn(conn, "fees", "status", "VARCHAR(20) NOT NULL DEFAULT 'approved'");
  await addColumn(conn, "fees", "reference", "VARCHAR(40) NULL");
  await addColumn(conn, "fees", "collected_by", "VARCHAR(255) NULL");
  await addColumn(conn, "fees", "remarks", "VARCHAR(500) NULL");
  await addColumn(conn, "fees", "updated_at", "TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");

  console.log("Expanding hostel_rooms…");
  await addColumn(conn, "hostel_rooms", "image_url", "VARCHAR(500) NULL");

  console.log("Expanding students…");
  await addColumn(conn, "students", "image_url", "VARCHAR(500) NULL");

  console.log("Creating notifications table…");
  await ensureTable(
    conn,
    `CREATE TABLE IF NOT EXISTS notifications (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id    INT UNSIGNED NOT NULL,
      type       VARCHAR(50)  NOT NULL DEFAULT 'info',
      title      VARCHAR(255) NOT NULL DEFAULT '',
      message    TEXT         NULL,
      link       VARCHAR(255) NULL,
      data       JSON         NULL,
      is_read    TINYINT(1)   NOT NULL DEFAULT 0,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_notifications_user (user_id),
      KEY idx_notifications_read (user_id, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "notifications"
  );

  console.log("Creating improvements table…");
  await ensureTable(
    conn,
    `CREATE TABLE IF NOT EXISTS improvements (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code         VARCHAR(30)  NOT NULL,
      student_name VARCHAR(255) NULL,
      hostel_id    INT UNSIGNED NULL,
      warden_id    INT UNSIGNED NULL,
      category     VARCHAR(50)  NOT NULL DEFAULT 'Other',
      subject      VARCHAR(255) NOT NULL DEFAULT '',
      description  TEXT         NOT NULL,
      status       VARCHAR(30)  NOT NULL DEFAULT 'Submitted',
      remarks      TEXT         NULL,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_improvements_code (code),
      KEY idx_improvements_hostel (hostel_id),
      KEY idx_improvements_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "improvements"
  );

  // Backfill warden_id + fee_amount on existing pending/approved bookings where possible.
  try {
    const [rows] = await pool.query(
      "SELECT b.id, b.hostel_id, s.monthly_fee FROM bookings b JOIN hostels h ON h.id = b.hostel_id LEFT JOIN students s ON s.id = 0 WHERE b.warden_id IS NULL"
    );
    if (rows.length) {
      await conn.query(
        `UPDATE bookings b
         JOIN users u ON u.role = 'warden' AND u.hostel_id = b.hostel_id
         SET b.warden_id = u.id
         WHERE b.warden_id IS NULL`
      );
      console.log(`  backfilled warden_id for bookings (${rows.length} rows)`);
    }
    await conn.query("UPDATE bookings SET fee_amount = 18000 WHERE fee_amount = 0");
    console.log("  backfilled default fee_amount for bookings");
  } catch (err) {
    console.log(`  backfill skipped: ${err.message}`);
  }

  conn.release();
  await pool.end();
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});