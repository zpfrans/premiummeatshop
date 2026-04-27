# Production Security Hardening Checklist
**Farmer's Premium Meatshop - Security Verification**

---

## 🔒 Pre-Deployment Security Tasks

### 1. Secrets & Credentials

- [ ] Generated strong JWT_SECRET (64+ chars)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Set strong ADMIN_SEED_PASSWORD (16+ chars, mixed case, numbers, symbols)
  ```
  Example: Tr0pic@lM34tSh0p#2024
  ```

- [ ] Database password is strong and unique

- [ ] No secrets hardcoded in code (grep for "password", "secret", "token")

- [ ] `.env` files added to `.gitignore`

- [ ] Production `.env` stored in secure location (1Password, Vault, etc)

---

### 2. Database Security

- [ ] Using managed PostgreSQL (Render, AWS RDS, etc)

- [ ] Database NOT publicly accessible

- [ ] Username and password are unique (not default postgres/postgres)

- [ ] Database connection uses SSL

- [ ] Automated backups enabled
  - [ ] Daily backups
  - [ ] 30-day retention minimum
  - [ ] Test restore procedure

- [ ] Database user has minimal required permissions

---

### 3. API Security

#### Authentication
- [ ] JWT tokens expire after 8 hours (JWT_EXPIRES_IN)
- [ ] Admin routes require JWT validation
- [ ] Passwords hashed with bcrypt (not stored in plain text)

#### Authorization
- [ ] Only admins can access `/api/admin/*` routes
- [ ] Users cannot modify other users' orders
- [ ] Expense endpoint restricted to admins

#### CORS
- [ ] CORS restricted to production frontend domain(s) only
  ```
  ✅ https://shop.farmerpremiummeat.com
  ❌ * (wildcard)
  ❌ http://localhost:*
  ```

#### Rate Limiting
- [ ] Login rate limiting: 5 attempts per 15 minutes per IP
- [ ] API rate limiting: 100 requests per 15 minutes per IP
- [ ] These prevent brute force and DoS attacks

#### Input Validation
- [ ] All form inputs validated with Zod schemas
- [ ] File uploads limited to images only
- [ ] File size limit: 5MB
- [ ] No arbitrary file uploads allowed

#### Error Messages
- [ ] No sensitive info in error messages
- [ ] No stack traces exposed to client
- [ ] Consistent error responses

---

### 4. HTTPS & SSL

- [ ] HTTPS enforced on all endpoints
- [ ] HTTP requests redirected to HTTPS
- [ ] SSL certificate is valid and not expired
- [ ] Certificate auto-renewal configured

#### Testing HTTPS:
```bash
curl -I https://your-backend-url/api/health
# Should see: HTTP/2 200
# Should see: Strict-Transport-Security header

# No mixed content warnings in browser console
```

---

### 5. Security Headers

**Backend automatically sets (via Helmet.js):**
- ✅ Content-Security-Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ X-XSS-Protection

#### Verify in browser:
```
F12 → Network → Select any request → Response Headers
Look for: Content-Security-Policy, X-Frame-Options, etc
```

---

### 6. File Upload Security

- [ ] Only image files allowed (image/png, image/jpeg, image/webp)
- [ ] File size limited to 5MB
- [ ] Files stored in non-executable directory
- [ ] File names sanitized (no path traversal attacks)
- [ ] File access requires authentication

#### In Production (Optional Future):
- [ ] Use object storage (AWS S3, Azure Blob) instead of local disk
- [ ] Scan uploads for malware (ClamAV, etc)
- [ ] Generate thumbnails for display (prevent large uploads)

---

### 7. Logging & Monitoring

- [ ] Error logs collected and centralized
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Log retention: 30 days minimum
- [ ] Alerts configured for errors

#### Check logs:
```bash
# View recent errors
tail -f backend/logs/error.log

# Or in Render dashboard:
Service → Logs → Filter
```

---

### 8. Admin Access

