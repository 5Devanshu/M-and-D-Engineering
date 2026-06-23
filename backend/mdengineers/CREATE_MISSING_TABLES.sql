-- ============================================================================
-- M&D Engineering ERP - Create Missing Tables
-- Run this SQL directly in Railway PostgreSQL Console
-- ============================================================================

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
  name                  VARCHAR(255) NOT NULL,
  unit                  VARCHAR(20) NOT NULL,
  default_rate          DECIMAL(10,2) DEFAULT 0.00,
  hsn_code              VARCHAR(20) DEFAULT '9988',
  gst_rate              DECIMAL(5,2) DEFAULT 18.00,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_name ON materials_master(name);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials_master(is_active);

-- Verify tables were created
\dt clients
\dt materials_master
