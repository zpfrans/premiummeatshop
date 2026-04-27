# Complete Setup & Deployment Guide
**Farmer's Premium Meatshop - Production Ready**

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Deployment (Render)](#production-deployment-render)
3. [GitHub Repository Setup](#github-repository-setup)
4. [Security Configuration](#security-configuration)
5. [Testing & Validation](#testing--validation)
6. [Monitoring & Backups](#monitoring--backups)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (`node --version`)
- PostgreSQL 13+ (or Docker)
- npm or yarn

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in separate terminal)
cd frontend
npm install
```

### Step 2: Start PostgreSQL (Docker)

```bash
# From project root
docker compose up -d

# Verify PostgreSQL is running
docker compose ps
```

### Step 3: Database Setup

```bash
cd backend

# Run migrations
npm run migrate:up

# Seed starter data (creates admin user)
npm run seed

# Verify database
# psql postgres://postgres:postgres@localhost:5432/farmerpremiummeatshop
```

### Step 4: Start Backend

```bash
cd backend
npm run dev
# Should show: "Server running on http://localhost:4000"
```

### Step 5: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 6: Test Locally

**Frontend:** http://localhost:5173
- Try placing an order
- Upload payment proof

**Backend Health:** http://localhost:4000/api/health

**Admin Panel:** (via frontend - login with admin/dev_password_change_in_production)
- Verify order appears
- Approve and mark delivered

---

## Production Deployment (Render)

### Step 1: GitHub Repository Setup

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - production ready"

# Create repository on github.com
# Then push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/farmerpremiummeatshop.git
git branch -M main
git push -u origin main
```

**⚠️ CRITICAL: Make sure `.env` files are in `.gitignore`:**

```bash
# Verify in .gitignore
cat .gitignore | grep ".env"
# Should include: .env, .env.local, .env.*.local
```

### Step 2: Deploy on Render

1. Go to [Render.com](https://render.com)
2. Sign up / Log in
3. **New → Blueprint**
4. Connect GitHub repository
5. Select branch: `main`
6. Render will read `render.yaml` and show preview

### Step 3: Configure Environment Variables

When Render prompts, fill in these variables:

| Variable | Example | Note |
|----------|---------|------|
| `FRONTEND_ORIGINS` | `https://shop.farmerpremiummeat.com` | Your production frontend URL |
| `ADMIN_SEED_PASSWORD` | Strong password | Generated once, change immediately after login |
| `VITE_API_BASE_URL` | `https://backend-xxxxx.onrender.com/api` | Your backend URL + `/api` |

### Step 4: Deploy

- Click **"Deploy"**
- Wait for deployment to complete (~5-10 minutes)
- Render will provide URLs:
  - Backend: `https://farmerpremium-backend-xxxxx.onrender.com`
  - Frontend: `https://farmerpremium-frontend-xxxxx.onrender.com`

### Step 5: Post-Deployment Validation

#### Test Backend Health

```bash
curl https://farmerpremium-backend-xxxxx.onrender.com/api/health
# Response: { "status": "ok" }
```

#### Full Order Flow Test

1. Open frontend URL
2. **Place Order:**
   - Name: "Test Customer"
   - Phone: "+1234567890"
   - Address: "123 Test St"
   - Proof file: Upload any image
   - Submit

3. **Admin Approval:**
   - Login: admin / (password you set)
   - See pending payment review order
   - Click "Confirm" → "Delivered"
   - Verify notification appears

4. **Data Export:**
   - Export orders (verify columns/formatting)
   - Export expenses

#### Security Check

```bash
# Verify HTTPS enforcement
curl -I https://farmerpremium-frontend-xxxxx.onrender.com
# Should see: 301 Moved Permanently (redirect to HTTPS)

# Verify CORS (from frontend console)
# Should not see CORS errors in browser console
```

---

## GitHub Repository Setup

### 1. Create .gitignore (if not present)

```bash
cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*

# Build outputs
frontend/dist/
backend/coverage/

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
```

### 2. Commit and Push

```bash
git add .gitignore
git commit -m "Add .gitignore for production deployment"
git push origin main
```

### 3. Verify GitHub

- Check GitHub repo shows all files
- Verify `.env` is NOT uploaded
- Verify `.gitignore` is present

---

## Security Configuration

### 1. Generate Production Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and use in production .env
```

### 2. Backend Security (Already Configured)

- ✅ Helmet.js (security headers)
- ✅ CORS restrictions
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ JWT authentication
- ✅ Bcrypt password hashing

### 3. CORS Configuration (render.yaml)

Render automatically restricts CORS to `FRONTEND_ORIGINS`. 

**In production, always use specific domains:**

```
✅ GOOD: https://shop.farmerpremiummeat.com,https://admin.farmerpremiummeat.com
❌ BAD:  *
❌ BAD:  http://localhost:*
```

### 4. SSL/HTTPS

- ✅ Render provides free SSL certificates
- ✅ Automatically renewed
- ✅ HTTPS enforced on all endpoints

### 5. Database Security

- ✅ Use managed PostgreSQL (Render handles backups)
- ✅ Strong password required
- ✅ No public access (private network only)

### 6. Admin Credentials

**IMMEDIATE AFTER DEPLOYMENT:**

1. Login as admin (initial seed password)
2. Change password through app
3. Never share admin credentials
4. Consider adding IP whitelist for admin access

---

## Testing & Validation

### Backend Tests

```bash
cd backend
npm test
# Run all unit tests
```

### Frontend Tests

```bash
cd frontend
npm test
# Run all component tests
```

### Production Test Checklist

- [ ] Health endpoint responds: `/api/health`
- [ ] Place order with payment proof
- [ ] Verify database saves order
- [ ] Admin login works
- [ ] Order status transitions work
- [ ] Notifications appear
- [ ] Export endpoints work
- [ ] File uploads work (image size, type validation)
- [ ] Date/time displays correctly (timezone)
- [ ] Price calculations accurate
- [ ] HTTPS enforced (no mixed content)
- [ ] No CORS errors in console

---

## Monitoring & Backups

### Health Checks (Render Setup Automatically)

Render monitors: `https://your-backend/api/health`
- Checks every 5 minutes
- Alerts if down
- Auto-restart on failure (optional)

### Error Logs

**View logs in Render Dashboard:**
1. Go to Service
2. Logs tab
3. Filter by time/severity

### Database Backups

**Render's managed PostgreSQL includes:**
- ✅ Automatic daily backups (30-day retention)
- ✅ Point-in-time recovery
- ✅ No manual backup needed

**To manually backup:**

```bash
cd backend

# Remote backup
DATABASE_URL="postgres://..." npm run backup:db

# Restore from backup
DATABASE_URL="postgres://..." npm run restore:db -- backups/FILENAME.dump
```

---

## Troubleshooting

### Backend won't start

```bash
# Check environment variables are set
echo $DATABASE_URL
echo $JWT_SECRET

# Check database connection
psql $DATABASE_URL

# Check migrations ran
npm run migrate:up

# View logs
cd backend && npm run dev
```

### Frontend shows blank page

```bash
# Check environment variables
cat frontend/.env
# Should have: VITE_API_BASE_URL=http://localhost:4000/api

# Check console for errors (F12)
# Common: Mixed content (http vs https)
```

### CORS errors

```bash
# Verify FRONTEND_ORIGINS includes frontend URL
# Backend logs should show allowed origins

# Check requests in browser DevTools Network tab
# Look for Access-Control-* headers
```

### Database connection failed

```bash
# Verify DATABASE_URL format
postgres://USER:PASSWORD@HOST:PORT/DATABASE

# Test connection
psql $DATABASE_URL

# Check if PostgreSQL is running
docker compose ps
```

### Order not appearing in admin

```bash
# Check backend logs for errors
# Verify order was sent to correct API endpoint
# Check browser DevTools Network tab
# Verify JWT token in request headers
```

---

## Production Checklist (Pre-Launch)

- [ ] GitHub repository created and code pushed
- [ ] `.env` files NOT committed
- [ ] All environment variables configured in Render
- [ ] SSL certificate active (green lock)
- [ ] Health endpoint responding
- [ ] Full order flow tested (end-to-end)
- [ ] Admin login and approvals working
- [ ] Payment proof upload working
- [ ] Export functionality working
- [ ] Database backups configured
- [ ] Error logs being collected
- [ ] Custom domain configured (optional)
- [ ] Admin password changed from seed
- [ ] Rate limits tested (no false positives)
- [ ] Mobile responsiveness checked

---

## Support & Additional Resources

- **Render Docs:** https://render.com/docs
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **PostgreSQL Backups:** https://www.postgresql.org/docs/backup/

---

**Questions?** Check the logs first:
```bash
# Backend logs
cd backend && npm run dev

# Frontend console
F12 in browser

# Database
psql $DATABASE_URL
```

Good luck! 🚀
