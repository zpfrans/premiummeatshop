## Render Environment Checklist

Set these values in the Render dashboard before production deploy.

### Backend (`farmerpremium-backend`)

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL` (from Render Postgres connection string)
- `JWT_SECRET` (strong random secret, 32+ chars)
- `JWT_EXPIRES_IN=8h`
- `FRONTEND_ORIGINS=https://<your-frontend-domain>`
- `MAX_UPLOAD_SIZE_MB=5`
- `UPLOAD_DIR=uploads`
- `TRUST_PROXY=1`
- `ADMIN_SEED_USERNAME=admin`
- `ADMIN_SEED_PASSWORD=<strong-admin-password>`

### Frontend (`farmerpremium-frontend`)

- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

### Final Pre-Deploy Checks

- Verify `JWT_SECRET` is not a dev/default value.
- Verify `FRONTEND_ORIGINS` and `VITE_API_BASE_URL` point to production URLs.
- Verify admin password is not a weak/default value.
- Run `powershell -ExecutionPolicy Bypass -File .\verify-deployment.ps1`.
