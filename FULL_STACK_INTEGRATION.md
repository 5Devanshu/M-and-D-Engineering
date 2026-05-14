# 🔗 Full Stack Integration Testing Guide

## The Problem You're Facing

```
Frontend (Vercel): https://your-app.vercel.app
     ↓
API Call: POST /auth/login
     ↓
❌ 404: Cannot reach backend
```

## The Root Cause

Frontend environment variable `VITE_API_BASE_URL` is not being loaded on Vercel.

---

## 🚀 Complete Fix Steps

### Phase 1: Backend (Railway)

✅ **Already done:**
- Express rate-limit configured
- CORS enabled
- Health check working
- Admin seed script ready

**Verify:**
```bash
curl https://m-and-d-engineering-production.up.railway.app/
# Should return success response
```

---

### Phase 2: Frontend Environment Variables (Vercel)

❌ **Currently missing**

**What you need to do:**

1. Go to: https://vercel.com/dashboard
2. Click your project: **md-engineers-frontend**
3. Click **Settings** → **Environment Variables**
4. Add variables:

```
Name: VITE_API_BASE_URL
Value: https://m-and-d-engineering-production.up.railway.app/api
Environments: Production, Preview, Development (select all)

Name: VITE_PUBLIC_GOOGLE_CLIENT
Value: your-google-client-id (or any placeholder)
Environments: Production, Preview, Development
```

5. Click **Save**
6. Go to **Deployments** → Click latest deployment
7. Click **Redeploy** button
8. Wait for deployment to complete

---

### Phase 3: Verify Integration

**Test 1: Check Console**
```javascript
// Open DevTools Console (F12)
// Should see:
🔗 API Base URL: https://m-and-d-engineering-production.up.railway.app/api
🔍 Environment: production
```

**Test 2: Check Network Tab**
```
1. Open DevTools → Network tab
2. Try to login
3. Look for POST request to:
   https://m-and-d-engineering-production.up.railway.app/api/auth/login
4. Should see: Status 401 or 200 (not 404)
```

**Test 3: Full Login Flow**
```bash
Email: admin@mdengineers.com
Password: Admin@123
Expected: Login successful, redirects to dashboard
```

---

## 📊 Request/Response Flow

### Correct Flow (What Should Happen)

```
1. Frontend loads
   ↓
2. Console logs: "🔗 API Base URL: https://m-and-d-engineering-production.up.railway.app/api"
   ↓
3. User enters credentials
   ↓
4. Frontend sends: POST https://m-and-d-engineering-production.up.railway.app/api/auth/login
   ↓
5. Backend receives request
   ↓
6. Backend validates credentials
   ↓
7. Backend returns: {success: true, token: "...", user: {...}}
   ↓
8. Frontend saves token to localStorage
   ↓
9. Frontend redirects to /dashboard
```

### Current (Wrong) Flow

```
1. Frontend loads
   ↓
2. Console logs: "🔗 API Base URL: undefined" ❌
   ↓
3. User enters credentials
   ↓
4. Frontend sends: POST https://m-and-d-engineering-production.up.railway.app/auth/login ❌
   (missing /api in path)
   ↓
5. Backend cannot find route
   ↓
6. Backend returns: 404 Not Found ❌
```

---

## 🔍 Debugging Checklist

### If login still fails:

**1. Verify BASE URL is correct**
```javascript
// Console
import.meta.env.VITE_API_BASE_URL
// Should output: https://m-and-d-engineering-production.up.railway.app/api
```

**2. Check Network Request**
- DevTools → Network
- Click login button
- Look for XHR request
- URL should contain `/api/auth/login`

**3. Check Backend is Running**
```bash
curl -v https://m-and-d-engineering-production.up.railway.app/health
# Should return 200 with JSON
```

**4. Check Admin User Exists**
```bash
railway run psql $DATABASE_URL
SELECT * FROM users;
# Should show admin@mdengineers.com
```

**5. Test API Directly**
```bash
curl -X POST https://m-and-d-engineering-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mdengineers.com","password":"Admin@123"}'
# Should return token or error message
```

---

## 📝 Environment Variable Checklist

### For Vercel Dashboard

- [ ] `VITE_API_BASE_URL` = `https://m-and-d-engineering-production.up.railway.app/api`
- [ ] Set for: Production, Preview, Development
- [ ] Clicked Save
- [ ] Redeployed the project

### For Local Development

File: `.env.local`
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_PUBLIC_GOOGLE_CLIENT=your-google-client-id
```

### For Production

File: `.env.production` (reference only - use Vercel dashboard)
```env
VITE_API_BASE_URL=https://m-and-d-engineering-production.up.railway.app/api
VITE_PUBLIC_GOOGLE_CLIENT=your-google-client-id
```

---

## 🎯 Expected Results

### After Proper Setup

**Console Output:**
```
🔗 API Base URL: https://m-and-d-engineering-production.up.railway.app/api
🔍 Environment: production
```

**Login Success:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@mdengineers.com",
      "role_id": 1
    }
  }
}
```

**Dashboard Loads Successfully:**
- User redirected to `/dashboard`
- Navbar shows user name
- All API calls work

---

## 🚨 Final Warning

**Do NOT:**
- ❌ Commit `.env` file to GitHub (already in .gitignore)
- ❌ Use `localhost` in production environment
- ❌ Share JWT secrets in code

**DO:**
- ✅ Set sensitive variables in Vercel Dashboard
- ✅ Use environment variable fallbacks in code
- ✅ Test locally before deploying

---

## 📞 Still Need Help?

1. **Check Vercel build logs:**
   - Dashboard → Deployments → Click latest → View logs

2. **Check Railway runtime logs:**
   - Railway Dashboard → Your Project → Logs

3. **Verify files:**
   - `.env.production` exists with correct URL
   - `src/services/Apis.js` has fallback logic
   - `Connector.js` has proper interceptors

**Your setup is almost perfect! Just need to add the environment variables to Vercel.** 🎉
