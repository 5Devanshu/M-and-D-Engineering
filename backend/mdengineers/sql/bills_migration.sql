/**
 * SQL Migration: Create Bills Tables
 * This creates tables for storing bills and syncing with BMS
 * Run this migration in your M&D database
 */

-- Create customers table (if not exists)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create particulars table (items/products that can be billed)
CREATE TABLE IF NOT EXISTS particulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hsn_code VARCHAR(50),
  sac_code VARCHAR(50),
  unit VARCHAR(50),
  tax_applicable BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5, 2),
  bms_particular_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  bms_invoice_id VARCHAR(100),
  bms_invoice_number VARCHAR(50),
  total_amount DECIMAL(12, 2),
  description TEXT,
  notes TEXT,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, synced, sent, paid, cancelled
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create bill_items table (line items in a bill)
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  particular_id UUID NOT NULL REFERENCES particulars(id),
  quantity DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_bms_invoice_id ON bills(bms_invoice_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- Create bill_sync_log table to track BMS sync attempts
CREATE TABLE IF NOT EXISTS bill_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id),
  action VARCHAR(50), -- create, update, delete
  status VARCHAR(50), -- success, failed
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_sync_log_bill_id ON bill_sync_log(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_sync_log_status ON bill_sync_log(status);
