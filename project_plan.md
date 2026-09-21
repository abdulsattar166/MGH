# Mubarak Group of Hostels — Management System

## 1. Project Description
A private management system (admin dashboard) that sits behind the existing Mubarak Group of Hostels public website. It gives the hostel chain a single place to run daily operations — students, rooms, fees, attendance, complaints and visitors — without touching the public site.

Two roles:
- **Admin (Owner):** sees and manages all 6 hostels, all students, all wardens, and global reports.
- **Warden:** sees and manages only their own assigned hostel.

This is built with temporary sample data first; a backend will be connected later to make logins and saved data permanent.

## 2. Page Structure (Management Routes)
- `/manage/login` — management login (role selection)
- `/manage` — dashboard (role-aware overview)
- `/manage/students` — students / residents records
- `/manage/rooms` — room & bed allocation
- `/manage/fees` — fees / rent tracking & payments
- `/manage/attendance` — daily check-in / attendance
- `/manage/complaints` — complaints & maintenance
- `/manage/visitors` — visitor log
- `/manage/reports` — reports & analytics
- `/manage/settings` — warden accounts & hostel settings (Admin only)

## 3. Core Features
- [x] Management login with real accounts (Owner sign-up + Warden accounts)
- [x] Dashboard with stats, charts and recent activity
- [x] Students / Residents records (add, edit, search, status, detail view)
- [x] Room & bed allocation (assign students to rooms/beds)
- [x] Fees / rent tracking & payment status
- [x] Attendance / check-in
- [x] Complaints & maintenance tracking (real DB + auto-routing to the hostel warden)
- [x] Visitor log (check-in / check-out)
- [x] Reports & analytics (real database queries, filterable)
- [x] Warden & hostel settings (Super Admin only)

## 4. Data Model (Supabase)
| Table | Key fields |
|-------|-----------|
| profiles | id, role, name, email, hostel_id (auth accounts) |
| students | id, name, father_name, cnic, phone, hostel_id, room, bed, room_type, university, program, guardian_phone, join_date, monthly_fee, status |
| attendance | id, student_id, date, check_in, check_out, status |
| fees | id, student_id, month, amount, paid, paid_at, method |
| rooms / beds | derived on the client from student room/bed assignments |
| complaints | id, student_id, hostel_id, category, description, status, created_at (planned) |
| visitors | id, hostel_id, name, cnic, visiting_student, purpose, check_in, check_out |

## 5. Backend / Third-party Integrations
- **Database / Auth:** connected to SaaS Supabase — real logins with unique credentials, role-based access (owner sees all, wardens scoped to their hostel). Accounts live in `auth.users` + `profiles` table. Students, attendance and fees now live in Supabase tables with RLS scoping wardens to their own hostel.
- **Auth flows:** email confirmation + forgot/reset password enabled (reset handled via `/manage/reset-password`).
- **Payments:** not required yet — fees are tracked/recorded only, no online payment.
- **Others:** none.

## 6. Development Phase Plan

### Phase 1: Login + Management Shell + Dashboard
- Goal: Give the management system its foundation — a login screen, the workspace layout (sidebar + top bar), and a role-aware dashboard with stats and charts.
- Deliverable: working `/manage/login` and `/manage` dashboard, with admin vs warden views.

### Phase 2: Students / Residents
- Goal: Full student records — list, search/filter, add/edit/delete, and student detail.
- Deliverable: `/manage/students` and `/manage/students/:id`.
- Status: ✅ Complete

### Phase 3: Rooms & Bed Allocation
- Goal: Visual room grid per hostel with bed-level occupancy and student assignment.
- Deliverable: `/manage/rooms`.
- Status: ✅ Complete

### Phase 4: Fees & Payments
- Goal: Fee records per student, payment status tracking, collect/record payment.
- Deliverable: `/manage/fees`.
- Status: ✅ Complete

### Phase 5: Attendance
- Goal: Daily check-in/out tracking and attendance list.
- Deliverable: `/manage/attendance`.
- Status: ✅ Complete

### Phase 6: Complaints & Maintenance
- Goal: Raise, track and resolve complaints/maintenance requests.
- Deliverable: `/manage/complaints`.

### Phase 7: Visitor Log
- Goal: Record visitors with check-in/check-out.
- Deliverable: `/manage/visitors`.
- Status: ✅ Complete

### Phase 8: Reports & Settings
- Goal: Aggregated reports/analytics, and warden + hostel settings (Admin only).
- Deliverable: `/manage/reports` and `/manage/settings`.

