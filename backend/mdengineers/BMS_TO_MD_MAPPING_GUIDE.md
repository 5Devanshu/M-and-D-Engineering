# BMS to M&D Database Mapping & Integration Guide

## Overview
This document maps BMS (Billing Management System) database tables to M&D Engineers ERP tables, showing which queries to use and how to integrate them.

---

## 📊 Table Mapping Reference

### **Core Billing Tables**

| BMS Table | M&D Table | Purpose | Status |
|-----------|-----------|---------|--------|
| `invoices` | `bills` | Main invoice/bill records | ✅ Mapped |
| `invoice_items` | `bill_items` | Line items in bills | ✅ Mapped |
| `clients` | `customers` | Customer/client data | ✅ Mapped |
| `billing_particulars` | `particulars` | Products/services offered | ✅ Mapped |

### **Supporting Tables**

| BMS Table | M&D Table | Purpose | Status |
|-----------|-----------|---------|--------|
| `payment_modes` | `payment_modes` | Payment method types | ✅ Mapped |
| `payments` | `payments` | Payment records | ✅ Mapped |
| `invoice_status_history` | `bill_status_history` | Status change audit trail | ✅ Mapped |
| `tax_rates` | `tax_rates` | GST/Tax configuration | ✅ Mapped |

### **Sync & Logging Tables**

| BMS Table | M&D Table | Purpose | Status |
|-----------|-----------|---------|--------|
| (no direct mapping) | `bill_sync_log` | Track BMS sync operations | ✅ M&D only |
| `reminders` | `bill_reminders` | Payment reminders | ✅ Mapped |
| (no direct mapping) | `bill_templates` | Invoice templates | ✅ M&D only |

---

## 🔄 Field Mapping Details

### **BILLS ↔ INVOICES**

#### BMS `invoices` table columns:
```sql
- invoice_id → bills.id
- tenant_id → (not applicable in M&D, use creator's context)
- client_id → bills.customer_id
- recurring_schedule_id → (optional in M&D)
- invoice_number → bills.bill_number
- invoice_type → (M&D doesn't distinguish, all are ONE_TIME)
- invoice_date → bills.bill_date
- due_date → bills.due_date
- subtotal → bills.subtotal
- tax_amount → bills.tax_amount
- discount_amount → bills.discount_amount
- total_amount → bills.total_amount
- paid_amount → bills.paid_amount
- balance_amount → bills.balance_amount
- status → bills.status
- notes → bills.notes
- terms_conditions → bills.terms_conditions
- created_by → bills.created_by
- created_at → bills.created_at
- updated_at → bills.updated_at
```

#### How to sync BMS invoice to M&D bill:
```sql
-- Insert BMS invoice into M&D bills
INSERT INTO bills (
  customer_id,
  bms_invoice_id,
  bms_invoice_number,
  bill_number,
  bill_date,
  due_date,
  subtotal,
  tax_amount,
  discount_amount,
  total_amount,
  paid_amount,
  balance_amount,
  status,
  notes,
  terms_conditions,
  description,
  created_by,
  created_at
) 
SELECT
  (SELECT id FROM customers WHERE bms_client_id = i.client_id::text LIMIT 1),
  i.invoice_id::text,
  i.invoice_number,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.subtotal,
  i.tax_amount,
  i.discount_amount,
  i.total_amount,
  i.paid_amount,
  i.balance_amount,
  LOWER(i.status),
  i.notes,
  i.terms_conditions,
  i.notes,
  (SELECT id::uuid FROM users WHERE email = 'admin@mdengineers.com' LIMIT 1),
  i.created_at
FROM invoices i
WHERE NOT EXISTS (
  SELECT 1 FROM bills WHERE bms_invoice_id = i.invoice_id::text
);
```

---

### **INVOICE_ITEMS ↔ BILL_ITEMS**

