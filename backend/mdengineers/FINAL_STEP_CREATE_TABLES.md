# 🎯 FINAL STEP - Create Missing Tables in Railway

## ✅ Good News!
Your BMS integration is **NOW WORKING**! 🎉

Logs show:
```
✅ BMS: token acquired, expires 2026-06-24T13:26:57.000Z
GET /api/bms/templates?limit=1 200 ✅
GET /api/bms/invoices?page=1&limit=15 200 ✅
```

## ❌ Remaining Issue
Only **2 database tables** are missing:
- `clients` table
- `materials_master` table

---

## 🚀 QUICK FIX (5 minutes)

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Select **M&D Engineering Backend** project
3. Click the **PostgreSQL** plugin
4. Click **"Connect"** tab

### Step 2: Copy and Run This SQL

Copy this entire SQL block:

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

Then paste into the **Railway PostgreSQL console** and **Execute**.

### Step 3: Verify

Run this to confirm tables were created:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

You should see:
- `clients` ✅
- `materials_master` ✅

---

## ✅ After Running This SQL

Your logs will show:
```
GET /api/clients?limit=200&is_active=true 200 ✅
GET /api/masters/materials 200 ✅
GET /api/bms/templates?limit=1 200 ✅
GET /api/bms/invoices 200 ✅
```

---

## 📋 Summary

| Status | Item |
|--------|------|
| ✅ | BMS Configuration |
| ✅ | Database Connection |
| ✅ | BMS Authentication |
| ❌ | `clients` table - **NEEDS TO BE CREATED** |
| ❌ | `materials_master` table - **NEEDS TO BE CREATED** |

**After you run the SQL above, everything will work!** 🚀

---

## 🆘 Alternative: Using psql Command

If you have `psql` installed locally:

```bash
# Set your DATABASE_URL
export DATABASE_URL='postgresql://postgres:EZixMqIvXSeiyrxESSHnHEWSOikCMAhe@postgres.railway.internal:5432/railway'

# Run the SQL file
psql "$DATABASE_URL" -f CREATE_MISSING_TABLES.sql
```

---

**That's it! Just run the SQL and you're done! 🎉**
