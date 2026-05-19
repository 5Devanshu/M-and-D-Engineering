# SQL Queries to Add Bills Tables to M&D Database

## Overview
This document provides all the SQL queries you need to add to your M&D Engineers database to support the Bills module with BMS integration.

**Current Status:**
- ✅ Bills migration file exists: `sql/bills_migration.sql`
- ✅ Has Bills tables (bills, bill_items, customers, particulars)
- ❌ Missing: Additional BMS-related tables and enhancements

---

## 📋 Tables to Add/Update

### 1. **BILLS TABLE** (Core Bills Management)
Already exists but needs enhancement for BMS sync.

**Current State:** ✅ Exists in `bills_migration.sql`

**Enhancement Needed:**
```sql
-- Add missing columns to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bill_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS invoice_version INT DEFAULT 1;

-- Create unique constraint for bill_number
ALTER TABLE bills ADD CONSTRAINT bills_bill_number_unique UNIQUE (bill_number);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status_date ON bills(status, bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
```

---

### 2. **BILL_ITEMS TABLE** (Line Items)
Already exists but needs enhancement.

**Current State:** ✅ Exists in `bills_migration.sql`

**Enhancement Needed:**
```sql
-- Add missing columns to bill_items
ALTER TABLE bill_items
ADD COLUMN IF NOT EXISTS description VARCHAR(255),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 18,
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_total DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
ADD COLUMN IF NOT EXISTS item_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_items_particular_id ON bill_items(particular_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_created_at ON bill_items(created_at);
```

---

### 3. **CUSTOMERS TABLE** (Clients/Customers)
Already exists but needs enhancement.

**Current State:** ✅ Exists in `bills_migration.sql`

**Enhancement Needed:**
```sql
-- Add missing columns to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS bms_client_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_bms_client_id ON customers(bms_client_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
```

---

### 4. **PARTICULARS TABLE** (Products/Services)
Already exists but needs enhancement.

**Current State:** ✅ Exists in `bills_migration.sql`

**Enhancement Needed:**
```sql
-- Add missing columns to particulars
ALTER TABLE particulars
ADD COLUMN IF NOT EXISTS particular_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS default_unit_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS bms_particular_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_particulars_particular_code ON particulars(particular_code);
CREATE INDEX IF NOT EXISTS idx_particulars_hsn_code ON particulars(hsn_code);
CREATE INDEX IF NOT EXISTS idx_particulars_bms_id ON particulars(bms_particular_id);
CREATE INDEX IF NOT EXISTS idx_particulars_is_active ON particulars(is_active);
```

---

### 5. **PAYMENT MODES TABLE** (NEW - Payment Methods)
Needed for tracking different payment methods.

```sql
-- Create payment modes table
CREATE TABLE IF NOT EXISTS payment_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name VARCHAR(50) NOT NULL,
  mode_code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_payment_modes_code ON payment_modes(mode_code);

-- Insert default payment modes
INSERT INTO payment_modes (mode_name, mode_code) VALUES
  ('Cash', 'CASH'),
  ('Bank Transfer', 'BANK_TRANSFER'),
  ('UPI', 'UPI'),
  ('Cheque', 'CHEQUE'),
  ('Credit Card', 'CREDIT_CARD'),
  ('Debit Card', 'DEBIT_CARD')
ON CONFLICT (mode_code) DO NOTHING;
```

---

