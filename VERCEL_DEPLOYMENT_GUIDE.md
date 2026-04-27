# Vercel Deployment Guide - Farmer's Premium Meatshop

**Project:** Full-stack React + Node.js + PostgreSQL  
**Date:** April 27, 2026

---

## Deployment Architecture Options

You have two main options for deploying to Vercel:

### Option 1: Frontend on Vercel + Backend Elsewhere (RECOMMENDED)
- **Frontend:** Deploy React app to Vercel (fast, CDN, automatic scaling)
- **Backend:** Deploy to Render, Railway, or Heroku (easier PostgreSQL integration)
- **Database:** Managed PostgreSQL on Railway/Render
- **Pros:** Simpler setup, better performance, easier maintenance
- **Cons:** Multiple platforms to manage

### Option 2: Full-Stack on Vercel with Serverless Backend
- **Frontend:** Deploy React app to Vercel
- **Backend:** Deploy as Vercel serverless functions
- **Database:** External (Railway, Render, etc.)
- **Pros:** Single platform, integrated deployment
- **Cons:** Serverless cold starts, function limitations, more complex

---

## STEP 1: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (https://vercel.com - free tier available)
- GitHub account (already have this ✅)

### Deploy Frontend
1. **Connect GitHub:**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Connect your GitHub account
   - Select `premiummeatshop` repository

