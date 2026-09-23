-- ============================================================================
-- Mubarak Hostels — MySQL database schema
-- Import this file first to create the database and all tables.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS mubarak_hostels
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mubarak_hostels;

-- ---------------------------------------------------------------------------
-- users — authentication + hostel admin / super admin profiles (replaces Supabase auth)
--   role 'admin'  = Super Admin (sees all hostels)
--   role 'warden' = Hostel Admin (scoped to one hostel via hostel_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255)     NOT NULL,
  email         VARCHAR(255)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  role          ENUM('admin','warden') NOT NULL DEFAULT 'warden',
  hostel_id     INT UNSIGNED     NULL,
  phone         VARCHAR(50)      NULL,
  avatar_url    VARCHAR(500)     NULL,
  position      VARCHAR(100)     NULL,
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  student_id    INT UNSIGNED     NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP        NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_hostel (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- hostels — the physical hostels / branches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostels (
  id       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name     VARCHAR(255)  NOT NULL,
  gender   VARCHAR(20)   NOT NULL DEFAULT 'boys',
  location VARCHAR(255)  NOT NULL DEFAULT '',
  address  VARCHAR(500)  NULL,
  phone    VARCHAR(50)   NULL,
  email    VARCHAR(255)  NULL,
  image_url VARCHAR(500) NULL,
  facilities JSON        NULL,
  code     VARCHAR(50)   NULL,
  description TEXT       NULL,
  status   VARCHAR(20)   NOT NULL DEFAULT 'active',
  rooms    INT UNSIGNED  NOT NULL DEFAULT 0,
  beds     INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_hostels_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- students — hostel residents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(255) NOT NULL,
  father_name    VARCHAR(255) NOT NULL DEFAULT '',
  cnic           VARCHAR(50)  NOT NULL DEFAULT '',
  phone          VARCHAR(50)  NOT NULL DEFAULT '',
  hostel_id      INT UNSIGNED NOT NULL,
  room           VARCHAR(50)  NOT NULL DEFAULT '',
  bed            INT          NOT NULL DEFAULT 1,
  room_type      VARCHAR(50)  NOT NULL DEFAULT '',
  university     VARCHAR(255) NOT NULL DEFAULT '',
  program        VARCHAR(255) NOT NULL DEFAULT '',
  guardian_phone VARCHAR(50)  NOT NULL DEFAULT '',
  join_date      VARCHAR(20)  NOT NULL DEFAULT '',
  monthly_fee    INT          NOT NULL DEFAULT 0,
  status         VARCHAR(20)  NOT NULL DEFAULT 'Active',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_students_hostel (hostel_id),
  KEY idx_students_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- fees — monthly fee records per student
--   status: 'approved' (generated) / 'fetched' (collected) / 'unfetched' (due)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  month      VARCHAR(7)   NOT NULL,          -- format YYYY-MM
  amount     INT          NOT NULL DEFAULT 0,
  paid       TINYINT(1)   NOT NULL DEFAULT 0,
  paid_at    VARCHAR(20)  NULL,
  method     VARCHAR(50)  NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'approved',
  reference  VARCHAR(40)  NULL,
  collected_by VARCHAR(255) NULL,
  remarks    VARCHAR(500) NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fees_student_month (student_id, month),
  KEY idx_fees_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- attendance — daily attendance records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  date       VARCHAR(10)  NOT NULL,          -- format YYYY-MM-DD
  check_in   VARCHAR(5)   NULL,              -- format HH:mm
  check_out  VARCHAR(5)   NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'present',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_student_date (student_id, date),
  KEY idx_attendance_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- visitors — visitor register
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitors (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hostel_id        INT UNSIGNED NOT NULL,
  name             VARCHAR(255) NOT NULL,
  cnic             VARCHAR(50)  NULL,
  visiting_student VARCHAR(255) NULL,
  purpose          VARCHAR(255) NULL,
  check_in         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out        DATETIME     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visitors_hostel (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- bookings — public room booking requests (replaces localStorage demo store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id          VARCHAR(20)  NOT NULL,         -- tracking id e.g. MGH-2026-000184
  hostel_id   INT UNSIGNED NOT NULL,
  hostel_name VARCHAR(255) NOT NULL DEFAULT '',
  room_label  VARCHAR(20)  NOT NULL,
  block       VARCHAR(5)   NOT NULL,
  floor       INT          NOT NULL,
  bed_number  INT          NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  applicant   JSON         NOT NULL,
  warden_id   INT UNSIGNED NULL,
  fee_amount  INT          NOT NULL DEFAULT 0,
  approved_by VARCHAR(255) NULL,
  approved_at VARCHAR(30)  NULL,
  rejected_by VARCHAR(255) NULL,
  rejected_at VARCHAR(30)  NULL,
  reason      VARCHAR(500) NULL,
  tracking    JSON         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_hostel (hostel_id),
  KEY idx_bookings_status (status),
  KEY idx_bookings_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- rooms — the room catalog (structure shared across all hostels)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label      VARCHAR(10)  NOT NULL,           -- e.g. "A1"
  block      VARCHAR(5)   NOT NULL,           -- "A".."E"
  floor      INT          NOT NULL,           -- 1..5
  room_type  VARCHAR(50)  NOT NULL,
  capacity   INT          NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_label (label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- maintenance — beds under maintenance (per hostel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hostel_id  INT UNSIGNED NOT NULL,
  room_label VARCHAR(10)  NOT NULL,
  bed        INT          NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_maintenance (hostel_id, room_label, bed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- hostel_admins — read-only view listing one hostel admin (warden) per hostel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW hostel_admins AS
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.position,
  u.is_active,
  u.hostel_id,
  h.name AS hostel_name
FROM users u
LEFT JOIN hostels h ON h.id = u.hostel_id
WHERE u.role = 'warden';

-- ---------------------------------------------------------------------------
-- complaints — complaint & maintenance requests
--   warden_id holds the stringified users.id of the responsible warden so the
--   frontend (which uses UUID-style string ids) keeps working unchanged.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- complaint_responses — reply thread under a complaint
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_responses (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  complaint_id INT UNSIGNED NOT NULL,
  author_id    VARCHAR(64)  NULL,
  author_name  VARCHAR(255) NULL,
  author_role  VARCHAR(30)  NULL,
  message      TEXT         NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_complaint_responses_complaint (complaint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- buildings — physical building blocks within a hostel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buildings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- blocks — blocks within a building
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- hostel_rooms — per-hostel rooms (the public catalog `rooms` table above
-- stays as a shared structure; this is the real per-hostel inventory).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_rooms (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- hostel_beds — beds inside a hostel room
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_beds (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id        INT UNSIGNED NOT NULL,
  bed_number     INT          NOT NULL,
  is_maintenance TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_hostel_beds (room_id, bed_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- room_allocations — who sleeps in which bed (mirrors Supabase)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_allocations (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  room_id    INT UNSIGNED NOT NULL,
  bed_id     INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alloc_student (student_id),
  UNIQUE KEY uq_alloc_bed (bed_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notices — notices board per hostel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- audit_logs — activity trail (opt-in; never breaks the main flow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notifications — in-app notifications behind the bell icon
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',   -- booking | fee | attendance | complaint | improvement | system
  title      VARCHAR(255) NOT NULL DEFAULT '',
  message    TEXT         NULL,
  link       VARCHAR(255) NULL,
  data       JSON         NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- improvements — student improvement / suggestion submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS improvements (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Uploaded image columns (drag & drop uploads stored via the uploads API)
--   hostels.image_url, users.avatar_url and students.image_url already exist;
--   hostel_rooms.image_url is the per-room photo.
-- ---------------------------------------------------------------------------
-- ALTER TABLE hostel_rooms ADD COLUMN image_url VARCHAR(500) NULL;
-- ALTER TABLE students ADD COLUMN image_url VARCHAR(500) NULL;