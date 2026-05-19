# Railway PostgreSQL Migration Guide - Bills Module

## Database Connection Details
- **Host:** postgresql://postgres:EZixMqIvXSeiyrxESSHnHEWSOikCMAhe@tramway.proxy.rlwy.net:17521/railway
- **User:** postgres
- **Password:** r9r3n1i7xg5eud53y5vp5pb4l74q059b
- **Database:** railway

---

## ⚡ Option 1: Using psql Command Line (Fastest)

### Step 1: Install PostgreSQL Client
```bash
# On macOS
brew install postgresql@15
```

### Step 2: Run Migration Script
```bash
psql postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway < /Users/devanshu/Desktop/M\ and\ D\ Engineering/backend/mdengineers/sql/add_bills_tables_complete.sql
```

**Expected Output:**
```
ALTER TABLE
CREATE INDEX
CREATE CONSTRAINT
CREATE TABLE
INSERT ...
```

---

## ⚡ Option 2: Using DBeaver (GUI - Recommended for Verification)

### Step 1: Download DBeaver
- Download: https://dbeaver.io/download/
- Install and open

### Step 2: Create Connection
1. Click **File → New Database Connection**
2. Select **PostgreSQL** and click **Next**
3. Fill in details:
   - **Server Host:** tramway.proxy.rlwy.net
   - **Port:** 17521
   - **Database:** railway
   - **Username:** postgres
   - **Password:** r9r3n1i7xg5eud53y5vp5pb4l74q059b
4. Click **Test Connection** → Should show "Connected"
5. Click **Finish**

### Step 3: Run Migration
1. Right-click on the connection → **SQL Editor → Open SQL script**
2. Copy and paste the entire SQL from `add_bills_tables_complete.sql`
3. Click **Execute** or press **Ctrl+Enter**
4. Check **Execution Results** - should show all operations succeeded

---

## ⚡ Option 3: Using pgAdmin (Web Interface)

### Step 1: Access pgAdmin
1. Go to Railway Dashboard: https://railway.app
2. Find your PostgreSQL service
3. Click on the service and look for **pgAdmin** link (if available)
4. Or use local pgAdmin: https://www.pgadmin.org/download/

### Step 2: Connect & Execute
1. Right-click on your database → **Query Tool**
2. Paste the SQL script
3. Click **Execute** button
4. Verify results in the **Messages** tab

---

## ✅ Verification Script (Run After Migration)

Create a file: `verify_migration.sql`

```sql
-- Verify all tables exist and have correct columns
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check bills table columns
\d bills

-- Check bill_items table columns
\d bill_items

-- Check payments table
\d payments

-- Check payment_modes table
\d payment_modes

-- Check tax_rates table
\d tax_rates

-- Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('bills', 'bill_items', 'customers', 'particulars')
ORDER BY tablename, indexname;

-- Verify payment modes inserted
SELECT * FROM payment_modes;

-- Verify tax rates inserted
SELECT * FROM tax_rates ORDER BY tax_type, tax_percentage;

-- Count all tables
SELECT count(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';
```

Run verification:
```bash
psql postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway < verify_migration.sql
```

---

## 🔍 What Gets Migrated

### Tables Created/Updated:
1. ✅ **bills** - Updated with billing columns
2. ✅ **bill_items** - Updated with item details
3. ✅ **customers** - Updated with billing info
4. ✅ **particulars** - Updated with product codes
5. ✅ **payment_modes** - New table (Cash, Bank Transfer, UPI, etc.)
6. ✅ **payments** - New table for payment tracking
7. ✅ **bill_status_history** - New table for audit trail
8. ✅ **tax_rates** - New table with GST rates
9. ✅ **bill_sync_log** - Updated with sync tracking
10. ✅ **bill_reminders** - New table for payment reminders
11. ✅ **bill_templates** - New table for invoice templates

### Total Indexes Created: 22
### Total Constraints: 8
### Initial Data Inserted: 23 rows (payment modes + tax rates)

