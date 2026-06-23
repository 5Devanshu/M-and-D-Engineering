-- ===================================================================
-- M&D Engineering - CLIENTS & MATERIALS TABLES
-- Run this directly in Railway PostgreSQL Console
-- ===================================================================

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

-- Verify tables were created
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
UNION ALL
SELECT 'materials_master' as table_name, COUNT(*) as row_count FROM materials_master;

-- List all tables
\dt
