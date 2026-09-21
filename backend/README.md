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

   Default admin: `abdulsattar1717asm@gmail.com` / `Admin@12345`
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
| GET    | `/api/wardens`                   | List wardens (admin only)          |
| POST   | `/api/wardens`                   | Create warden (admin only)         |
| DELETE | `/api/wardens/:id`               | Delete warden (admin only)         |

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
        └── wardens.js
```