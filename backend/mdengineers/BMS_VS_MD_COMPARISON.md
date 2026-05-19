# BMS vs M&D Database: Bills Tables Comparison

## 📊 Visual Comparison

### **BMS Database (Source System)**
```
┌─────────────────────────────────────────┐
│         BMS Database Structure          │
├─────────────────────────────────────────┤
│  Tenants Management                     │
│  ├─ tenants                             │
│  ├─ subscription_plans                  │
│  └─ tenant_subscriptions                │
│                                         │
│  User Management                        │
│  ├─ users                               │
│  ├─ roles                               │
│  └─ user_roles                          │
│                                         │
│  Bill Master Data                       │
│  ├─ clients                             │
│  ├─ tax_rates                           │
│  ├─ billing_particulars                 │
│  └─ payment_modes                       │
│                                         │
│  Billing Operations                     │
│  ├─ invoices                            │
│  ├─ invoice_items                       │
│  ├─ payments                            │
│  └─ invoice_status_history              │
│                                         │
│  Advanced Features                      │
│  ├─ recurring_schedules                 │
│  ├─ reminders                           │
│  ├─ reminder_configs                    │
│  └─ bill_templates (implied)            │
│                                         │
│  Integration & Logging                  │
│  ├─ api_keys                            │
│  ├─ webhooks                            │
│  ├─ webhook_logs                        │
│  └─ audit_logs                          │
└─────────────────────────────────────────┘
```

### **M&D Database (Target System)**
```
┌─────────────────────────────────────────┐
│      M&D Database Structure             │
├─────────────────────────────────────────┤
│  Existing (Non-Bill) Modules            │
│  ├─ roles                               │
│  ├─ users                               │
│  ├─ user_permissions                    │
│  ├─ chemicals_master                    │
│  ├─ stock_datewise_entry                │
│  ├─ payroll_import                      │
│  └─ [Other ERP modules...]              │
│                                         │
│  Bill Master Data (NEW)                 │
│  ├─ customers (enhanced)                │
│  ├─ tax_rates (NEW)                     │
│  ├─ particulars (enhanced)              │
│  └─ payment_modes (NEW)                 │
│                                         │
│  Billing Operations (NEW)               │
│  ├─ bills (enhanced)                    │
│  ├─ bill_items (enhanced)               │
│  ├─ payments (NEW)                      │
│  └─ bill_status_history (NEW)           │
│                                         │
│  Bills Integration & Logging (NEW)      │
│  ├─ bill_sync_log                       │
│  ├─ bill_reminders (NEW)                │
│  └─ bill_templates (NEW)                │
└─────────────────────────────────────────┘
```

---

## 📈 Data Structure Mapping

### **BMS → M&D Field Mapping**

#### **1. CLIENTS → CUSTOMERS**
```
BMS clients                M&D customers
├─ client_id              → id (UUID, generate new)
├─ tenant_id              → (skip, single-tenant)
├─ client_code            → customer_code
├─ client_name            → name
├─ contact_person         → contact_person
├─ email                  → email
├─ phone                  → phone
├─ billing_address        → billing_address
├─ shipping_address       → shipping_address
├─ gstin                  → gst_number
├─ pan                    → pan_number
├─ payment_terms_days     → payment_terms_days
├─ credit_limit           → credit_limit
├─ is_active              → is_active
├─ created_by             → created_by
├─ created_at             → created_at
└─ updated_at             → updated_at
```

#### **2. INVOICES → BILLS**
```
BMS invoices             M&D bills
├─ invoice_id           → id (UUID, generate new)
├─ tenant_id            → (skip)
├─ client_id            → customer_id
├─ invoice_number       → bill_number
├─ invoice_date         → bill_date
├─ due_date             → due_date
├─ subtotal             → subtotal
├─ tax_amount           → tax_amount
├─ discount_amount      → discount_amount
├─ total_amount         → total_amount
├─ paid_amount          → paid_amount
├─ balance_amount       → balance_amount
├─ status               → status
├─ notes                → notes
├─ terms_conditions     → terms_conditions
├─ created_by           → created_by
├─ created_at           → created_at
└─ updated_at           → updated_at
```

#### **3. INVOICE_ITEMS → BILL_ITEMS**
```
BMS invoice_items       M&D bill_items
├─ invoice_item_id      → id (UUID, generate new)
├─ invoice_id           → bill_id
├─ particular_id        → particular_id
├─ description          → description
├─ quantity             → quantity
├─ unit_price           → unit_price / rate
├─ tax_rate_id          → (calculate tax_rate)
├─ tax_amount           → gst_amount
├─ discount_percentage  → discount_percentage
├─ discount_amount      → discount_amount
├─ line_total           → line_total
└─ created_at           → created_at
```

#### **4. BILLING_PARTICULARS → PARTICULARS**
```
BMS billing_particulars  M&D particulars
├─ particular_id        → id (UUID, generate new)
├─ tenant_id            → (skip)
├─ particular_code      → particular_code
├─ particular_name      → name
├─ description          → description
├─ hsn_sac_code         → hsn_code / sac_code
├─ default_unit_price   → default_unit_price
├─ uom                  → unit
├─ tax_rate_id          → (reference tax_rates)
├─ is_active            → is_active
├─ created_by           → created_by
├─ created_at           → created_at
└─ updated_at           → updated_at
```

#### **5. TAX_RATES → TAX_RATES** (New in M&D)
```
BMS tax_rates           M&D tax_rates
├─ tax_rate_id          → id (UUID, generate new)
├─ tenant_id            → (skip)
├─ tax_name             → tax_name
├─ tax_type             → tax_type
├─ tax_percentage       → tax_percentage
├─ is_active            → is_active
├─ created_at           → created_at
└─ updated_at           → updated_at
```