#### BMS `invoice_items` columns:
```sql
- invoice_item_id → bill_items.id
- invoice_id → bill_items.bill_id
- particular_id → bill_items.particular_id
- description → bill_items.description
- quantity → bill_items.quantity
- unit_price → bill_items.unit_price
- tax_rate_id → (use tax_percentage)
- tax_amount → bill_items.gst_amount
- discount_percentage → bill_items.discount_percentage
- discount_amount → bill_items.discount_amount
- line_total → bill_items.line_total
- created_at → bill_items.created_at
```

#### How to sync BMS invoice items to M&D bill items:
```sql
-- Insert BMS invoice items into M&D bill items
INSERT INTO bill_items (
  bill_id,
  particular_id,
  description,
  quantity,
  rate,
  unit_price,
  gst_rate,
  gst_amount,
  discount_percentage,
  discount_amount,
  line_total,
  item_name,
  created_at
)
SELECT
  (SELECT id FROM bills WHERE bms_invoice_id = ii.invoice_id::text LIMIT 1),
  (SELECT id FROM particulars WHERE bms_particular_id = ii.particular_id::text LIMIT 1),
  ii.description,
  ii.quantity,
  ii.unit_price,
  ii.unit_price,
  (SELECT tax_percentage FROM tax_rates WHERE tax_rate_id = ii.tax_rate_id LIMIT 1),
  ii.tax_amount,
  ii.discount_percentage,
  ii.discount_amount,
  ii.line_total,
  ii.description,
  ii.created_at
FROM invoice_items ii
WHERE NOT EXISTS (
  SELECT 1 FROM bill_items 
  WHERE bill_id = (SELECT id FROM bills WHERE bms_invoice_id = ii.invoice_id::text LIMIT 1)
);
```

---

### **CLIENTS ↔ CUSTOMERS**

#### BMS `clients` columns:
```sql
- client_id → customers.id (generate UUID)
- tenant_id → (skip)
- client_code → customers.customer_code
- client_name → customers.name
- contact_person → customers.contact_person
- email → customers.email
- phone → customers.phone
- billing_address → customers.billing_address
- shipping_address → customers.shipping_address
- gstin → customers.gst_number
- pan → customers.pan_number
- payment_terms_days → customers.payment_terms_days
- credit_limit → customers.credit_limit
- is_active → customers.is_active
- created_by → customers.created_by
- created_at → customers.created_at
- updated_at → customers.updated_at
```

#### How to sync BMS clients to M&D customers:
```sql
-- Insert BMS clients into M&D customers
INSERT INTO customers (
  customer_code,
  name,
  contact_person,
  email,
  phone,
  billing_address,
  shipping_address,
  gst_number,
  pan_number,
  payment_terms_days,
  credit_limit,
  is_active,
  bms_client_id,
  created_by,
  created_at,
  updated_at
)
SELECT
  c.client_code,
  c.client_name,
  c.contact_person,
  c.email,
  c.phone,
  c.billing_address,
  c.shipping_address,
  c.gstin,
  c.pan,
  c.payment_terms_days,
  c.credit_limit,
  c.is_active,
  c.client_id::text,
  (SELECT id::uuid FROM users WHERE email = 'admin@mdengineers.com' LIMIT 1),
  c.created_at,
  c.updated_at
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE bms_client_id = c.client_id::text
);
```

---

### **BILLING_PARTICULARS ↔ PARTICULARS**

#### BMS `billing_particulars` columns:
```sql
- particular_id → particulars.id (generate UUID)
- tenant_id → (skip)
- particular_code → particulars.particular_code
- particular_name → particulars.name
- description → particulars.description
- hsn_sac_code → particulars.hsn_code / sac_code
- default_unit_price → particulars.default_unit_price
- uom → particulars.unit
- tax_rate_id → (map to tax_percentage)
- is_active → particulars.is_active
- created_by → particulars.created_by
- created_at → particulars.created_at
- updated_at → particulars.updated_at
```

