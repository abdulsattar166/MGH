# Backend (Node.js + Express + MySQL)

This is the REST API that the frontend talks to. It replaces Supabase so the
whole project can run against **your own MySQL server**.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- A running MySQL server (with the database imported — see `../database`)

## Setup

1. Open a terminal in this `backend` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and fill in your MySQL username, password, and database name.
   (Also set `JWT_SECRET` to a long random string.)

5. Create the admin account (one-time):

   ```bash
   npm run seed-admin
   ```

   Default super admins:
   - `abdulsattar1717asm@gmail.com` / `Admin@12345`
   - `mubarakmehdi@admin.com` / `mubarakhostels@12345`

   (You can edit `scripts/seedAdmin.js` before running if you want different
   credentials.)

6. Start the server:

   ```bash
   npm start
   ```

   The API will run at `http://localhost:4000`.

## API endpoints

All data endpoints require a `Authorization: Bearer <token>` header (obtained
from `/api/auth/login`).

| Method | Endpoint                         | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/api/health`                    | Health check                       |
| POST   | `/api/auth/login`                | Sign in (returns a JWT)            |
| POST   | `/api/auth/register`             | Create a warden account            |
| GET    | `/api/auth/me`                   | Current user profile               |
| POST   | `/api/auth/reset-password-request` | Request password reset           |
| POST   | `/api/auth/update-password`      | Update own password                |
| GET    | `/api/students`                  | List students                      |
| POST   | `/api/students`                  | Add a student                      |
| POST   | `/api/students/bulk`             | Bulk-import students               |
| GET    | `/api/students/cnics`            | Existing CNIC list (import)        |
| PUT    | `/api/students/:id`              | Update a student                   |
| DELETE | `/api/students/:id`              | Delete a student                   |
| GET    | `/api/fees?month=YYYY-MM`        | List fees (optionally by month)    |
| POST   | `/api/fees/upsert`               | Create/update a fee record         |
| GET    | `/api/attendance`                | List attendance                    |
| POST   | `/api/attendance/upsert`         | Create/update attendance           |
| POST   | `/api/attendance/checkout`       | Set checkout time                  |
| GET    | `/api/visitors`                  | List visitors                      |
| POST   | `/api/visitors`                  | Check a visitor in                 |
| PUT    | `/api/visitors/:id/checkout`     | Check a visitor out                |
| GET    | `/api/bookings`                  | List bookings                      |
| POST   | `/api/bookings`                  | Create a booking                   |
| PUT    | `/api/bookings/:id/status`       | Update booking status              |
| POST   | `/api/complaints/list`           | Role-scoped complaint list         |
| POST   | `/api/complaints/create`         | Submit a complaint                 |
| POST   | `/api/complaints/update`         | Update a complaint                 |
| POST   | `/api/complaints/lookup`         | Anon lookup by CNIC / student id   |
| GET    | `/api/complaints/:id/responses`  | Complaint reply thread             |
| POST   | `/api/complaints/:id/responses`  | Add a reply                        |
| GET    | `/api/wardens`                   | List hostel admins (admin only)    |
| POST   | `/api/wardens`                   | List hostel admins                 |
| POST   | `/api/wardens/manage`            | Create/update/reset/activate/delete |
| POST   | `/api/reports`                   | Aggregated reports/analytics       |
| GET    | `/api/hostels`                   | Hostel references                  |
| GET    | `/api/hostels/full`              | Hostels with derived stats         |
| POST   | `/api/hostels`                   | Create a hostel                    |
| PUT    | `/api/hostels/:id`               | Update a hostel                    |
| DELETE | `/api/hostels/:id`               | Delete a hostel                    |
| GET    | `/api/rooms/data?hostelId=N`     | Rooms, beds and allocations        |
| POST   | `/api/rooms/assign`              | Assign a student to a bed          |
| POST   | `/api/rooms/unassign`            | Remove a student from a bed        |
| POST   | `/api/rooms/beds/:id/maintenance`| Toggle bed maintenance             |
| POST   | `/api/rooms/add`                 | Add a room + its beds              |
| POST   | `/api/rooms/bulk`                | Bulk-import rooms + beds           |
| PUT    | `/api/rooms/:id`                 | Update a room                      |
| DELETE | `/api/rooms/:id`                 | Delete a room                      |
| GET    | `/api/rooms/occupancy`           | Occupancy by hostel                |
| GET    | `/api/rooms/keys`                | Existing room keys (import)        |
| GET    | `/api/rooms/public-availability/:hostelId` | Public room availability |
| GET    | `/api/rooms/booking-rooms?hostelId=N`    | Booking-ready room list   |
| GET    | `/api/buildings`                 | Buildings with stats               |
| POST   | `/api/buildings`                 | Create a building                  |
| PUT    | `/api/buildings/:id`             | Update a building                  |
| DELETE | `/api/buildings/:id`             | Delete a building                  |
| GET    | `/api/blocks`                    | Blocks with stats                  |
| POST   | `/api/blocks`                    | Create a block                     |
| PUT    | `/api/blocks/:id`                | Update a block                     |
| DELETE | `/api/blocks/:id`                | Delete a block                     |
| GET    | `/api/notices?hostelId=N`        | List notices                       |
| POST   | `/api/notices`                   | Create a notice                    |
| PUT    | `/api/notices/:id`               | Update a notice                    |
| DELETE | `/api/notices/:id`               | Delete a notice                    |
| GET    | `/api/audit-logs?limit=N`        | List audit log entries             |
| POST   | `/api/audit-logs`                | Write an audit log entry           |
| GET    | `/api/maintenance?hostelId=N`    | Beds under maintenance             |
| POST   | `/api/maintenance/toggle`        | Mark/unmark a bed as maintenance   |
| GET    | `/api/public/rooms`              | Shared room catalog (public)       |
| GET    | `/api/public/availability/:hostelId` | Public availability (public)   |
| GET    | `/api/public/track/:reference`   | Track a booking status (public)    |
| GET    | `/api/public/wardens`            | Public warden directory            |
| POST   | `/api/public/bookings`           | Public booking submission          |

## Project structure

```
backend/
├── package.json
├── .env.example
├── scripts/
│   └── seedAdmin.js        # one-time admin account setup
└── src/
    ├── index.js            # server entry point
    ├── db.js               # MySQL connection pool
    ├── middleware/
    │   └── auth.js         # JWT helpers + auth middleware
    └── routes/
        ├── auth.js
        ├── students.js
        ├── fees.js
        ├── attendance.js
        ├── visitors.js
        ├── bookings.js
        ├── complaints.js
        ├── wardens.js
        ├── hostelAdmins.js
        ├── reports.js
        ├── hostels.js
        ├── rooms.js
        ├── buildings.js
        ├── blocks.js
        ├── notices.js
        ├── auditLogs.js
        ├── maintenance.js
        └── public.js
```