# Frontend (React + Vite)

> **Where the frontend code lives:** the frontend is the React app at the
> **project root** (`src/`, `index.html`, `package.json`, `vite.config.ts`,
> etc.). This folder exists to document it. The platform builds the frontend
> from the project root, so the code is kept there (in one place) instead of
> being duplicated here — that prevents two copies from drifting apart.

## What is the frontend?

A React + TypeScript + Tailwind CSS single-page app (Vite). Its files are:

| Path                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `src/pages/`          | All page components                  |
| `src/components/`     | Reusable base + feature components   |
| `src/hooks/`          | Data-fetching hooks (auth, students, etc.) |
| `src/lib/`            | API client, booking/room logic, etc. |
| `src/mocks/`          | Demo/placeholder data                |
| `src/router/`         | Routing configuration                |
| `src/i18n/`           | Translations                         |
| `src/main.tsx`        | App entry point                      |
| `src/index.css`       | Global styles                        |
| `index.html`          | HTML entry point                     |
| `package.json`        | Dependencies & scripts               |
| `vite.config.ts`      | Vite config                          |
| `tailwind.config.ts`  | Tailwind theme                       |

## How to run it

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Two backends (dual-mode)

The frontend's data layer supports **two backends** through a single config
switch:

- **Supabase** (default) — used by the live site. No extra config needed.
- **REST API** (the local Node/Express + MySQL backend in `../backend`).

To switch to the local backend, set this in the frontend `.env`:

```
VITE_PUBLIC_API_URL=http://localhost:4000/api
```

Leave it unset to keep using Supabase.

The files that switch behaviour are:

- `src/lib/api.ts` — the REST API client + token storage
- `src/hooks/useAuth.ts` — authentication
- `src/hooks/useStudents.ts`, `useFees.ts`, `useAttendance.ts`,
  `useVisitors.ts`, `useFeeTrend.ts` — data fetching
- `src/lib/booking.ts` — bookings (now server-side via `/api/bookings`)
- `src/hooks/useBookings.ts`, `useHostelRooms.ts`, `useAvailabilitySummaries.ts` — booking/room data
- `src/pages/manage/reset-password/page.tsx` — password reset
- `src/pages/manage/settings/page.tsx` — warden management