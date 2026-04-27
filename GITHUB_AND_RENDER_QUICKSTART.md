# GitHub & Render Deployment (Quick Start)
**Get Your App Live in 30 Minutes**

---

## Step 1: Prepare GitHub Repository (5 min)

### 1.1 Initialize Git (if not done)
```powershell
cd "c:\Users\User\OneDrive - Asia Pacific College\Desktop\farmerpremiummeatshop"

git init
git add .
git commit -m "Initial commit - production ready"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `farmerpremiummeatshop`
3. Description: `Production e-commerce platform for Farmer's Premium Meatshop`
4. Make it **Private** (for company data)
5. Click "Create repository"

### 1.3 Push to GitHub
```powershell
git remote add origin https://github.com/YOUR_USERNAME/farmerpremiummeatshop.git
git branch -M main
git push -u origin main
```

**Verify:** Go to your GitHub repo URL and confirm all files are there

---

## Step 2: Deploy on Render (10 min)

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (easier)
3. Authorize GitHub access

### 2.2 Create Blueprint Deployment
1. In Render dashboard: **New → Blueprint**
2. Select your `farmerpremiummeatshop` repository
3. Branch: `main`
4. Click **"Create"** (Render reads `render.yaml`)

### 2.3 Fill Environment Variables

When prompted, fill in:

| Variable | Value | Example |
|----------|-------|---------|
| `FRONTEND_ORIGINS` | Your frontend URL | `https://farmerpremiummeatshop.onrender.com` |
| `ADMIN_SEED_PASSWORD` | Strong password | `Tr0pic@lM34t#2024!` |
| `VITE_API_BASE_URL` | Backend URL + `/api` | `https://farmerpremium-backend-xxxxx.onrender.com/api` |

**Important:** Render shows you the backend URL in the form - copy it for VITE_API_BASE_URL!

### 2.4 Deploy
- Click **"Deploy"**
- Wait for deployment (5-10 minutes)
- Render will show:
  - Backend URL: `https://farmerpremium-backend-xxxxx.onrender.com`
  - Frontend URL: `https://farmerpremiummeatshop.onrender.com`

---

## Step 3: Verify Deployment (5 min)

### 3.1 Test Backend
```powershell
# Replace XXX with your service ID
curl https://farmerpremium-backend-xxxxx.onrender.com/api/health

# Should return: {"status":"ok"}
```

### 3.2 Test Frontend
1. Open: `https://farmerpremiummeatshop.onrender.com`
2. You should see the shop homepage
3. **No errors in browser console** (F12)

### 3.3 Full Test Order
1. Place an order:
   - Name, phone, address, upload payment proof
2. Admin login (top right):
   - Username: `admin`
   - Password: (the password you set in step 2.3)
3. Approve order:
   - Click pending order
   - Click "Confirm"
   - Click "Delivered"
4. Verify success

---

## Step 4: Post-Deployment (10 min)

### 4.1 Change Admin Password
1. Login as admin
2. Look for "Settings" or "Profile" menu
3. Change password from seeded password to your actual password
4. **Save the new password securely**

### 4.2 Configure Custom Domain (Optional)
1. In Render dashboard → Frontend Service → Settings
2. Click "Add Custom Domain"
3. Enter your domain: `shop.farmerpremiummeat.com`
4. Follow DNS setup instructions
5. Wait for SSL certificate (5-10 min)

### 4.3 Enable Monitoring
1. Render dashboard → Backend Service
2. Turn on auto-restart (recommended)
3. Set email notifications for errors

### 4.4 Test HTTPS
```powershell
# Should have green lock and no warnings
curl -I https://farmerpremiummeatshop.onrender.com

# Check for security headers
curl -I https://farmerpremium-backend-xxxxx.onrender.com/api/health | grep "Strict-Transport-Security"
```

---

## 🎉 You're Live!

Your app is now running on:
- **Frontend:** `https://farmerpremiummeatshop.onrender.com`
- **Backend:** `https://farmerpremium-backend-xxxxx.onrender.com`
- **Admin:** Login through the frontend with admin credentials

---

## ⚠️ Common Issues

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify `VITE_API_BASE_URL` is set correctly
- Verify backend is running

### Backend returns 502 Bad Gateway
- Check Render logs: Dashboard → Backend → Logs
- Wait 30 seconds (might still be starting)
- Check DATABASE_URL in environment variables

### Can't login as admin
- Verify `ADMIN_SEED_PASSWORD` was set in env vars
- Try resetting admin password via database

### CORS errors
- Verify `FRONTEND_ORIGINS` includes your frontend URL
- Make sure it's HTTPS, not HTTP
- No `localhost` in production

---

## 📊 View Logs & Monitor

**Backend Logs:**
1. Render Dashboard → farmerpremium-backend → Logs
2. Filter by "error" to see issues

**Frontend Deployment:**
1. Render Dashboard → farmerpremium-frontend → Logs
2. Check build output

**Database:**
1. Render Dashboard → farmerpremium-postgres
2. Monitor connection count, query time

---

## 🔄 Update App After Deployment

When you make code changes:

```powershell
cd project-root

# Make changes
# Test locally: npm run dev (both frontend and backend)

git add .
git commit -m "Fix bug or add feature"
git push origin main

# Render auto-deploys! (check dashboard for status)
```

---

## 🆘 Emergency: Rollback

If deployment breaks:

```powershell
git revert HEAD
git push origin main

# Render will auto-deploy the previous version
# (Check dashboard for status)
```

---

## Next Steps

1. ✅ Test with real orders
2. ✅ Add custom domain (if applicable)
3. ✅ Monitor logs for errors
4. ✅ Set up email notifications
5. ✅ Schedule regular backups
6. ✅ Train team on admin interface

---

**Documentation:**
- [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) - Full local dev setup
- [SECURITY_HARDENING.md](SECURITY_HARDENING.md) - Security checklist
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Go-live verification
- [render.yaml](render.yaml) - Deployment configuration

**Questions?**
Check `COMPLETE_SETUP_GUIDE.md` Troubleshooting section.