- [ ] Admin login requires username + password
- [ ] Admin password changed immediately after first login
- [ ] Consider enabling 2FA (optional future feature)
- [ ] Admin activity logged

#### Post-deployment:
1. Login with seed admin credentials
2. Change password immediately (in app)
3. Consider IP whitelist for admin panel (firewall level)

---

### 9. API Rate Limiting Verification

```bash
# Test rate limit (login endpoint)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
  echo "Request $i"
done

# 6th request should be rate limited: 429 Too Many Requests
```

---

### 10. Payment Proof Upload Security

- [ ] Only authenticated users can upload
- [ ] File validated (image type, size)
- [ ] File stored securely
- [ ] File URL not directly accessible (requires auth)
- [ ] Proof visible only to customer and admin

---

### 11. Data Privacy

- [ ] Customer data not shared with third parties
- [ ] Export functionality doesn't expose unnecessary fields
- [ ] No PII in logs or error messages
- [ ] Customers can request data deletion (future feature)

---

### 12. Third-Party Dependencies

- [ ] All npm packages are from reputable sources
- [ ] No malware detected

#### Check for vulnerabilities:
```bash
npm audit

# Fix if any critical vulnerabilities
npm audit fix
```

---

### 13. Deployment Environment

- [ ] Production environment variables set correctly
- [ ] NODE_ENV=production (enables optimizations)
- [ ] Debug mode disabled
- [ ] Verbose logging disabled (except errors)

---

### 14. Database Backup & Recovery

#### Backup Procedure:
```bash
cd backend

# Backup production database
DATABASE_URL="postgres://..." npm run backup:db

# File saved to: backend/backups/TIMESTAMP.dump
```

#### Restore Procedure:
```bash
# Restore to clean database
DATABASE_URL="postgres://..." npm run restore:db -- backups/FILENAME.dump

# Verify restored data
psql $DATABASE_URL
```

- [ ] Backup tested monthly
- [ ] Recovery time objective (RTO): < 1 hour
- [ ] Recovery point objective (RPO): < 24 hours

---

### 15. Frontend Security

- [ ] No API keys stored in frontend code (all calls go through backend)
- [ ] No sensitive data in localStorage (auth handled via secure cookies)
- [ ] Dependencies checked for vulnerabilities

```bash
cd frontend
npm audit
```

---

## 🚨 Emergency Procedures

### Suspected Security Breach

1. **Disable admin access immediately**
   ```bash
   # Restart backend to invalidate tokens
   # Then reset admin password in database
   ```

2. **Check logs for unauthorized access**
   ```bash
   tail -n 1000 backend/logs/error.log
   grep "401\|403" backend/logs/access.log
   ```

3. **Review database for suspicious changes**
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;
   ```

4. **Reset JWT_SECRET**
   - Update in production environment
   - Invalidates all existing tokens
   - Users must log in again

5. **Rotate database password**
   - Update PostgreSQL user password
   - Update DATABASE_URL in production
   - Restart backend

6. **Review and audit logs**
   - Check access logs for suspicious IPs
   - Check error logs for attack patterns
   - Consider enabling WAF (firewall rules)

---

## ✅ Launch Readiness

Before going live with real customers:

```
[ ] All items in this checklist completed
[ ] Full order flow tested in production
[ ] Admin interface tested and working
[ ] Payment proof upload working
[ ] Exports generating correctly
[ ] No console errors in browser
[ ] Response times acceptable (< 2s)
[ ] Mobile site responsive
[ ] 404 page works
[ ] Error page works (try /invalid-url)
[ ] HTTPS working with green lock
[ ] No warning icons
```

---

## 📞 Support & Incidents

**For security issues:**
- Email: security@farmerpremiummeatshop.com (set up later)
- Report vulnerabilities responsibly

**For operational issues:**
- Check logs first
- Verify environment variables
- Test database connectivity
- Check Render service status

---

**Security Level: Production ✅**
Generated: 2024-01-15

