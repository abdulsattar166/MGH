import dotenv from "dotenv";
import { pool } from "../src/db.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Idempotent schema migration for the Mubarak Hostels MySQL backend.
//
// Upgrades an existing database (the pre-full-parity schema) in place:
//   - adds new columns to `users` and `hostels`
//   - creates the tables the REST API needs (complaints, hostel_rooms, ...)
//   - recreates the `hostel_admins` view
//   - seeds the new tables only when they are empty
//
// Safe to run more than once.
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

async function tableIsEmpty(conn, table) {
  const [rows] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
  return Number(rows[0].n) === 0;
}

async function addColumn(conn, table, column, definition) {
  if (await tableHasColumn(conn, table, column)) {
    console.log(`  column ${table}.${column} already exists`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
  console.log(`  added ${table}.${column}`);
}

async function main() {
  const conn = await pool.getConnection();

  console.log("Migrating users…");
  await addColumn(conn, "users", "phone", "VARCHAR(50) NULL");
  await addColumn(conn, "users", "avatar_url", "VARCHAR(500) NULL");
  await addColumn(conn, "users", "position", "VARCHAR(100) NULL");
  await addColumn(conn, "users", "is_active", "TINYINT(1) NOT NULL DEFAULT 1");
  await addColumn(conn, "users", "student_id", "INT UNSIGNED NULL");
  await addColumn(conn, "users", "updated_at", "TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");

  console.log("Migrating hostels…");
  await addColumn(conn, "hostels", "address", "VARCHAR(500) NULL");
  await addColumn(conn, "hostels", "phone", "VARCHAR(50) NULL");
  await addColumn(conn, "hostels", "email", "VARCHAR(255) NULL");
  await addColumn(conn, "hostels", "image_url", "VARCHAR(500) NULL");
  await addColumn(conn, "hostels", "facilities", "JSON NULL");
  await addColumn(conn, "hostels", "code", "VARCHAR(50) NULL");
  await addColumn(conn, "hostels", "description", "TEXT NULL");
  await addColumn(conn, "hostels", "status", "VARCHAR(20) NOT NULL DEFAULT 'active'");
  await addColumn(conn, "hostels", "rooms", "INT UNSIGNED NOT NULL DEFAULT 0");
  await addColumn(conn, "hostels", "beds", "INT UNSIGNED NOT NULL DEFAULT 0");
  await addColumn(conn, "hostels", "updated_at", "TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");

  console.log("Backfilling hostel cover images…");
  const HOSTEL_IMAGES = [
    [1, "https://readdy.ai/api/search-image?query=Modern%20five%20storey%20student%20hostel%20building%20exterior%20with%20warm%20cream%20facade%20and%20sage%20green%20accent%20details%2C%20clean%20minimal%20residential%20architecture%2C%20manicured%20landscaped%20entrance%20with%20lush%20green%20plants%20and%20trees%2C%20warm%20golden%20hour%20sunlight%2C%20clear%20blue%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-01-jinnah&orientation=landscape"],
    [2, "https://readdy.ai/api/search-image?query=Contemporary%20student%20hostel%20building%20exterior%20with%20warm%20beige%20facade%20and%20modern%20windows%2C%20four%20storey%20clean%20residential%20architecture%2C%20tidy%20landscaped%20front%20garden%20with%20green%20shrubs%20and%20pathway%2C%20soft%20warm%20morning%20light%2C%20bright%20blue%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-02-sama&orientation=landscape"],
    [3, "https://readdy.ai/api/search-image?query=Elegant%20student%20hostel%20residence%20exterior%20with%20warm%20sandstone%20facade%20and%20balcony%20railings%2C%20modern%20clean%20architecture%20with%20large%20windows%2C%20neat%20entrance%20with%20potted%20plants%20and%20green%20landscaping%2C%20warm%20late%20afternoon%20golden%20light%2C%20clear%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-03-abdulqadir&orientation=landscape"],
  ];
  for (const [hid, img] of HOSTEL_IMAGES) {
    await conn.query(
      "UPDATE hostels SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url = '')",
      [img, hid]
    );
  }

  console.log("Creating tables…");
  await conn.query(`CREATE TABLE IF NOT EXISTS complaints (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code         VARCHAR(30)  NOT NULL,
      student_id   INT UNSIGNED NULL,
      student_name VARCHAR(255) NULL,
      student_code VARCHAR(100) NULL,
      hostel_id    INT UNSIGNED NULL,
      warden_id    VARCHAR(64)  NULL,
      room         VARCHAR(50)  NULL,
      category     VARCHAR(50)  NOT NULL DEFAULT 'Other',
      description  TEXT         NOT NULL,
      priority     VARCHAR(20)  NOT NULL DEFAULT 'Normal',
      status       VARCHAR(30)  NOT NULL DEFAULT 'Pending',
      remarks      TEXT         NULL,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_complaints_code (code),
      KEY idx_complaints_hostel (hostel_id),
      KEY idx_complaints_student (student_id),
      KEY idx_complaints_status (status),
      KEY idx_complaints_warden (warden_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS complaint_responses (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      complaint_id INT UNSIGNED NOT NULL,
      author_id    VARCHAR(64)  NULL,
      author_name  VARCHAR(255) NULL,
      author_role  VARCHAR(30)  NULL,
      message      TEXT         NOT NULL,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_complaint_responses_complaint (complaint_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS buildings (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      hostel_id   INT UNSIGNED NOT NULL,
      name        VARCHAR(255) NOT NULL,
      description TEXT         NULL,
      status      VARCHAR(20)  NOT NULL DEFAULT 'active',
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_buildings_hostel (hostel_id),
      UNIQUE KEY uq_buildings (hostel_id, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS blocks (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      hostel_id   INT UNSIGNED NOT NULL,
      building_id INT UNSIGNED NOT NULL,
      name        VARCHAR(255) NOT NULL,
      status      VARCHAR(20)  NOT NULL DEFAULT 'active',
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_blocks_hostel (hostel_id),
      KEY idx_blocks_building (building_id),
      UNIQUE KEY uq_blocks (building_id, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS hostel_rooms (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      hostel_id   INT UNSIGNED NOT NULL,
      building_id INT UNSIGNED NULL,
      block_id    INT UNSIGNED NULL,
      room_number VARCHAR(50)  NOT NULL,
      floor       INT          NOT NULL DEFAULT 1,
      room_type   VARCHAR(50)  NOT NULL DEFAULT '',
      capacity    INT          NOT NULL DEFAULT 3,
      status      VARCHAR(20)  NOT NULL DEFAULT 'active',
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_hostel_rooms (hostel_id, room_number),
      KEY idx_hostel_rooms_floor (floor),
      KEY idx_hostel_rooms_building (building_id),
      KEY idx_hostel_rooms_block (block_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS hostel_beds (
      id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
      room_id        INT UNSIGNED NOT NULL,
      bed_number     INT          NOT NULL,
      is_maintenance TINYINT(1)   NOT NULL DEFAULT 0,
      created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_hostel_beds (room_id, bed_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS room_allocations (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      student_id INT UNSIGNED NOT NULL,
      room_id    INT UNSIGNED NOT NULL,
      bed_id     INT UNSIGNED NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_alloc_student (student_id),
      UNIQUE KEY uq_alloc_bed (bed_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS notices (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      hostel_id   INT UNSIGNED NOT NULL,
      title       VARCHAR(255) NOT NULL,
      body        TEXT         NOT NULL,
      author_name VARCHAR(255) NULL,
      is_pinned   TINYINT(1)   NOT NULL DEFAULT 0,
      expires_at  VARCHAR(30)  NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_notices_hostel (hostel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await conn.query(`CREATE TABLE IF NOT EXISTS audit_logs (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id     VARCHAR(64)  NULL,
      user_name   VARCHAR(255) NULL,
      user_role   VARCHAR(30)  NULL,
      action      VARCHAR(120) NOT NULL,
      resource    VARCHAR(50)  NULL,
      resource_id VARCHAR(64)  NULL,
      details     TEXT         NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_audit_logs_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  console.log("Recreating hostel_admins view…");
  await conn.query(`
    CREATE OR REPLACE VIEW hostel_admins AS
    SELECT u.id, u.name, u.email, u.phone, u.position, u.is_active, u.hostel_id, h.name AS hostel_name
    FROM users u
    LEFT JOIN hostels h ON h.id = u.hostel_id
    WHERE u.role = 'warden'`);

  // ---- seed new tables when empty -----------------------------------------
  const catalogExists = await tableExists(conn, "rooms");
  const hostelsCount = catalogExists
    ? (await conn.query("SELECT COUNT(*) AS n FROM hostels"))[0][0].n
    : 0;

  if (hostelsCount > 0 && (await tableIsEmpty(conn, "buildings"))) {
    const [hs] = await conn.query("SELECT id FROM hostels");
    for (const h of hs) {
      await conn.query(
        "INSERT INTO buildings (hostel_id, name, description, status) VALUES (?, 'Main Building', 'Five floors: Blocks A–E.', 'active')",
        [h.id]
      );
    }
    console.log("  seeded buildings");
  }

  if (hostelsCount > 0 && (await tableIsEmpty(conn, "blocks"))) {
    const [bs] = await conn.query("SELECT id, hostel_id FROM buildings");
    for (const b of bs) {
      for (const name of ["A", "B", "C", "D", "E"]) {
        await conn.query(
          "INSERT INTO blocks (hostel_id, building_id, name, status) VALUES (?, ?, ?, 'active')",
          [b.hostel_id, b.id, name]
        );
      }
    }
    console.log("  seeded blocks");
  }

  if (catalogExists && hostelsCount > 0 && (await tableIsEmpty(conn, "hostel_rooms"))) {
    await conn.query(`
      INSERT INTO hostel_rooms (hostel_id, building_id, block_id, room_number, floor, room_type, capacity, status)
      SELECT h.id, b.id, blk.id, r.label, r.floor, r.room_type, r.capacity, 'active'
      FROM hostels h
      JOIN buildings b ON b.hostel_id = h.id
      JOIN blocks blk ON blk.building_id = b.id
      JOIN rooms r ON r.block = blk.name`);
    console.log("  seeded hostel_rooms");
  }

  if (hostelsCount > 0 && (await tableIsEmpty(conn, "hostel_beds"))) {
    await conn.query(`
      INSERT INTO hostel_beds (room_id, bed_number)
      SELECT hr.id, n.n
      FROM hostel_rooms hr
      JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) n
        ON n.n <= hr.capacity`);
    console.log("  seeded hostel_beds");
  }

  // No demo data is seeded: rooms and beds are created empty and fully
  // available so the project starts fresh. Students, fees, attendance,
  // bookings, complaints and notices are added by the user through the app.

  conn.release();
  await pool.end();
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});