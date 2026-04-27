# Production Verification Checklist
**Complete this before launching to real customers**

---

## ✅ Pre-Launch Requirements (Do NOT Skip)

### Code Quality
- [ ] All tests pass locally
  ```bash
  cd backend && npm test
  cd frontend && npm test
  ```

- [ ] No console errors/warnings
  - [ ] Backend: `npm run dev` shows no ERRORs
  - [ ] Frontend: F12 console shows no errors

- [ ] Linting passes
  ```bash
  cd backend && npm run lint
  cd frontend && npm run lint
  ```

- [ ] Build succeeds
  ```bash
  cd frontend && npm run build
  ```

---

### Security Verification
- [ ] `.env` NOT committed to Git
- [ ] Production secrets generated (JWT_SECRET, ADMIN_SEED_PASSWORD)
- [ ] No hardcoded passwords in code
- [ ] No API keys in frontend code
- [ ] Dependencies scanned for vulnerabilities
  ```bash
  cd backend && npm audit
  cd frontend && npm audit
  ```

---

### Database & Backups
- [ ] Migrations run successfully
  ```bash
  npm run migrate:up
  ```

- [ ] Seed script works
  ```bash
  npm run seed
  ```

- [ ] Backup script tested
  ```bash
  npm run backup:db
  ```

- [ ] Restore procedure verified (on separate database)

---

### Local Testing (Before Deployment)

#### Order Flow
- [ ] User can place order
- [ ] Payment proof upload works
- [ ] Order appears in database
- [ ] Admin can login
- [ ] Admin can see pending orders
- [ ] Admin can approve order
- [ ] Admin can mark delivered
- [ ] Customer notification works
- [ ] Timestamps display correctly

#### Admin Functions
- [ ] Admin login/logout works
- [ ] Only admins can access admin routes
- [ ] Order export works (CSV/JSON)
- [ ] Expense export works
- [ ] Admin can change password

#### File Handling
- [ ] Upload size limit enforced
- [ ] Only images accepted
- [ ] Malformed files rejected
- [ ] Uploaded files accessible only to auth users

---

## 🚀 Post-Deployment (On Production)

### Health Checks
```bash
# Test backend health
curl https://your-backend-domain/api/health
# Expected: {"status":"ok"}

# Test frontend loads
curl https://your-frontend-domain
# Expected: HTML response (no errors)
```

### HTTPS & Security
- [ ] Frontend has green lock icon (HTTPS)
- [ ] Backend HTTPS working
- [ ] No mixed content warnings
- [ ] Security headers present
  ```bash
  curl -I https://your-backend/api/health | grep -i "strict-transport\|x-frame\|x-content-type"
  ```

### CORS Verification
- [ ] Frontend can call backend (no CORS errors)
- [ ] Only frontend domain allowed (no *)
- [ ] Browser console clean (F12)

### Authentication
- [ ] Admin login succeeds with seed password
- [ ] JWT tokens generated correctly
- [ ] Token expiration works (8 hours)
- [ ] Logout clears auth

### Order Flow (Production Test)
1. Place test order with payment proof
2. Verify order in database
3. Admin login and approve
4. Verify notification sent
5. Admin mark delivered
6. Verify data exports work

---

## 📊 Monitoring & Performance

### Response Times
- [ ] API responses < 1 second (most endpoints)
- [ ] Frontend loads < 3 seconds
- [ ] Admin dashboard loads < 2 seconds

### Resource Usage
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connections < 10

### Error Rates
- [ ] Backend error logs < 1 error per hour
- [ ] No 500 errors
- [ ] Rate limiting working (test with rapid requests)

---

## 🔐 Security Tests

### Password Security
- [ ] Admin password changed from seed
- [ ] New password requires strong format
- [ ] Password hashing verified (bcrypt)

### API Security
- [ ] Invalid tokens rejected
- [ ] Missing auth headers rejected
- [ ] Non-admin users can't access admin routes
- [ ] Rate limiting blocks excessive requests

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Invalid data rejected

```bash
# Test rate limit
for i in {1..6}; do
  curl -X POST https://your-backend/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
# 6th request should return 429 (Too Many Requests)
```

---

## 📱 Cross-Platform Testing

- [ ] Works on Chrome/Firefox/Safari
- [ ] Works on mobile (iOS/Android)
- [ ] Responsive design on all screen sizes
- [ ] Touch events work on mobile
- [ ] Camera/file upload works on mobile

---

## 🌐 DNS & Domain (If Custom Domain)

- [ ] Domain DNS records configured
- [ ] A record points to Render IP
- [ ] SSL certificate provisioned
- [ ] CNAME records (if applicable) configured
- [ ] Domain resolves correctly

---

## 📞 Customer Support Ready

- [ ] Contact/support page created
- [ ] Email address monitored
- [ ] FAQ page available
- [ ] Error pages user-friendly (404, 500)
- [ ] Help documentation available

---

## 🔄 Disaster Recovery

- [ ] Database backup created
- [ ] Restore process tested
- [ ] Backup location documented
- [ ] Recovery time < 1 hour
- [ ] Point-in-time recovery possible

---

## 🎯 Final Sign-Off

**Ready for production?**

```
[ ] ALL items above completed
[ ] Team tested and verified
[ ] Admin password changed
[ ] Monitoring configured
[ ] Backup & recovery tested
[ ] Customer support ready
[ ] Legal/compliance checked (if applicable)

Date: ___________
Signed by: ___________
```

---

## ⚠️ Launch Day Checklist

**Do these 1 hour before going live:**

1. [ ] Final database backup taken
2. [ ] Render services health checked
3. [ ] Admin credentials verified secure
4. [ ] Monitoring alerts enabled
5. [ ] Support team briefed
6. [ ] First customer test order placed and verified
7. [ ] All logs clean (no errors)
8. [ ] Render restart tested (auto-recovery works)

---

## 🚨 Known Issues to Monitor

(Add issues discovered during testing)

- Issue 1:
- Issue 2:
- Issue 3:

---

## 📊 Performance Baselines

(Document these for monitoring)

- Backend response time: ___ ms
- Frontend load time: ___ ms
- Database query time: ___ ms
- Memory usage: ___ MB
- CPU usage: ___ %

---

## 🎉 Launch Complete!

All items verified. Application ready for real customers.

**First week monitoring:**
- [ ] Check logs daily for errors
- [ ] Monitor response times
- [ ] Verify backups running
- [ ] Monitor error rates
- [ ] Customer feedback collected

---

**For any issues, refer to:**
- [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) - Troubleshooting
- [SECURITY_HARDENING.md](SECURITY_HARDENING.md) - Security issues
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Original requirements

