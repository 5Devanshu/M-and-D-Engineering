# M&D Database - Bills Tables Summary

## Quick Answer: What Queries Do You Need to Add?

Looking at `/Users/devanshu/Desktop/bms/bms/bms_queries.sql`, here are the queries you need to add to your M&D database:

---

## ✅ Already Exist (from `sql/bills_migration.sql`):
1. ✅ `bills` - Main bill records
2. ✅ `bill_items` - Line items in bills
3. ✅ `customers` - Customer data
4. ✅ `particulars` - Products/services
5. ✅ `bill_sync_log` - Sync tracking

---

## ❌ Need to Add (from BMS queries):

### **1. PAYMENT_MODES Table**
Used for payment method types (Cash, Bank Transfer, UPI, etc.)
```sql
CREATE TABLE payment_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name VARCHAR(50) NOT NULL,
  mode_code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_modes (mode_name, mode_code) VALUES
  ('Cash', 'CASH'),
  ('Bank Transfer', 'BANK_TRANSFER'),
  ('UPI', 'UPI'),
  ('Cheque', 'CHEQUE'),
  ('Credit Card', 'CREDIT_CARD'),
  ('Debit Card', 'DEBIT_CARD');
```

### **2. PAYMENTS Table**
Tracks all payments received against bills.
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id),
  payment_mode_id UUID NOT NULL REFERENCES payment_modes(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. BILL_STATUS_HISTORY Table**
Audit trail of all status changes.
```sql
CREATE TABLE bill_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```

### **4. TAX_RATES Table**
Centralized GST/Tax configuration.
```sql
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name VARCHAR(50) NOT NULL,
  tax_type VARCHAR(20) NOT NULL,
  tax_percentage DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tax_type, tax_percentage)
);

INSERT INTO tax_rates (tax_name, tax_type, tax_percentage) VALUES
  ('18% GST', 'GST', 18.00),
  ('12% GST', 'GST', 12.00),
  ('5% GST', 'GST', 5.00),
  ('0% GST', 'GST', 0.00),
  ('28% GST', 'GST', 28.00);
```

### **5. BILL_REMINDERS Table**
Automatic payment reminders.
```sql
CREATE TABLE bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id),
  reminder_type VARCHAR(20) NOT NULL,
  reminder_date TIMESTAMP NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **6. BILL_TEMPLATES Table**
Custom invoice templates.
```sql
CREATE TABLE bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL UNIQUE,
  html_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **7-10. Enhance Existing Tables**

#### Add columns to `bills` table:
```sql
ALTER TABLE bills ADD COLUMN bill_number VARCHAR(100) UNIQUE;
ALTER TABLE bills ADD COLUMN bill_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE bills ADD COLUMN subtotal DECIMAL(12, 2);
ALTER TABLE bills ADD COLUMN tax_amount DECIMAL(12, 2);
ALTER TABLE bills ADD COLUMN discount_amount DECIMAL(12, 2);
ALTER TABLE bills ADD COLUMN paid_amount DECIMAL(12, 2);
ALTER TABLE bills ADD COLUMN balance_amount DECIMAL(12, 2);
ALTER TABLE bills ADD COLUMN terms_conditions TEXT;
```

#### Add columns to `bill_items` table:
```sql
ALTER TABLE bill_items ADD COLUMN gst_rate DECIMAL(5, 2) DEFAULT 18;
ALTER TABLE bill_items ADD COLUMN gst_amount DECIMAL(10, 2);
ALTER TABLE bill_items ADD COLUMN discount_percentage DECIMAL(5, 2);
ALTER TABLE bill_items ADD COLUMN discount_amount DECIMAL(10, 2);
ALTER TABLE bill_items ADD COLUMN unit_price DECIMAL(10, 2);
ALTER TABLE bill_items ADD COLUMN hsn_sac_code VARCHAR(20);
ALTER TABLE bill_items ADD COLUMN uom VARCHAR(20);
```

#### Add columns to `customers` table:
```sql
ALTER TABLE customers ADD COLUMN customer_code VARCHAR(50) UNIQUE;
ALTER TABLE customers ADD COLUMN contact_person VARCHAR(200);
ALTER TABLE customers ADD COLUMN payment_terms_days INT DEFAULT 30;
ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(12, 2);
```

#### Add columns to `particulars` table:
```sql
ALTER TABLE particulars ADD COLUMN particular_code VARCHAR(50) UNIQUE;
ALTER TABLE particulars ADD COLUMN default_unit_price DECIMAL(10, 2);
ALTER TABLE particulars ADD COLUMN tax_applicable BOOLEAN DEFAULT FALSE;
```

---

## 🚀 How to Apply (Choose One)

### **Option 1: Quick Script (Recommended)**
```bash
psql -U postgres -d mdengineers < sql/add_bills_tables_complete.sql
```

### **Option 2: Copy-Paste Individual Queries**
Copy each CREATE TABLE / ALTER TABLE query above and run in pgAdmin or psql

### **Option 3: Run via Node.js**
```bash
node scripts/add-bills-migration.js
```

---

## 📊 Complete Table List After Migration

You'll have these tables:

**Core Bills:**
- ✅ `bills` - Enhanced
- ✅ `bill_items` - Enhanced
- ✅ `customers` - Enhanced
- ✅ `particulars` - Enhanced

**Supporting:**
- ✅ `payment_modes` - NEW
- ✅ `payments` - NEW
- ✅ `bill_status_history` - NEW
- ✅ `tax_rates` - NEW

**Logging:**
- ✅ `bill_sync_log` - Already exists
- ✅ `bill_reminders` - NEW
- ✅ `bill_templates` - NEW

---

## 📁 Documentation Files Created

1. **SQL_QUERIES_FOR_BILLS_TABLES.md** - Detailed breakdown of each table
2. **BMS_TO_MD_MAPPING_GUIDE.md** - How to map BMS data to M&D tables
3. **add_bills_tables_complete.sql** - Ready-to-run SQL script
4. **This file** - Quick reference

---

## ✨ Next Steps

1. **Apply the migrations** - Run `sql/add_bills_tables_complete.sql`
2. **Verify the setup** - Check tables exist with `\dt` in psql
3. **Start the backend** - Ensure PostgreSQL is running
4. **Test the frontend** - Follow BILLS_FRONTEND_TESTING_GUIDE.md

---

## 📞 Need Help?

- **Schema details?** → See `SQL_QUERIES_FOR_BILLS_TABLES.md`
- **Field mappings?** → See `BMS_TO_MD_MAPPING_GUIDE.md`
- **Ready-to-run SQL?** → Use `add_bills_tables_complete.sql`
- **Sync from BMS?** → Use queries in `BMS_TO_MD_MAPPING_GUIDE.md`
