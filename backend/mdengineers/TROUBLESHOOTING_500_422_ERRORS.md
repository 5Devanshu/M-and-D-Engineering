# Troubleshooting 500 & 422 Errors

## Issues Found

### 1. **500 Errors on `/api/clients` and `/api/masters/materials`**
**Cause:** Database connection issues or missing tables

**Solutions:**

#### Check 1: Verify Railway Database Connection
```bash
# Test if DATABASE_URL is set correctly in Railway
# Go to Railway Dashboard → Variables
# Should see: DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
```

#### Check 2: Verify Database Tables Exist
Run this SQL on your Railway PostgreSQL database:

```sql
-- Check if tables exist
\dt clients
\dt materials
\dt stocks
\dt employees
```

If tables don't exist, you need to run the migration:
```bash
# Locally run:
npm run migrate

# Or manually run the SQL schema file
```

#### Check 3: Check Backend Logs
Go to Railway Dashboard → Logs tab and look for:
- `PostgreSQL connection failed` - DB not connecting
- `QUERY ERROR` - SQL syntax issues
- Missing table errors

---

### 2. **422 Error on `/api/bms/templates`**
**Cause:** BMS API authentication failure with swapped credentials

**The Issue:**
You **swapped the API Key and Secret**, but BMS API expects them in specific positions.

**Current State:**
```
BMS_API_KEY=a9edc6219c45098bb1506cd230e94c7f69e13b19736e1f720704febd719c3e30
BMS_API_SECRET=098e2cd1cfccfb36b9c31e3992fbe55daf3d422f48957b3d6d6ffe69b37258d94c242dff388fc42366258587bfb2d69c82d26cddf9b61f48ef5f66793b596ee3
```

**Verify:** 
Check your BMS account dashboard to confirm which credential is the KEY and which is the SECRET. The 422 indicates:
- Invalid credentials
- Incorrect API version
- BMS account not active

**Solutions:**
1. **Verify with BMS Admin**: Confirm which is KEY and which is SECRET
2. **Check BMS Email/Password**: In Railway Variables, verify:
   ```
   BMS_EMAIL=admin@manddengineers.com
   BMS_PASSWORD=Admin@123
   ```
   These are used for login auth fallback.

---

## Railway Variables Checklist

Add these to Railway **Variables** → **Production and Preview**:

```
DATABASE_URL=[auto-provided by Railway PostgreSQL]
PORT=8000
NODE_ENV=production

JWT_SECRET=your_secure_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_secure_refresh_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

BMS_API_URL=https://app.octabms.com/api
BMS_API_KEY=a9edc6219c45098bb1506cd230e94c7f69e13b19736e1f720704febd719c3e30
BMS_API_SECRET=098e2cd1cfccfb36b9c31e3992fbe55daf3d422f48957b3d6d6ffe69b37258d94c242dff388fc42366258587bfb2d69c82d26cddf9b61f48ef5f66793b596ee3
BMS_EMAIL=admin@manddengineers.com
BMS_PASSWORD=Admin@123
```

---

## Quick Fixes

### For 500 Errors:
1. **Check Railway Logs**: Railway Dashboard → Logs → look for error messages
2. **Verify DATABASE_URL**: Should have `@postgres.railway.internal`
3. **Run Migrations**: Execute SQL schema on Railway DB
4. **Restart Backend**: In Railway, redeploy the service

### For 422 Error:
1. **Verify BMS Credentials**: Check BMS admin account
2. **Test BMS Connection**: Try logging in manually to BMS with provided email/password
3. **Check API Version**: Ensure `/v1` endpoint is correct
4. **Redeploy**: Push a new commit or manually redeploy in Railway

---

## How to Check Logs in Railway

1. Go to **Railway Dashboard**
2. Select your M&D Backend service
3. Click **"Logs"** tab
4. Search for error keywords:
   - `error`
   - `ECONNREFUSED`
   - `relation does not exist` (missing table)
   - `BMS`

---

## Next Steps

1. **Check Railway Logs** for specific error messages
2. **Verify DATABASE_URL** is set and valid
3. **Run database migrations** if needed
4. **Confirm BMS credentials** with admin
5. **Redeploy** after fixing

Once you fix these, the frontend will be able to load clients and materials! 🚀
