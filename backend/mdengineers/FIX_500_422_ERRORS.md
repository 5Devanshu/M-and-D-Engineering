# 🚀 M&D Engineering Backend - Complete Fix Guide

## What You Need to Do

Based on the error logs, there are **2 critical issues** preventing your API from working:

### Issue 1: Missing Database Tables ❌
```
relation "clients" does not exist
relation "materials_master" does not exist
```

### Issue 2: BMS Environment Variables Not Set ❌
```
🔐 BMS: authenticating as undefined…
```

---

## ✅ Step-by-Step Solution

### STEP 1: Update Railway Environment Variables

1. **Go to Railway Dashboard**
2. **Select M&D Engineering Backend project**
3. **Click "Variables" in sidebar**
4. **Add these environment variables** (or update if they exist):

```
BMS_API_URL=https://app.octabms.com/api
BMS_API_KEY=a9edc6219c45098bb1506cd230e94c7f69e13b19736e1f720704febd719c3e30
BMS_API_SECRET=098e2cd1cfccfb36b9c31e3992fbe55daf3d422f48957b3d6d6ffe69b37258d94c242dff388fc42366258587bfb2d69c82d26cddf9b61f48ef5f66793b596ee3
BMS_EMAIL=admin@manddengineers.com
BMS_PASSWORD=Admin@123
```

5. **Click "Deploy"** button - wait 2-3 minutes

---

### STEP 2: Create Missing Database Tables

#### Option A: Using Railway Web Console (EASIEST)

1. **Go to Railway Dashboard**
2. **Select M&D Backend project → PostgreSQL plugin**
3. **Click "Connect" tab**
4. **Copy-paste this SQL into the console:**

```sql
-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id                    SERIAL PRIMARY KEY,
  client_code           VARCHAR(50) NOT NULL UNIQUE,
  client_name           VARCHAR(255) NOT NULL,
  contact_person        VARCHAR(255),
  email                 VARCHAR(255) UNIQUE,
  phone                 VARCHAR(20),
  billing_address       TEXT,
  shipping_address      TEXT,
  gstin                 VARCHAR(15),
  pan                   VARCHAR(10),
  state                 VARCHAR(100),
  state_code            VARCHAR(2),
  payment_terms_days    INT DEFAULT 30,
  credit_limit          DECIMAL(15,2),
  is_active             BOOLEAN DEFAULT TRUE,
  created_by            INT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  deleted_at            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- MATERIALS MASTER TABLE
CREATE TABLE IF NOT EXISTS materials_master (
  id                    SERIAL PRIMARY KEY,
  material_name         VARCHAR(255) NOT NULL,
  material_code         VARCHAR(50) NOT NULL UNIQUE,
  hsn_code              VARCHAR(10),
  description           TEXT,
  uom                   VARCHAR(10),
  rate                  DECIMAL(15,4),
  is_active             BOOLEAN DEFAULT TRUE,
  created_by            INT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  deleted_at            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_code ON materials_master(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials_master(is_active);
```

5. **Execute the SQL**
6. **Verify tables created:**
```sql
\dt clients
\dt materials_master
```

---

#### Option B: Using Command Line (if psql installed)

```bash
# Navigate to the backend directory
cd "/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers"

# Run the updated schema
psql "$DATABASE_URL" -f sql/schema.sql
```

Or use the provided script:
```bash
bash setup-db.sh
```

---

### STEP 3: Verify the Fixes

After completing Steps 1 and 2, the logs should show:

✅ **Good Logs:**
```
✅ PostgreSQL connected
🔐 BMS: authenticating as admin@manddengineers.com…
✅ BMS: token acquired, expires 2026-06-24T13:21:15.000Z
GET /api/clients?limit=200&is_active=true 200
GET /api/masters/materials 200
GET /api/bms/templates?limit=1 200
```

❌ **Bad Logs (indicates problem not fixed):**
```
🔐 BMS: authenticating as undefined…
relation "clients" does not exist
```

---

## ✅ Testing the Fix

Once you've completed both steps, test with these curl commands:

```bash
# Test 1: Get clients (should return 200)
curl "https://m-and-d-engineering-production.up.railway.app/api/clients?limit=200&is_active=true"

# Test 2: Get materials (should return 200)
curl "https://m-and-d-engineering-production.up.railway.app/api/masters/materials"

# Test 3: Get BMS templates (should return 200)
curl "https://m-and-d-engineering-production.up.railway.app/api/bms/templates?limit=1"
```

---

## 🆘 Troubleshooting

### Still seeing "undefined" for BMS_EMAIL?
- ✅ Make sure you clicked "Deploy" after adding variables
- ✅ Wait 2-3 minutes for restart
- ✅ Check variables are in "Production and Preview" environments
- ✅ Refresh Railway dashboard and check logs again

### Still getting "relation does not exist"?
- ✅ Verify tables were created: `\dt` in Railway psql
- ✅ Make sure you ran SQL on correct database (should be 'railway')
- ✅ Check for SQL errors in console output

### BMS still returns 422?
- ✅ Verify BMS_EMAIL and BMS_PASSWORD are correct
- ✅ Check if BMS account is still active
- ✅ Verify BMS_API_URL is correct: `https://app.octabms.com/api`

---

## 📋 Checklist

- [ ] Added BMS environment variables to Railway
- [ ] Clicked "Deploy" in Railway
- [ ] Waited 2-3 minutes for restart
- [ ] Created `clients` table in Railway PostgreSQL
- [ ] Created `materials_master` table in Railway PostgreSQL
- [ ] Verified tables with `\dt` command
- [ ] Checked logs show `authenticating as admin@manddengineers.com`
- [ ] Tested API endpoints and got 200 responses

---

## 📝 Quick Reference

| Component | Status |
|-----------|--------|
| PostgreSQL Connection | ✅ Working |
| Database (railway) | ✅ Connected |
| Clients table | ❌ MISSING (fix step 2) |
| Materials table | ❌ MISSING (fix step 2) |
| BMS Email/Password | ❌ NOT SET (fix step 1) |
| BMS API URL | ✅ Configured |

---

**Once you complete these 2 steps, everything should work! 🎉**

Feel free to ask if you need help with any step.