2. **Configure Frontend:**
   - **Root Directory:** `./frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Environment Variables:**
   - Add: `VITE_API_BASE_URL` = `https://your-backend-api.com/api`
   - (You'll set actual backend URL after deploying backend)

4. **Click Deploy**
   - Vercel will automatically deploy when you push to GitHub
   - Your frontend URL: `https://premiummeatshop.vercel.app`

### Frontend Deployment Status
- ✅ React app pre-built successfully (verified earlier)
- ✅ Dependencies secure (0 CVE)
- ✅ Build optimization ready

---

## STEP 2: Deploy Backend (Choose One Option)

### Option A: Deploy to Render (EASIEST - RECOMMENDED)

**Advantages:**
- Free PostgreSQL included
- Auto-deploys from GitHub
- Similar to Heroku (familiar interface)
- One-click blueprints

**Steps:**

1. **Create Render Account:**
   - Go to https://www.render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database:**
   - Click "New" → "PostgreSQL"
   - Name: `farmerpremiummeatshop`
   - Region: Select closest to you
   - PostgreSQL Version: 16
   - Create database
   - Note the **Internal Database URL**

3. **Deploy Backend:**
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Select `premiummeatshop` repo
   - Configuration:
     - **Name:** `premiummeatshop-api`
     - **Root Directory:** `Backend`
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

4. **Set Environment Variables:**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (paste from PostgreSQL service)
   - `JWT_SECRET` = `Pm9$kL2@xR7#nQ5&vZ1!bJ4*sH8%tG3cDvWqAb6YpXjNmUkFhLsIoEtR9GzC4T`
   - `JWT_EXPIRES_IN` = `8h`
   - `FRONTEND_ORIGINS` = `https://premiummeatshop.vercel.app`
   - `ADMIN_SEED_USERNAME` = `admin`
   - `ADMIN_SEED_PASSWORD` = `meatshoppremium`
   - `PORT` = (leave blank, Render sets automatically)
   - `UPLOAD_DIR` = `uploads`
   - `MAX_UPLOAD_SIZE_MB` = `5`

5. **Deploy & Verify:**
   - Render will deploy automatically
   - Your backend URL: `https://premiummeatshop-api.render.com`
   - Test health endpoint: `https://premiummeatshop-api.render.com/api/health`

6. **Run Migrations:**
   - After first deployment, connect via Render shell or use their CLI
   - Or manually in your local backend: `npm run migrate:up`
   - Then: `npm run seed` (creates admin user)

---

### Option B: Deploy to Railway

**Advantages:**
- Modern alternative to Render/Heroku
- PostgreSQL built-in
- Good free tier

**Steps:**
1. Go to https://railway.app
2. Create project from GitHub
3. Select repository and `Backend` directory
4. Railway will auto-detect Node.js
5. Add PostgreSQL plugin
6. Set environment variables (same as Render)
7. Deploy

---

### Option C: Deploy to Heroku (Legacy but Works)

**Note:** Heroku discontinued free tier. Requires payment.

---

## STEP 3: Connect Frontend to Backend

After backend is deployed:

1. **Update Frontend Environment:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `VITE_API_BASE_URL` = `https://premiummeatshop-api.render.com/api`
   - Redeploy frontend (automatic on git push, or manual in dashboard)

2. **Test Connection:**
   - Visit frontend: https://premiummeatshop.vercel.app
   - Try to load products (should show "No products" initially)
   - Admin login with:
     - Username: `admin`
     - Password: `meatshoppremium`

---

## STEP 4: Database Setup & Seeding

### Run Initial Migrations

**Option 1: Using Render Shell (Recommended)**
1. Go to Render Dashboard → PostgreSQL service
2. Click "Connect" tab
3. Copy connection string
4. In your local terminal:
   ```bash
   # From Backend directory
   DATABASE_URL="your_render_connection_string" npm run migrate:up
   DATABASE_URL="your_render_connection_string" npm run seed
   ```

**Option 2: Manual Setup via Backend**
1. Deploy backend first
2. Render will run any `start` hooks (if configured)
3. Manually trigger migrations via script or API

---

## STEP 5: Upload File Handling

**Important:** Vercel's frontend is serverless (read-only `/tmp` storage).

### Payment Proof Storage Options:

**Option A: Disk Storage (Render Backend)**
- Backend stores files in `uploads/` directory
- Render persists directory between deployments
- Works for medium traffic
- Simple implementation (already configured!)

**Option B: External Storage (Production Ready)**
- Implement AWS S3, Cloudinary, or similar
- Recommended for scaling
- Requires code changes

For now, Option A works fine since you're using Render which persists storage.

---

## Deployment Checklist

### Pre-Deployment ✅
- [x] All tests passing (3 backend, 1 frontend)
- [x] No CVE vulnerabilities
- [x] Code linting clean
- [x] Async error handling fixed
- [x] JWT_SECRET secured
- [x] Admin password updated to `meatshoppremium`
- [x] Environment files created and configured

### Frontend Deployment
- [ ] Push latest code to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Set `VITE_API_BASE_URL` environment variable
- [ ] Deploy and test build

### Backend Deployment
- [ ] Create Render account
- [ ] Create PostgreSQL database on Render
- [ ] Deploy backend service to Render
- [ ] Set all environment variables
- [ ] Test health endpoint: `/api/health`
- [ ] Run migrations and seed data

### Post-Deployment Testing
- [ ] Frontend loads without errors
- [ ] Can view products list
- [ ] Can create order
- [ ] Can upload payment proof
- [ ] Admin login works with `admin / meatshoppremium`
- [ ] Admin dashboard loads
- [ ] Database persists data

---

## Quick Start Commands (Render Deployment)

```bash
# 1. Push to GitHub
cd c:\Users\User\OneDrive - Asia Pacific College\Desktop\farmerpremiummeatshop
git add -A
git commit -m "ready for production deployment"
git push origin main

# 2. Render will auto-deploy when you connect the repo

# 3. After Render backend is live, run migrations locally:
cd Backend
$env:DATABASE_URL = "your_render_postgres_url"
npm run migrate:up
npm run seed

# 4. Update Vercel frontend environment
# (via Vercel dashboard)

# 5. Redeploy frontend
# (automatic or manual push to GitHub)
```

---

## Important Considerations

### 1. Cold Starts
- Render free tier has 15-minute auto-sleep
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier to prevent auto-sleep

### 2. File Upload Persistence
- Render's `/tmp` storage is ephemeral (resets on deploys)
- Payment proofs stored in `uploads/` directory
- Consider S3/Cloudinary for production scaling

### 3. Database Backups
- Use Render's built-in backup features
- Test restore procedure regularly
- Keep production credentials secure

### 4. Scaling
- Frontend: Vercel auto-scales (serverless)
- Backend: Render auto-scales with paid tier
- Database: Plan capacity based on growth

### 5. Cost Estimation
- **Vercel Frontend:** Free tier (commercial OK)
- **Render Backend:** Free tier (limited), $7+/month for reliable
- **PostgreSQL:** Included with Render, free tier limited to 1GB
- **Total:** ~$7-15/month for reliable setup

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs in Render dashboard
# Verify all environment variables are set
# Test locally: npm run dev
```

### CORS Errors
- Verify `FRONTEND_ORIGINS` includes Vercel URL
- Check if backend is returning correct headers

### Database Connection Failed
- Verify `DATABASE_URL` format
- Test connection with: psql $DATABASE_URL
- Ensure migrations have run

### Upload Files Not Persisting
- Render persists `/uploads` across deploys (default)
- For serverless, migrate to S3/Cloudinary

---

## Next Steps

1. **Push latest code to GitHub**
2. **Create Render account and PostgreSQL database**
3. **Deploy backend to Render**
4. **Run migrations and seed data**
5. **Connect Vercel to GitHub and deploy frontend**
6. **Update frontend environment variables**
7. **Test complete workflow**

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Your GitHub: https://github.com/zpfrans/premiummeatshop

**Deployment Ready:** ✅ Your code is production-ready!