#### **6. PAYMENT_MODES → PAYMENT_MODES** (Already in BMS, needs M&D)
```
BMS payment_modes       M&D payment_modes
├─ payment_mode_id      → id (UUID)
├─ mode_name            → mode_name
├─ mode_code            → mode_code
├─ is_active            → is_active
└─ created_at           → created_at
```

#### **7. PAYMENTS → PAYMENTS** (Already in BMS, needs M&D)
```
BMS payments            M&D payments
├─ payment_id           → id (UUID, generate new)
├─ tenant_id            → (skip)
├─ invoice_id           → bill_id
├─ payment_mode_id      → payment_mode_id
├─ payment_date         → payment_date
├─ amount               → amount
├─ reference_number     → reference_number
├─ bank_name            → bank_name
├─ notes                → notes
├─ created_by           → created_by
├─ created_at           → created_at
└─ updated_at           → updated_at
```

#### **8. INVOICE_STATUS_HISTORY → BILL_STATUS_HISTORY**
```
BMS invoice_status_history  M&D bill_status_history
├─ history_id               → id (UUID)
├─ invoice_id               → bill_id
├─ old_status               → old_status
├─ new_status               → new_status
├─ changed_by               → changed_by
├─ changed_at               → changed_at
└─ notes                    → notes
```

---

## 📋 Table Creation Order (Dependency Chain)

When creating tables, follow this order to avoid foreign key issues:

```
1. tax_rates           (no dependencies)
2. payment_modes       (no dependencies)
3. customers           (no dependencies)
4. particulars         (references: tax_rates)
5. bills               (references: customers)
6. bill_items          (references: bills, particulars)
7. payments            (references: bills, payment_modes)
8. bill_status_history (references: bills, users)
9. bill_reminders      (references: bills)
10. bill_templates     (no dependencies)
11. bill_sync_log      (references: bills)
```

---

## 🔄 Data Sync Flow

```
┌─────────────────┐
│  BMS Database   │
│  (Source)       │
└────────┬────────┘
         │
         │ Extract
         ▼
┌─────────────────┐
│  Tax Rates      │ ◄─── No tenant filtering needed
│  Payment Modes  │
└────────┬────────┘
         │
         │ Transform & Insert
         ▼
┌─────────────────────────────────────┐
│  M&D Database                       │
├─────────────────────────────────────┤
│ Master Data (tax_rates, customers,  │
│  particulars, payment_modes)        │
└────────┬────────────────────────────┘
         │
         │ Link references
         ▼
┌─────────────────────────────────────┐
│  Transaction Data (bills,           │
│  bill_items, payments)              │
└─────────────────────────────────────┘
```

---

## ✅ Pre-Migration Checklist

Before running migrations:

- [ ] M&D database is running and accessible
- [ ] BMS database is running (if syncing data)
- [ ] PostgreSQL user has permission to create tables
- [ ] Backup existing M&D database
- [ ] No active connections to M&D database
- [ ] All required environment variables configured

---

## 🚀 Quick Reference: What's New vs What's Enhanced

### **NEW Tables (Don't Exist in M&D Yet)**
```
✨ payment_modes        - Payment method types
✨ payments             - Payment records
✨ bill_status_history  - Audit trail for status changes
✨ tax_rates            - GST/Tax configuration
✨ bill_reminders       - Automatic payment reminders
✨ bill_templates       - Invoice/bill templates
```

### **ENHANCED Tables (Already Exist, Need Updates)**
```
📝 bills            - Add columns for bill_number, dates, amounts, terms
📝 bill_items       - Add columns for GST, discounts, HSN/SAC codes
📝 customers        - Add columns for codes, contact, payment terms, credit limit
📝 particulars      - Add columns for codes, pricing, BMS links
📝 bill_sync_log    - Add columns for sync tracking, retry logic
```

---

## 📊 Complete Statistics After Migration

| Category | Count | Tables |
|----------|-------|--------|
| **New Tables** | 6 | payment_modes, payments, bill_status_history, tax_rates, bill_reminders, bill_templates |
| **Enhanced Tables** | 5 | bills, bill_items, customers, particulars, bill_sync_log |
| **Total Bill-Related** | 11 | - |
| **Existing M&D Tables** | ~10 | roles, users, chemicals_master, stock_datewise_entry, etc. |
| **Grand Total M&D** | 21+ | - |

---

## 🔗 Related Documentation

- **BMS Source Schema:** `/Users/devanshu/Desktop/bms/bms/bms_queries.sql`
- **M&D Current Schema:** `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/schema.sql`
- **Bills Migration Script:** `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/bills_migration.sql`
- **Complete Add-on Script:** `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/add_bills_tables_complete.sql`
- **Detailed SQL Guide:** `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/SQL_QUERIES_FOR_BILLS_TABLES.md`
- **BMS-to-MD Mapping:** `/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/BMS_TO_MD_MAPPING_GUIDE.md`

---

## 📞 Quick Help

**Q: Where's the ready-to-run SQL?**
A: `sql/add_bills_tables_complete.sql` - copy and paste all at once

**Q: How do I apply just one table?**
A: See `SQL_QUERIES_FOR_BILLS_TABLES.md` for individual table creation

**Q: How do I sync data from BMS?**
A: See `BMS_TO_MD_MAPPING_GUIDE.md` for sync queries and scripts

**Q: Which tables are must-have vs optional?**
A: Must-have: bills, bill_items, customers, particulars, payments
Optional (but recommended): bill_reminders, bill_templates, bill_status_history