### 6. **PAYMENTS TABLE** (NEW - Payment Recording)
Needed to track all payments against bills.

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_mode_id UUID NOT NULL REFERENCES payment_modes(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  notes TEXT,
  is_voided BOOLEAN DEFAULT FALSE,
  void_reason VARCHAR(500),
  voided_by UUID,
  voided_at TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bms_payment_id VARCHAR(100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
```

---

### 7. **BILL_STATUS_HISTORY TABLE** (NEW - Audit Trail)
Track all status changes to bills.

```sql
-- Create bill status history table
CREATE TABLE IF NOT EXISTS bill_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_bill_status_history_bill_id ON bill_status_history(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_status_history_changed_at ON bill_status_history(changed_at);
```

---

### 8. **TAX_RATES TABLE** (NEW - GST/Tax Configuration)
Centralized tax rate management.

```sql
-- Create tax rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name VARCHAR(50) NOT NULL,
  tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('GST', 'VAT', 'SERVICE_TAX', 'IGST', 'CGST', 'SGST')),
  tax_percentage DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tax_type, tax_percentage)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_tax_rates_tax_type ON tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_is_active ON tax_rates(is_active);

-- Insert default GST rates (India)
INSERT INTO tax_rates (tax_name, tax_type, tax_percentage) VALUES
  ('18% GST', 'GST', 18.00),
  ('12% GST', 'GST', 12.00),
  ('5% GST', 'GST', 5.00),
  ('0% GST', 'GST', 0.00),
  ('28% GST', 'GST', 28.00),
  ('5% IGST', 'IGST', 5.00),
  ('12% IGST', 'IGST', 12.00),
  ('18% IGST', 'IGST', 18.00),
  ('28% IGST', 'IGST', 28.00),
  ('2.5% CGST', 'CGST', 2.50),
  ('6% CGST', 'CGST', 6.00),
  ('9% CGST', 'CGST', 9.00),
  ('14% CGST', 'CGST', 14.00),
  ('2.5% SGST', 'SGST', 2.50),
  ('6% SGST', 'SGST', 6.00),
  ('9% SGST', 'SGST', 9.00),
  ('14% SGST', 'SGST', 14.00)
ON CONFLICT (tax_type, tax_percentage) DO NOTHING;
```

---

### 9. **BILL_SYNC_LOG TABLE** (Enhancement)
Already exists but needs more columns.

**Current State:** ✅ Exists in `bills_migration.sql`

**Enhancement Needed:**
```sql
-- Add missing columns to bill_sync_log
ALTER TABLE bill_sync_log
ADD COLUMN IF NOT EXISTS sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS bms_response_code VARCHAR(50);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_created_at ON bill_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_status_action ON bill_sync_log(status, action);
```

---

### 10. **REMINDERS TABLE** (NEW - Payment Reminders)
For automatic payment reminder functionality.

```sql
-- Create reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('PRE_DUE', 'DUE_DATE', 'OVERDUE', 'MANUAL')),
  reminder_date TIMESTAMP NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SENT', 'FAILED', 'SCHEDULED')),
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bill_reminders_bill_id ON bill_reminders(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_reminder_date ON bill_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_status ON bill_reminders(status);
```

---

### 11. **BILL_TEMPLATES TABLE** (NEW - Invoice Templates)
For custom invoice formatting.

```sql
-- Create bill templates table
CREATE TABLE IF NOT EXISTS bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL UNIQUE,
  html_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_bill_templates_is_default ON bill_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_bill_templates_is_active ON bill_templates(is_active);
```

---

## 📊 Complete Migration Script

To add all tables at once, save this as `sql/add_bills_tables_complete.sql`:

```sql
-- ============================================
-- BILLS MODULE - COMPLETE MIGRATION
-- ============================================

-- 1. Update bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bill_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS invoice_version INT DEFAULT 1;

ALTER TABLE bills ADD CONSTRAINT bills_bill_number_unique UNIQUE (bill_number);

CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status_date ON bills(status, bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- 2. Update bill_items table
ALTER TABLE bill_items
ADD COLUMN IF NOT EXISTS description VARCHAR(255),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 18,
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_total DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
ADD COLUMN IF NOT EXISTS item_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_bill_items_particular_id ON bill_items(particular_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_created_at ON bill_items(created_at);

-- 3. Update customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS bms_client_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_bms_client_id ON customers(bms_client_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- 4. Update particulars table
ALTER TABLE particulars
ADD COLUMN IF NOT EXISTS particular_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS default_unit_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS bms_particular_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

CREATE INDEX IF NOT EXISTS idx_particulars_particular_code ON particulars(particular_code);
CREATE INDEX IF NOT EXISTS idx_particulars_hsn_code ON particulars(hsn_code);
CREATE INDEX IF NOT EXISTS idx_particulars_bms_id ON particulars(bms_particular_id);
CREATE INDEX IF NOT EXISTS idx_particulars_is_active ON particulars(is_active);

-- 5. Create payment_modes table
CREATE TABLE IF NOT EXISTS payment_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name VARCHAR(50) NOT NULL,
  mode_code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_modes_code ON payment_modes(mode_code);

INSERT INTO payment_modes (mode_name, mode_code) VALUES
  ('Cash', 'CASH'),
  ('Bank Transfer', 'BANK_TRANSFER'),
  ('UPI', 'UPI'),
  ('Cheque', 'CHEQUE'),
  ('Credit Card', 'CREDIT_CARD'),
  ('Debit Card', 'DEBIT_CARD')
ON CONFLICT (mode_code) DO NOTHING;

-- 6. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_mode_id UUID NOT NULL REFERENCES payment_modes(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  notes TEXT,
  is_voided BOOLEAN DEFAULT FALSE,
  void_reason VARCHAR(500),
  voided_by UUID,
  voided_at TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bms_payment_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 7. Create bill_status_history table
CREATE TABLE IF NOT EXISTS bill_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bill_status_history_bill_id ON bill_status_history(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_status_history_changed_at ON bill_status_history(changed_at);

-- 8. Create tax_rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name VARCHAR(50) NOT NULL,
  tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('GST', 'VAT', 'SERVICE_TAX', 'IGST', 'CGST', 'SGST')),
  tax_percentage DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tax_type, tax_percentage)
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_tax_type ON tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_is_active ON tax_rates(is_active);

INSERT INTO tax_rates (tax_name, tax_type, tax_percentage) VALUES
  ('18% GST', 'GST', 18.00),
  ('12% GST', 'GST', 12.00),
  ('5% GST', 'GST', 5.00),
  ('0% GST', 'GST', 0.00),
  ('28% GST', 'GST', 28.00),
  ('5% IGST', 'IGST', 5.00),
  ('12% IGST', 'IGST', 12.00),
  ('18% IGST', 'IGST', 18.00),
  ('28% IGST', 'IGST', 28.00),
  ('2.5% CGST', 'CGST', 2.50),
  ('6% CGST', 'CGST', 6.00),
  ('9% CGST', 'CGST', 9.00),
  ('14% CGST', 'CGST', 14.00),
  ('2.5% SGST', 'SGST', 2.50),
  ('6% SGST', 'SGST', 6.00),
  ('9% SGST', 'SGST', 9.00),
  ('14% SGST', 'SGST', 14.00)
ON CONFLICT (tax_type, tax_percentage) DO NOTHING;

-- 9. Update bill_sync_log table
ALTER TABLE bill_sync_log
ADD COLUMN IF NOT EXISTS sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS bms_response_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_bill_sync_log_created_at ON bill_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_status_action ON bill_sync_log(status, action);

-- 10. Create bill_reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('PRE_DUE', 'DUE_DATE', 'OVERDUE', 'MANUAL')),
  reminder_date TIMESTAMP NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SENT', 'FAILED', 'SCHEDULED')),
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_reminders_bill_id ON bill_reminders(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_reminder_date ON bill_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_status ON bill_reminders(status);

-- 11. Create bill_templates table
CREATE TABLE IF NOT EXISTS bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL UNIQUE,
  html_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_templates_is_default ON bill_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_bill_templates_is_active ON bill_templates(is_active);

-- ============================================
-- END OF MIGRATION
-- ============================================
```

---

## 🚀 How to Apply These Queries

### **Option 1: Run Individually**
Run each section separately in your PostgreSQL client (psql, pgAdmin, etc.)

### **Option 2: Create Migration File**
Save complete script as `sql/add_bills_tables_complete.sql` and run:

```bash
psql -U postgres -d mdengineers < sql/add_bills_tables_complete.sql
```

### **Option 3: Run via Node.js Script**
Create `scripts/add-bills-migration.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mdengineers',
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('sql/add_bills_tables_complete.sql', 'utf-8');
    await pool.query(sql);
    console.log('✅ Bills migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

Run with: `node scripts/add-bills-migration.js`

---

## ✅ Verification

After running migrations, verify with:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'bills', 'bill_items', 'customers', 'particulars', 
  'payment_modes', 'payments', 'bill_status_history', 
  'tax_rates', 'bill_sync_log', 'bill_reminders', 'bill_templates'
);

-- Should return 11 rows if all tables are created
```

Check bill table columns:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position;
```

---

## 📝 Summary

| Table | Purpose | Status |
|-------|---------|--------|
| bills | Core bill records | ✅ Exists, needs enhancement |
| bill_items | Line items in bills | ✅ Exists, needs enhancement |
| customers | Customer/client data | ✅ Exists, needs enhancement |
| particulars | Products/services | ✅ Exists, needs enhancement |
| payment_modes | Payment method types | ❌ NEW - Add |
| payments | Payment records | ❌ NEW - Add |
| bill_status_history | Audit trail | ❌ NEW - Add |
| tax_rates | GST/Tax configuration | ❌ NEW - Add |
| bill_sync_log | BMS sync tracking | ✅ Exists, needs enhancement |
| bill_reminders | Payment reminders | ❌ NEW - Add |
| bill_templates | Invoice templates | ❌ NEW - Add |

**Total Tables to Add:** 11 (4 enhancements + 7 new)

---

## 🔗 Related BMS Tables

From BMS system (`/Users/devanshu/Desktop/bms/bms/bms_queries.sql`), you may also want:

- **invoices** → Maps to your `bills` table
- **invoice_items** → Maps to your `bill_items` table
- **clients** → Maps to your `customers` table
- **billing_particulars** → Maps to your `particulars` table
- **payment_modes** → Sync with M&D `payment_modes`
- **payments** → Sync with M&D `payments`
- **invoice_status_history** → Maps to `bill_status_history`
- **tax_rates** → Sync with M&D `tax_rates`

---

## 📞 Questions?

Refer to:
- BMS Schema: `/Users/devanshu/Desktop/bms/bms/bms_queries.sql`
- M&D Schema: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/schema.sql`
- Bills Migration: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/bills_migration.sql`