#### How to sync BMS particulars to M&D particulars:
```sql
-- Insert BMS billing_particulars into M&D particulars
INSERT INTO particulars (
  particular_code,
  name,
  description,
  hsn_code,
  sac_code,
  unit,
  default_unit_price,
  tax_applicable,
  tax_rate,
  bms_particular_id,
  is_active,
  created_by,
  created_at,
  updated_at
)
SELECT
  bp.particular_code,
  bp.particular_name,
  bp.description,
  bp.hsn_sac_code,
  bp.hsn_sac_code,
  bp.uom,
  bp.default_unit_price,
  CASE WHEN bp.tax_rate_id IS NOT NULL THEN true ELSE false END,
  (SELECT tax_percentage FROM tax_rates WHERE tax_rate_id = bp.tax_rate_id LIMIT 1),
  bp.particular_id::text,
  bp.is_active,
  (SELECT id::uuid FROM users WHERE email = 'admin@mdengineers.com' LIMIT 1),
  bp.created_at,
  bp.updated_at
FROM billing_particulars bp
WHERE NOT EXISTS (
  SELECT 1 FROM particulars WHERE bms_particular_id = bp.particular_id::text
);
```

---

### **PAYMENTS**

#### BMS `payments` columns:
```sql
- payment_id → payments.id (generate UUID)
- tenant_id → (skip)
- invoice_id → payments.bill_id
- payment_mode_id → payments.payment_mode_id
- payment_date → payments.payment_date
- amount → payments.amount
- reference_number → payments.reference_number
- bank_name → payments.bank_name
- notes → payments.notes
- created_by → payments.created_by
- created_at → payments.created_at
```

#### How to sync BMS payments to M&D:
```sql
-- Insert BMS payments into M&D payments
INSERT INTO payments (
  bill_id,
  payment_mode_id,
  payment_date,
  amount,
  reference_number,
  bank_name,
  notes,
  bms_payment_id,
  created_by,
  created_at,
  updated_at
)
SELECT
  (SELECT id FROM bills WHERE bms_invoice_id = p.invoice_id::text LIMIT 1),
  (SELECT id FROM payment_modes WHERE mode_code = 'BANK_TRANSFER' LIMIT 1),
  p.payment_date,
  p.amount,
  p.reference_number,
  p.bank_name,
  p.notes,
  p.payment_id::text,
  (SELECT id::uuid FROM users WHERE email = 'admin@mdengineers.com' LIMIT 1),
  p.created_at,
  p.created_at
FROM payments p
WHERE NOT EXISTS (
  SELECT 1 FROM payments WHERE bms_payment_id = p.payment_id::text
);
```

---

### **TAX_RATES**

#### BMS `tax_rates` columns:
```sql
- tax_rate_id → tax_rates.id
- tenant_id → (skip)
- tax_name → tax_rates.tax_name
- tax_type → tax_rates.tax_type
- tax_percentage → tax_rates.tax_percentage
- is_active → tax_rates.is_active
- created_at → tax_rates.created_at
```

#### How to sync BMS tax rates to M&D:
```sql
-- Insert BMS tax rates into M&D
INSERT INTO tax_rates (
  tax_name,
  tax_type,
  tax_percentage,
  is_active,
  created_at
)
SELECT
  tr.tax_name,
  tr.tax_type,
  tr.tax_percentage,
  tr.is_active,
  tr.created_at
FROM tax_rates tr
WHERE NOT EXISTS (
  SELECT 1 FROM tax_rates 
  WHERE tax_type = tr.tax_type 
  AND tax_percentage = tr.tax_percentage
);
```

---

### **INVOICE_STATUS_HISTORY ↔ BILL_STATUS_HISTORY**

#### How to sync BMS status history to M&D:
```sql
-- Insert BMS invoice status history into M&D
INSERT INTO bill_status_history (
  bill_id,
  old_status,
  new_status,
  changed_by,
  changed_at,
  notes
)
SELECT
  (SELECT id FROM bills WHERE bms_invoice_id = ish.invoice_id::text LIMIT 1),
  ish.old_status,
  ish.new_status,
  (SELECT id::uuid FROM users WHERE email = 'admin@mdengineers.com' LIMIT 1),
  ish.changed_at,
  ish.notes
FROM invoice_status_history ish
WHERE NOT EXISTS (
  SELECT 1 FROM bill_status_history 
  WHERE bill_id = (SELECT id FROM bills WHERE bms_invoice_id = ish.invoice_id::text LIMIT 1)
);
```

