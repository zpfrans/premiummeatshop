# Production Readiness Checklist

## Security
- [ ] Change all default credentials and rotate secrets.
- [ ] Set production-grade `JWT_SECRET`.
- [ ] Restrict CORS to production frontend domains.
- [ ] Run HTTPS only.
- [ ] Configure WAF/rate-limits at ingress.

## Data and Backups
- [ ] Run migrations on production database.
- [ ] Seed only non-sensitive starter data.
- [ ] Schedule daily backups with retention.
- [ ] Test restore on a separate environment.

## Application Validation
- [ ] Customer checkout validates name, phone, address, and proof file.
- [ ] Admin order flow verifies transitions:
  - `pending_payment_review -> confirmed -> delivered`
- [ ] Notification badge and cleanup behavior verified.
- [ ] Expense and export endpoints verified.

## Monitoring and Operations
- [ ] Health endpoint monitored: `/api/health`.
- [ ] Error logs collected and alerting configured.
- [ ] Uptime checks configured for frontend and backend.

## Pre-Go-Live Test
- [ ] Place a real test order.
- [ ] Upload payment proof.
- [ ] Approve in admin and mark delivered.
- [ ] Export orders/expenses.
- [ ] Verify all timestamps and amounts.
