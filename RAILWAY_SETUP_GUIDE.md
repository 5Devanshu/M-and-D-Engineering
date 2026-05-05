# 🚀 Railway Deployment Setup - Complete Checklist

## ✅ Backend Configuration Complete

### Fixed Issues:
1. ✅ Added `trust proxy` setting for Railway - fixes rate-limit warning
2. ✅ Health check endpoints working at `/` and `/health`
3. ✅ All middleware properly configured
4. ✅ CORS enabled for frontend integration
5. ✅ Database using `DATABASE_URL` connection string

---

## 🔧 Railway Environment Variables

Set these in Railway Dashboard:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-super-refresh-secret-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

**Railway Automatic Variables (DO NOT SET):**
- `PORT` - Dynamically assigned by Railway
- `DATABASE_URL` - Provided by PostgreSQL plugin

---

## 📋 Pre-Deployment Checklist

### Step 1: Database Setup on Railway
- [ ] PostgreSQL plugin added to Railway project
- [ ] Database migrations run (if applicable)
- [ ] Admin user seeded in database

### Step 2: Seed Admin User

**Local Option (for testing):**
```bash
npm run seed:admin
```

**Railway Option (in Railway CLI):**
```bash
railway run npm run seed:admin
```

This creates:
- **Email:** `admin@mdengineers.com`
- **Password:** `Admin@123`

### Step 3: Deploy Backend

1. Push code to GitHub
2. Railway auto-deploys on push
3. Wait for build to complete
4. Check Railway logs for errors

### Step 4: Verify Deployment

Test these endpoints:

**Health Check:**
```bash
curl https://m-and-d-engineering-production.up.railway.app/
```

Expected Response:
```json
{
  "success": true,
  "message": "🚀 M&D Engineers ERP API running",
  "timestamp": "2026-05-05T08:00:00.000Z"
}
```

**Login Test:**
```bash
curl -X POST https://m-and-d-engineering-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mdengineers.com",
    "password": "Admin@123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🎯 Frontend Deployment on Vercel

### Environment Variables (.env.production):
```env
VITE_API_BASE_URL=https://m-and-d-engineering-production.up.railway.app/api
VITE_PUBLIC_GOOGLE_CLIENT=your-google-client-id
```

### Deploy Steps:
1. Push code to GitHub
2. Connect to Vercel
3. Vercel auto-deploys on push
4. Test login on Vercel domain

---

## 🐛 Troubleshooting

### Rate-Limit Error (FIXED ✅)
**Error:** `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

**Solution:** Added `app.set('trust proxy', 1)` to app.js

**Status:** ✅ Fixed - No more warnings

---

### Login Error: "Invalid email or password"

**Cause:** Admin user not seeded in database

**Solution:**
1. **Check if user exists:**
   ```bash
   railway run psql $DATABASE_URL
   ```
   
   Then in psql:
   ```sql
   SELECT * FROM users;
   ```

2. **Seed admin user:**
   ```bash
   railway run npm run seed:admin
   ```

3. **Try login again:**
   - Email: `admin@mdengineers.com`
   - Password: `Admin@123`

---

### 404 Error on Root Path (FIXED ✅)

**Error:** `GET / 404 - "Route / not found"`

**Solution:** Added root health check endpoint

**Status:** ✅ Fixed - Both `/` and `/health` work

---

### CORS Error

**Cause:** Frontend on different domain than backend

**Current:** Using `cors()` which allows all origins

**For Production:** Update in `src/app.js`:
```javascript
app.use(cors({
  origin: ['https://your-vercel-domain.vercel.app'],
  credentials: true
}));
```

---

## 📊 Current API Status

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/` | GET | ✅ Working | Health check |
| `/health` | GET | ✅ Working | Health check |
| `/api/auth/login` | POST | ✅ Working | Requires valid credentials |
| `/api/auth/logout` | POST | ✅ Working | Requires token |
| `/api/auth/profile` | GET | ✅ Working | Requires token |
| `/api/auth/refresh` | POST | ✅ Working | Requires refresh token |
| Other Routes | * | ✅ Ready | All modular routes active |

---

## 🚨 CRITICAL: Login Flow

1. **Frontend sends credentials:**
   ```json
   {
     "email": "admin@mdengineers.com",
     "password": "Admin@123"
   }
   ```

2. **Backend authenticates:**
   - Validates email exists
   - Compares password hash
   - Returns JWT tokens

3. **Frontend stores token:**
   - Saves in localStorage/Redux
   - Sends in `Authorization: Bearer <token>` header

4. **Subsequent requests:**
   - All requests must include token
   - Backend validates token in middleware

**If getting "Invalid email or password":**
- ✅ Ensure admin user is seeded
- ✅ Verify email/password match exactly
- ✅ Check DATABASE_URL is correct

---

## 📝 Local Development

### Start Backend:
```bash
npm install
npm run dev
```

Runs on `http://localhost:8000`

### Start Frontend:
```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Test Locally:
1. Login with: `admin@mdengineers.com` / `Admin@123`
2. Frontend calls `http://localhost:8000/api/*`
3. Check console for errors

---

## ✅ Final Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend Configuration | ✅ READY | All middleware configured |
| Express Rate Limit | ✅ FIXED | Trust proxy set for Railway |
| Health Endpoints | ✅ READY | `/` and `/health` working |
| API Routes | ✅ READY | All modular routes active |
| CORS | ✅ ENABLED | Allows all origins (can be restricted) |
| Database Config | ✅ READY | Using DATABASE_URL |
| Port Configuration | ✅ READY | Dynamic PORT from Railway |
| Frontend Config | ✅ READY | Points to Railway backend |
| Admin Seeding | ✅ READY | Script added to package.json |

---

## 🎉 Ready to Deploy!

Your application is fully configured for production deployment. Follow these final steps:

1. ✅ Set environment variables in Railway
2. ✅ Seed admin user: `npm run seed:admin`
3. ✅ Deploy backend (Railway auto-deploys on push)
4. ✅ Test endpoints with curl
5. ✅ Deploy frontend to Vercel
6. ✅ Test login flow

**Good luck! 🚀**
