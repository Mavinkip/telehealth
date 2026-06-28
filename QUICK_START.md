# Quick Start — Next.js App

The app now runs on **Next.js** for faster loading, code splitting, and a better dev experience.

## Prerequisites
- Node.js 18+
- Supabase account with database already set up (see steps below if not done)

## Step 1: Configure environment

```bash
cd web
cp .env.local.example .env.local
```

Edit `web/.env.local` with your Supabase credentials:
- **Project Settings → API** in Supabase dashboard
- Copy **Project URL** and **anon public key**

## Step 2: Install & run

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**

## Step 3: Database setup (one-time)

If you haven't already, in Supabase SQL Editor run:
1. `supabase/schema.sql`
2. `supabase/seed_data.sql`

Create admin user:
1. **Authentication → Users → Add User** → `admin@telehealth.com`
2. SQL: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@telehealth.com';`

## Test the system

| Role | Login | Features |
|------|-------|----------|
| Admin | `admin@telehealth.com` | Users, appointments, stats |
| Patient | Register → Patient | Book appointments, records, chat, video |
| Doctor | Register → Doctor | Schedule, consultations, chat, video |

## Why Next.js?

- **Faster initial load** — only loads code for the current page
- **No CDN dependency** — Supabase bundled via npm
- **Server-side data** — dashboards fetch data on the server
- **Modern routing** — `/patient/dashboard`, `/doctor/appointments`, etc.

## Legacy app

The original vanilla HTML/JS app is still in the project root (`index.html`, `js/`). Use the Next.js app in `web/` instead.

## Production

```bash
cd web
npm run build
npm start
```

## Common issues

**Login fails** → Check `.env.local` credentials and that the user exists in Supabase Auth

**Chat not real-time** → Enable Realtime for `messages` table in Supabase

**Video won't load** → Allow camera/mic permissions; needs internet for Jitsi

---

**You're ready to go!**
