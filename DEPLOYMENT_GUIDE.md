# 🚀 M&D Engineers Deployment Guide

## Backend Deployment on Railway

### Prerequisites
- [ ] Railway account created
- [ ] PostgreSQL database provisioned on Railway
- [ ] Backend code pushed to GitHub

### Step 1: Add Environment Variables to Railway

In Railway dashboard, set these variables:

```env
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
JWT_REFRESH_SECRET=your-secure-random-string-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

**⚠️ IMPORTANT:** Railway automatically provides:
- `PORT` (dynamically assigned)
- `DATABASE_URL` (from PostgreSQL plugin)

**DO NOT** manually set these.

### Step 2: Verify Backend is Ready

Your backend is already configured correctly:

✅ Uses `process.env.PORT || 8000` in `server.js`
✅ Uses `DATABASE_URL` in `config/db.js`
✅ CORS is enabled in `app.js`
✅ Health check route exists at `/health`
✅ All routes start with `/api`

### Step 3: Deploy Backend

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Railway will automatically:
   - Build with `npm install`
   - Run with `npm start` (from package.json)
   - Assign a PORT
   - Connect to PostgreSQL

4. Test health endpoint:
   ```
   https://m-and-d-engineering-production.up.railway.app/health
   ```

**Response should be:**
```json
{
  "success": true,
  "message": "M&D Engineers ERP API running",
  "timestamp": "2026-05-05T..."
}
```

---

## Frontend Deployment on Vercel

### Step 1: Update Environment Variables

Frontend automatically uses correct API URL based on environment:

**Local Development** (`.env.local`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=https://m-and-d-engineering-production.up.railway.app/api
```

### Step 2: Deploy Frontend

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Vercel will automatically:
   - Build with `npm run build`
   - Deploy to `*.vercel.app`

### Step 3: Update Railway CORS (Optional)

If Vercel deployment URL is different, update backend CORS in `src/app.js`:

```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

Currently using `cors()` which allows all origins (safe for API).

---

## 🔍 Testing Checklist

### Backend Tests
- [ ] Health check: `GET https://m-and-d-engineering-production.up.railway.app/health`
- [ ] Login API: `POST https://m-and-d-engineering-production.up.railway.app/api/auth/login`
- [ ] Database connection verified in Railway logs
- [ ] No localhost references in logs

### Frontend Tests
- [ ] Build completes: `npm run build`
- [ ] Login page loads on Vercel
- [ ] Can submit login form
- [ ] API calls reach Railway backend (check Network tab in DevTools)
- [ ] No CORS errors in console

---

## 🐛 Troubleshooting

### "Can't reach backend from frontend"
✅ Check: Frontend `.env` has Railway URL
✅ Check: Backend is running on Railway (check logs)
✅ Check: Backend `/health` endpoint responds

### "Database connection failed"
✅ Check: `DATABASE_URL` exists in Railway variables
✅ Check: PostgreSQL plugin is connected
✅ Check: Backend logs show connection attempts

### "CORS error"
✅ Current: `app.use(cors())` allows all origins
✅ If needed: Update `cors()` with specific origin

### "Login fails even though backend works"
✅ Check: `/api/auth/login` route exists
✅ Check: No JWT_SECRET undefined (causes signing errors)
✅ Check: Database has admin user (run migration)

---

## 📝 Environment Variables Reference

### Backend (.env / Railway)

| Variable | Required | Source |
|----------|----------|--------|
| `PORT` | No | Railway (auto) |
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | Railway PostgreSQL plugin |
| `JWT_SECRET` | Yes | You must set this |
| `JWT_REFRESH_SECRET` | Yes | You must set this |
| `JWT_EXPIRES_IN` | No | Defaults to `24h` |
| `JWT_REFRESH_EXPIRES_IN` | No | Defaults to `7d` |
| `BCRYPT_ROUNDS` | No | Defaults to `12` |

### Frontend (.env)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Production: `https://m-and-d-engineering-production.up.railway.app/api` |
| `VITE_PUBLIC_GOOGLE_CLIENT` | Your Google OAuth client ID |

---

## 🚨 Common Mistakes (AVOID!)

❌ Hardcoding `app.listen(8000)` → Use `process.env.PORT || 8000`
❌ Using `localhost` in frontend → Use Railway URL
❌ Missing `DATABASE_URL` → Railway provides automatically
❌ Disabling CORS → Keep `cors()` enabled
❌ Forgetting JWT secrets → Backend crashes on auth requests

---

## ✅ Current Status

✅ Backend configured correctly
✅ Frontend pointing to Railway URL
✅ Database using CONNECTION_STRING
✅ CORS enabled
✅ All routes under `/api`
✅ Health check available

**Ready to deploy! 🎉**
