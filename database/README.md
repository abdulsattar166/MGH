# Database (MySQL)

This folder contains everything you need to set up the MySQL database for the
Mubarak Hostels project.

## Files

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `schema.sql`  | Creates the database and all tables.                 |
| `seed.sql`    | Inserts realistic demo data (hostels, students, etc). |

## Tables

| Table                | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `users`              | Admin / warden login accounts (with password). |
| `hostels`            | The hostel branches.                          |
| `students`           | Hostel residents.                             |
| `fees`               | Monthly fee records per student.              |
| `attendance`         | Daily attendance records.                     |
| `visitors`           | Visitor register.                             |
| `bookings`           | Public room booking requests.                 |
| `rooms`              | Shared room catalog (structure).              |
| `maintenance`        | Beds under maintenance.                       |
| `complaints`         | Complaint & maintenance requests.             |
| `complaint_responses`| Complaint reply threads.                      |
| `buildings`          | Buildings within a hostel.                    |
| `blocks`             | Blocks within a building.                     |
| `hostel_rooms`       | Per-hostel room inventory.                    |
| `hostel_beds`        | Beds inside a hostel room.                    |
| `room_allocations`   | Which student sleeps in which bed.            |
| `notices`            | Notice board per hostel.                      |
| `audit_logs`         | Activity trail.                               |

## Migrating an existing database

If you already imported an older copy of `schema.sql` and need to bring it up
to date without wiping your data, run the backend migration script instead:

```bash
cd backend
npm run migrate
```

The script adds the new columns to `users` and `hostels`, creates the new
tables, rebuilds the `hostel_admins` view and seeds the new tables (buildings,
blocks, per-hostel rooms/beds, allocations, notices, complaints) only when they
are empty. It is safe to run multiple times.

## How to import

### Option A — MySQL command line

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

### Option B — phpMyAdmin

1. Open phpMyAdmin and go to the **Import** tab.
2. Choose `schema.sql` and click **Go**.
3. Repeat with `seed.sql`.

### Option C — MySQL Workbench

1. Open MySQL Workbench and connect to your server.
2. Run `File > Open SQL Script`, select `schema.sql`, then execute.
3. Repeat with `seed.sql`.

> **Note:** The `users` table (admin/warden accounts) is **not** seeded here,
> because passwords need to be securely hashed. Instead, the backend includes a
> one-time script to create the admin account — see `backend/README.md`
> ("Create the admin account").