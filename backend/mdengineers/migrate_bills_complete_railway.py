#!/usr/bin/env python3
"""
Complete Bills Module Migration for Railway PostgreSQL
Creates ALL tables from scratch (base + enhancements)
"""

import psycopg2
from psycopg2 import sql
import sys

# Railway PostgreSQL Connection Details
DB_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'EZixMqIvXSeiyrxESSHnHEWSOikCMAhe'
}

# Complete SQL Migration - PHASE 1 (Base Tables)
PHASE_1_SQL = """
-- ============================================
-- PHASE 1: CREATE BASE BILLS TABLES
-- ============================================

-- 1. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  bms_client_id VARCHAR(100),
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_bms_client_id ON customers(bms_client_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- 2. CREATE TAX_RATES TABLE
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
  ('0% GST', 'GST', 0.00),
  ('5% GST', 'GST', 5.00),
  ('12% GST', 'GST', 12.00),
  ('18% GST', 'GST', 18.00),
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

-- 3. CREATE PARTICULARS TABLE
CREATE TABLE IF NOT EXISTS particulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  particular_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hsn_code VARCHAR(50),
  sac_code VARCHAR(50),
  unit VARCHAR(50),
  default_unit_price DECIMAL(10, 2),
  tax_applicable BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5, 2),
  bms_particular_id VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_particulars_particular_code ON particulars(particular_code);
CREATE INDEX IF NOT EXISTS idx_particulars_hsn_code ON particulars(hsn_code);
CREATE INDEX IF NOT EXISTS idx_particulars_bms_id ON particulars(bms_particular_id);
CREATE INDEX IF NOT EXISTS idx_particulars_is_active ON particulars(is_active);

-- 4. CREATE BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  bill_number VARCHAR(100) UNIQUE,
  bill_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance_amount DECIMAL(12, 2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  terms_conditions TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  currency_code VARCHAR(3) DEFAULT 'INR',
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP,
  invoice_version INT DEFAULT 1,
  bms_invoice_id VARCHAR(100),
  bms_invoice_number VARCHAR(50),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_bms_invoice_id ON bills(bms_invoice_id);
CREATE INDEX IF NOT EXISTS idx_bills_status_date ON bills(status, bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- 5. CREATE BILL_ITEMS TABLE
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  particular_id UUID REFERENCES particulars(id),
  description VARCHAR(255),
  quantity DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount DECIMAL(12, 2) NOT NULL,
  gst_rate DECIMAL(5, 2) DEFAULT 18,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(12, 2),
  item_name VARCHAR(200),
  hsn_sac_code VARCHAR(20),
  uom VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_particular_id ON bill_items(particular_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_created_at ON bill_items(created_at);

-- 6. CREATE PAYMENT_MODES TABLE
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

-- 7. CREATE PAYMENTS TABLE
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

-- 8. CREATE BILL_STATUS_HISTORY TABLE
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

-- 9. CREATE BILL_REMINDERS TABLE
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

-- 10. CREATE BILL_TEMPLATES TABLE
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

-- 11. CREATE BILL_SYNC_LOG TABLE
CREATE TABLE IF NOT EXISTS bill_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id),
  action VARCHAR(50),
  status VARCHAR(50),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMP,
  bms_response_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_sync_log_bill_id ON bill_sync_log(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_status ON bill_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_created_at ON bill_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_status_action ON bill_sync_log(status, action);
"""

def run_migration():
    """Execute the migration"""
    try:
        print("\n" + "="*70)
        print("     M&D ENGINEERS - COMPLETE BILLS MIGRATION TO RAILWAY")
        print("="*70 + "\n")
        
        # Connect to database
        print("🔌 Connecting to Railway PostgreSQL database...")
        print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"   Database: {DB_CONFIG['database']}")
        print(f"   User: {DB_CONFIG['user']}\n")
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Connection successful!\n")
        
        # Execute migration
        print("📋 Reading migration SQL...")
        print("🚀 Starting complete Bills migration...\n")
        
        # Split into individual statements for better error handling
        statements = PHASE_1_SQL.split(';')
        statements = [s.strip() for s in statements if s.strip()]
        
        successful = 0
        warnings = 0
        
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                conn.commit()
                print(f"  ✅ Statement {i}: Success")
                successful += 1
            except psycopg2.Error as e:
                conn.rollback()
                if "already exists" in str(e) or "duplicate key" in str(e):
                    print(f"  ⚠️  Statement {i}: {str(e).split(chr(10))[0][:60]}")
                    warnings += 1
                else:
                    print(f"  ❌ Statement {i}: {str(e).split(chr(10))[0][:60]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("MIGRATION COMPLETE!")
        print("="*70)
        print(f"✅ Successful: {successful}")
        print(f"⚠️  Warnings:  {warnings}")
        print("\n✨ Bills tables created successfully in Railway database!\n")
        
        # Verification queries
        print("📊 To verify the tables were created, run in Railway:")
        print("\n   SELECT table_name FROM information_schema.tables")
        print("   WHERE table_schema = 'public'")
        print("   AND table_name LIKE 'bill%' OR table_name IN ('customers', 'particulars', 'payments', 'tax_rates', 'payment_modes')")
        print("   ORDER BY table_name;\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection Error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
