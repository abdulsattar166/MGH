# Database (MySQL)

This folder contains everything you need to set up the MySQL database for the
Mubarak Hostels project.

## Files

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `schema.sql`  | Creates the database and all tables.                 |
| `seed.sql`    | Inserts realistic demo data (hostels, students, etc). |

## Tables

| Table        | Purpose                                       |
| ------------ | --------------------------------------------- |
| `users`      | Admin / warden login accounts (with password). |
| `hostels`    | The hostel branches.                           |
| `students`   | Hostel residents.                              |
| `fees`       | Monthly fee records per student.               |
| `attendance` | Daily attendance records.                      |
| `visitors`   | Visitor register.                              |
| `bookings`   | Public room booking requests.                  |

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