---

## 🔧 Complete Sync Script

Create `scripts/sync-bms-to-md.js` to automate syncing:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const bmsPool = new Pool({
  user: process.env.BMS_DB_USER || 'postgres',
  password: process.env.BMS_DB_PASSWORD,
  host: process.env.BMS_DB_HOST || 'localhost',
  port: process.env.BMS_DB_PORT || 5432,
  database: process.env.BMS_DB_NAME || 'bms',
});

const mdPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mdengineers',
});

async function syncTables() {
  try {
    console.log('🔄 Starting BMS to M&D sync...');

    // 1. Sync tax rates
    console.log('📊 Syncing tax rates...');
    await mdPool.query(`
      INSERT INTO tax_rates (tax_name, tax_type, tax_percentage, is_active)
      SELECT tax_name, tax_type, tax_percentage, is_active
      FROM tax_rates@bms
      WHERE NOT EXISTS (
        SELECT 1 FROM tax_rates 
        WHERE tax_type = tax_rates.tax_type 
        AND tax_percentage = tax_rates.tax_percentage
      )
    `);

    // 2. Sync customers
    console.log('👥 Syncing customers...');
    // (Use query from above)

    // 3. Sync particulars
    console.log('📦 Syncing particulars...');
    // (Use query from above)

    // 4. Sync bills
    console.log('📄 Syncing bills...');
    // (Use query from above)

    // 5. Sync bill items
    console.log('📝 Syncing bill items...');
    // (Use query from above)

    // 6. Sync payments
    console.log('💰 Syncing payments...');
    // (Use query from above)

    console.log('✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await bmsPool.end();
    await mdPool.end();
  }
}

syncTables();
```

---

## 📋 Quick Reference: Status Values

### Bill Status mapping:
```
BMS → M&D
DRAFT → draft
SENT → sent
PARTIAL → partial (if payment received but not full)
PAID → paid
OVERDUE → draft/sent (determine based on due_date vs current_date)
CANCELLED → cancelled
```

---

## 🚀 Implementation Steps

1. **Run base migrations**
   ```bash
   psql -U postgres -d mdengineers < sql/bills_migration.sql
   psql -U postgres -d mdengineers < sql/add_bills_tables_complete.sql
   ```

2. **Run sync queries** (in order)
   - Tax rates → Payment modes → Customers → Particulars → Bills → Bill items → Payments

3. **Verify data integrity**
   ```sql
   SELECT COUNT(*) as bill_count FROM bills;
   SELECT COUNT(*) as item_count FROM bill_items;
   SELECT COUNT(*) as payment_count FROM payments;
   ```

4. **Test the Bills UI**
   - Follow BILLS_FRONTEND_TESTING_GUIDE.md

---

## 📞 Troubleshooting

**Issue: Foreign key constraint errors**
- Solution: Ensure parent records exist (customers before bills, etc.)
- Order: tax_rates → payment_modes → customers → particulars → bills → bill_items → payments

**Issue: UUID conversion errors**
- Solution: Use `::text` to convert numeric IDs to text, use `gen_random_uuid()` for new UUIDs

**Issue: Status values don't match**
- Solution: Use LOWER() to normalize status strings to lowercase

---

## 📚 Related Files

- BMS Schema: `/Users/devanshu/Desktop/bms/bms/bms_queries.sql`
- M&D Schema: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/schema.sql`
- Bills Migration: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/bills_migration.sql`
- Complete Migration: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/add_bills_tables_complete.sql`
- SQL Queries Guide: `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/SQL_QUERIES_FOR_BILLS_TABLES.md`
