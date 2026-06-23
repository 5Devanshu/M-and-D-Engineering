# M&D Engineering Backend - Critical Fixes Required

## Issue Analysis from Logs

### ✅ Good News:
- Database connection working: `✅ PostgreSQL connected`
- Backend running on Railway on port 8080
- DATABASE_URL loaded correctly

### ❌ Critical Issues:

1. **Missing Database Tables**
   - `relation "clients" does not exist` 
   - `relation "materials_master" does not exist`

2. **BMS Environment Variables NOT SET in Railway**
   ```
   🔐 BMS: authenticating as undefined…
   ```
   This means `BMS_EMAIL` and `BMS_PASSWORD` are missing from Railway Variables.

---

## IMMEDIATE FIXES REQUIRED

### Fix 1: Add Missing Environment Variables to Railway

**Go to Railway Dashboard → Your M&D Backend Project → Variables**

Add these variables (if not already present):

```
BMS_API_URL=https://app.octabms.com/api
BMS_API_KEY=a9edc6219c45098bb1506cd230e94c7f69e13b19736e1f720704febd719c3e30
BMS_API_SECRET=098e2cd1cfccfb36b9c31e3992fbe55daf3d422f48957b3d6d6ffe69b37258d94c242dff388fc42366258587bfb2d69c82d26cddf9b61f48ef5f66793b596ee3
BMS_EMAIL=admin@manddengineers.com
BMS_PASSWORD=Admin@123
```

**Then click "Deploy" to restart the service.**

---

### Fix 2: Create Missing Database Tables

You need to run database migrations on Railway PostgreSQL.

**Option A: Using Railway UI (Recommended)**
1. Go to Railway Dashboard → Your M&D Backend
2. Click "PostgreSQL" plugin
3. Click "Connect" tab
4. Use the psql command or web console

**Option B: Using Command Line (if you have psql installed)**
```bash
PGPASSWORD='EZixMqIvXSeiyrxESSHnHEWSOikCMAhe' \
psql -h postgres.railway.internal \
     -U postgres \
     -d railway \
     -f path/to/schema.sql
```

**Option C: Use Migration Script**
```bash
cd /path/to/M\ and\ D\ Engineering/backend/mdengineers
npm run migrate
```

---

## Required Database Tables Schema

Create these tables in your Railway PostgreSQL:

```sql
-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_code VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  billing_address TEXT,
  shipping_address TEXT,
  gstin VARCHAR(15),
  pan VARCHAR(10),
  state VARCHAR(100),
  state_code VARCHAR(2),
  payment_terms_days INT DEFAULT 30,
  credit_limit DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Materials Master table
CREATE TABLE IF NOT EXISTS materials_master (
  id SERIAL PRIMARY KEY,
  material_name VARCHAR(255) NOT NULL,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  hsn_code VARCHAR(10),
  description TEXT,
  uom VARCHAR(10),
  rate DECIMAL(15,4),
  is_active BOOLEAN DEFAULT true,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_materials_code ON materials_master(material_code);
```

---

## Step-by-Step Fix Process

### Step 1: Update Railway Variables
1. Go to Railway Dashboard
2. Select M&D Backend service
3. Click "Variables"
4. Add the BMS credentials listed above
5. Click "Deploy"
6. Wait 2-3 minutes for restart

### Step 2: Create Database Tables
1. Access Railway PostgreSQL
2. Run the SQL schema above
3. Verify tables were created:
   ```sql
   \dt clients
   \dt materials_master
   ```

### Step 3: Verify the Fix
1. Wait for backend to restart
2. Check logs for: `🔐 BMS: authenticating as admin@manddengineers.com…`
3. Try the API call again:
   ```bash
   curl "https://m-and-d-engineering-production.up.railway.app/api/clients?limit=200&is_active=true"
   ```

---

## Expected Results After Fix

When working correctly, you should see in logs:
```
✅ PostgreSQL connected
🔐 BMS: authenticating as admin@manddengineers.com…
✅ BMS: token acquired, expires 2026-06-24T13:21:15.000Z
GET /api/clients?limit=200&is_active=true 200
GET /api/masters/materials 200
GET /api/bms/templates?limit=1 200
```

---

## Troubleshooting

If you still get errors after these fixes:

1. **Still see "undefined" for BMS email?**
   - Make sure you clicked "Deploy" after adding variables
   - Check that variables are in "Production" environment (not just Preview)

2. **Still get relation does not exist?**
   - Verify table creation with `SELECT * FROM information_schema.tables;`
   - Make sure you ran SQL on the correct database (railway)

3. **Still getting 422 from BMS?**
   - Verify BMS email/password are correct in your BMS account
   - Check if BMS credentials have changed

---

## Quick Command Reference

```bash
# Check environment variables are loaded (run this on the backend)
node -e "console.log({
  BMS_EMAIL: process.env.BMS_EMAIL,
  BMS_API_URL: process.env.BMS_API_URL,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
})"

# Test database connection
psql -U postgres -h postgres.railway.internal -d railway -c "SELECT version();"

# List all tables
psql -U postgres -h postgres.railway.internal -d railway -c "\dt"
```

---

**Let me know once you've made these changes and I can help verify everything is working!**
