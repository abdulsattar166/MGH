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
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
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
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  month      VARCHAR(7)   NOT NULL,          -- format YYYY-MM
  amount     INT          NOT NULL DEFAULT 0,
  paid       TINYINT(1)   NOT NULL DEFAULT 0,
  paid_at    VARCHAR(20)  NULL,
  method     VARCHAR(50)  NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  id          VARCHAR(20)  NOT NULL,         -- e.g. BK-2026-0001
  hostel_id   INT UNSIGNED NOT NULL,
  hostel_name VARCHAR(255) NOT NULL DEFAULT '',
  room_label  VARCHAR(20)  NOT NULL,
  block       VARCHAR(5)   NOT NULL,
  floor       INT          NOT NULL,
  bed_number  INT          NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  applicant   JSON         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_hostel (hostel_id),
  KEY idx_bookings_status (status)
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
  u.hostel_id,
  h.name AS hostel_name
FROM users u
LEFT JOIN hostels h ON h.id = u.hostel_id
WHERE u.role = 'warden';