## 7. Recent Public-Site Updates
- Hero redesigned to a two-column layout (video left, text right).
- Video showcase now opens reels in a full-screen autoplay overlay.
- Admission page and FAQs page removed from navigation/routes; FAQs now render as a shared section above the footer on every page.
- About page and home About section now include a CEO (Mubarak Khan) section and a Wardens section (one warden per hostel).
- Hostel Rooms section redesigned to a floor/block model — 5 floors (Blocks A–E) × 10 rooms = 50 rooms per hostel, with Available / Room Full / Maintenance status.
- Home Hero height reduced to a single desktop viewport (video + text side-by-side, responsive `vh`-based height, mobile stacks naturally).
- Every room now has its own image: a shared per-room store (`src/lib/roomImages.ts`) assigns a deterministic dummy placeholder to each room key (e.g. `1-A1`) and lets the Admin/Warden panel upload/replace a photo for a single room. Room images appear on the public RoomGrid, the booking room step, and the admin RoomCard.

## 8. Room & Bed Booking System (localStorage demo)
- Rebuilt the public `/booking` page as a 6-step reservation flow: Hostel → Room → Bed → Details → Documents → Confirm, with a final confirmation screen showing a generated Booking ID and "Pending Approval" status.
- Availability is calculated at the **bed level** (not just room level). Rooms show a live free-bed count; full rooms are disabled. Pending bookings "reserve" a bed, approved bookings "occupy" it, and rejected/cancelled bookings release it.
- Applicant form collects personal, contact, address, CNIC (number + front/back image upload with preview), joining date, duration, emergency contact and notes — with no university/educational fields.
- A shared `localStorage` store (`src/lib/booking.ts`) acts as the demo "database" and syncs in real time (via a change event + cross-tab `storage` listener) between the public site, the warden panel and the admin panel.
- New `/manage/bookings` page: admin sees all bookings (filterable by hostel, status, search); wardens only see their own hostel. Admins/wardens can view full applicant details (including CNIC previews) and approve/reject. The dashboard shows a "New Booking Requests" widget.
- Architecture is intentionally written behind small single-purpose functions so localStorage can later be swapped for a REST API (Node.js/Express + MySQL) without changing the UI.

## 9. Pending — Room Live Sync (needs backend)
- A `rooms` table (hostel_id, block, number, floor, capacity, status) is planned so room status syncs between the public site and the warden dashboard.
- Warden dashboard room management (move-in / move-out, update status) and public availability will both read from this table.
- Blocked until the backend (SaaS Supabase) connection is re-established.

## 10. Warden, Complaint & Reporting System (implemented)
- **Roles expanded:** `admin` (Super Admin), `superintendent`, `warden`, `student` — stored in `profiles.role`. `profiles.hostel_id` maps a warden to a hostel; `profiles.student_id` links a student account.
- **Official wardens:** Yousaf Mehsood (Jinnah Hostel #1), Abdullah (Sama Hostel #2), Bilah Ahmed (Abdul Qadir Hostel #3). Accounts are created/updated by the one-time `bootstrap-wardens` function.
- **Database:** new `hostels`, `students` and `complaints` tables with RLS. A complaint references the student, hostel and responsible warden.
- **Edge functions:** `manage-wardens` (list/create/update/reset-password/activate/deactivate/delete; admin-only server check), `complaints-api` (server-side role + hostel filtering; a new complaint auto-routes to the hostel's warden), `reports-api` (aggregated live figures with filters).
- **Warden scoping:** a warden only ever sees their own hostel's students and complaints — enforced server-side (RLS + function checks), never trusted from the client.
- **Complaint flow:** students submit at `/complaint` and the warden is derived from their hostel. Super Admin, Superintendent and the responsible warden can see it; other wardens never can. Statuses: Pending / Under Review / Assigned / In Progress / Resolved / Rejected, with remarks.
- **Reports:** `/manage/reports` — total students, occupancy, vacant beds, complaints by status/hostel, warden-wise statistics; all from the database with real filters (hostel / warden / status / date).
- **Warden management:** `/manage/settings` — add/edit warden, change name/phone/email/photo/hostel/position, activate/deactivate, reset password; reassigning a hostel applies the new permissions immediately.
- **Warden login:** `/hostel/:id/warden-login` authenticates against Supabase and blocks wardens from accessing another hostel.

## 11. Hostel Admin Panels (role rename)
- The `warden` role is now shown to users as **"Hostel Admin"**, and `admin` as **"Super Admin"** — via a single display helper (`src/lib/roles.ts`). The stored role value stays `warden` so Supabase data, RLS and the Express backend keep working unchanged.
- One hostel admin per hostel (all 6 hostels). The super admin sees all hostels; each hostel admin is scoped to their own hostel (server-side via RLS + edge-function checks).
- **Backend (Express/MySQL):** `requireHostelAdmin` middleware added; `/api/wardens` replaced by `/api/hostel-admins` (`backend/src/routes/hostelAdmins.js`) and a `seedHostelAdmins.js` script seeds one hostel admin per hostel.
- **Database (MySQL):** a `hostel_admins` view lists one hostel admin per hostel (`database/schema.sql`).