# Deployment Guide

## 1) Prepare Repository

- Ensure these directories exist and are committed:
  - `frontend/`
  - `backend/`
  - `render.yaml`
- Verify `.env` files are not committed.

## 2) Deploy on Render via Blueprint

1. Open Render -> New -> Blueprint.
2. Connect this GitHub repository.
3. Render reads `render.yaml` and creates:
   - PostgreSQL database
   - Node backend web service
   - Static frontend web service
4. Fill required variables:
   - `FRONTEND_ORIGINS`: comma-separated trusted frontend origins
   - `ADMIN_SEED_PASSWORD`: strong password
   - `VITE_API_BASE_URL`: `https://<backend-host>/api`

## 3) Post-Deploy Validation

- Visit backend health:
  - `https://<backend-host>/api/health`
- Open frontend and run one full order flow:
  - Place order with payment proof
  - Admin login
  - Move order `pending_payment_review -> confirmed -> delivered`
  - Verify notifications and exports

## 4) Rotate Defaults

- Change seeded admin password through DB script/process.
- Rotate `JWT_SECRET`.

## 5) Backups

Run backups from a secure runner/cron:

```bash
cd backend
DATABASE_URL="postgres://..." npm run backup:db
```

Restore when needed:

```bash
cd backend
DATABASE_URL="postgres://..." npm run restore:db -- backups/file.dump
```

## 6) Production Hardening Checklist

- Enforce HTTPS only
- Restrict CORS with exact origins
- Configure alerting on health check failures
- Enable retention policy for backup files
- Monitor error logs and DB usage
