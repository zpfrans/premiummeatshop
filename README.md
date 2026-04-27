# Farmer's Premium Meatshop (Production Build)

This repository now includes a production-oriented full stack split:

- `frontend/` React + Vite customer/admin app
- `backend/` Node.js + Express API with PostgreSQL

## Quick Start (Local)

1. Start PostgreSQL:
   - `docker compose up -d`
2. Backend setup:
   - `cd backend`
   - copy `.env.example` to `.env` and adjust values
   - `npm install`
   - `npm run migrate:up`
   - `npm run seed`
   - `npm run dev`
3. Frontend setup:
   - `cd frontend`
   - copy `.env.example` to `.env`
   - `npm install`
   - `npm run dev`

## Deployment Files Included

- `render.yaml` (one-click Render blueprint)
- `backend/Dockerfile` and `frontend/Dockerfile`
- `backend/scripts/backup-postgres.sh`
- `backend/scripts/restore-postgres.sh`
- `PRODUCTION_CHECKLIST.md`

## Render Deployment (Recommended)

1. Push this repository to GitHub.
2. In Render, create a Blueprint deploy from your repo.
3. Use `render.yaml` and set these required env vars when prompted:
   - `FRONTEND_ORIGINS` (your frontend URL, comma-separated if multiple)
   - `ADMIN_SEED_PASSWORD` (strong password)
   - `VITE_API_BASE_URL` (your backend URL + `/api` for static frontend service)
4. After deploy:
   - Test `/api/health`
   - Login as seeded admin and rotate credentials.

## Docker Deployment (Alternative)

- Backend:
  - `docker build -t farmerpremium-backend ./backend`
- Frontend:
  - `docker build -t farmerpremium-frontend ./frontend`
- PostgreSQL:
  - Use managed postgres (preferred) or `docker compose up -d`.

## Backups and Restore

- Backup:
  - `cd backend`
  - `DATABASE_URL=... npm run backup:db`
- Restore:
  - `cd backend`
  - `DATABASE_URL=... npm run restore:db -- backups/your-file.dump`

## Key Production Features Included

- Admin authentication with JWT and role checks
- Server-side order/checkout validation
- Secure upload handling for payment proof
- Enforced status transition workflow
- Notifications and admin operations endpoints
- Expense tracking and order/expense export endpoints
- Migration-based schema management and seed script
- Health endpoint and baseline security middleware

## Test Commands

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