---

## 🛠️ Troubleshooting

### Issue: Connection Refused
```
Error: could not connect to server: Connection refused
```
**Solution:**
- Railway database might be down
- Check Railway dashboard status
- Wait 30 seconds and retry
- Verify credentials are correct

### Issue: Table Already Exists
```
ERROR: table "bills" already exists
```
**Solution:** This is normal if running migration twice. The script uses `IF NOT EXISTS` so it won't error. Just continue.

### Issue: Permission Denied
```
ERROR: permission denied for schema public
```
**Solution:**
- Use correct user credentials
- User must have superuser or schema permissions
- Contact your database admin

### Issue: Cannot Drop Column
```
ERROR: cannot drop column because other objects depend on it
```
**Solution:**
- These errors should not occur with `ADD COLUMN IF NOT EXISTS`
- If they do, manually drop dependent objects first

---

## 📊 Post-Migration Steps

### 1. Update Backend .env
```bash
DATABASE_URL=postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway
```

### 2. Restart Backend
```bash
cd /Users/devanshu/Desktop/M\ and\ D\ Engineering/backend/mdengineers
npm start
```

### 3. Verify Backend Connection
- Check server logs for: `Connected to Railway PostgreSQL`
- No connection errors should appear

### 4. Test Bills API
```bash
curl -X GET http://localhost:8080/api/bills \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Migration Commands Summary

### **Fastest Way (Copy & Paste)**

```bash
# 1. Copy this exact command and run in terminal:
psql postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway -f /Users/devanshu/Desktop/M\ and\ D\ Engineering/backend/mdengineers/sql/add_bills_tables_complete.sql

# 2. Verify migration worked:
psql postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

---

## ✨ Expected Success Indicators

After migration, you should see:

✅ No error messages in output
✅ All 11 tables exist in database
✅ 22 indexes created
✅ 23 rows inserted (6 payment modes + 17 tax rates)
✅ Backend connects successfully
✅ Bills API endpoints work

---

## 📝 Log File Location

If using script file, pipe output to log:
```bash
psql postgresql://postgres:r9r3n1i7xg5eud53y5vp5pb4l74q059b@tramway.proxy.rlwy.net:17521/railway < add_bills_tables_complete.sql > migration_log.txt 2>&1

# View the log
cat migration_log.txt
```

---

## 🔄 Rollback (If Needed)

To rollback the migration, create and run `rollback_bills_migration.sql`:

```sql
-- WARNING: This will delete all bills data
DROP TABLE IF EXISTS bill_reminders CASCADE;
DROP TABLE IF EXISTS bill_templates CASCADE;
DROP TABLE IF EXISTS bill_status_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_modes CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;

-- Remove columns added to existing tables
ALTER TABLE bills DROP COLUMN IF EXISTS bill_number;
ALTER TABLE bills DROP COLUMN IF EXISTS bill_date;
-- ... (continue for all added columns)

-- Remove indexes
DROP INDEX IF EXISTS idx_bills_bill_number;
DROP INDEX IF EXISTS idx_bills_status_date;
-- ... (continue for all indexes)
```

⚠️ **WARNING:** This will DELETE all bills data. Only use if necessary!

---

## ✅ Next Steps After Migration

1. ✅ Verify all tables created successfully
2. ✅ Update backend `.env` with Railway database URL
3. ✅ Restart backend server
4. ✅ Test Bills API endpoints
5. ✅ Test Bills frontend module
6. ✅ Follow `BILLS_FRONTEND_TESTING_GUIDE.md` to test UI

---

## 📞 Need Help?

- **Check Migration Status:** Query `information_schema.tables`
- **Check Specific Table:** `\d table_name` in psql
- **Check Indexes:** `\di` in psql
- **Check Data:** `SELECT * FROM payment_modes;`
- **View Logs:** Check Railway dashboard for database logs

