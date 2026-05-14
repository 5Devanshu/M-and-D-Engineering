-- Materials Master Table
CREATE TABLE IF NOT EXISTS materials_master (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('kgs', 'nos', 'ltrs', 'mtrs', 'pcs')),
  default_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hsn_code VARCHAR(8),
  gst_rate DECIMAL(5, 2) DEFAULT 18,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for materials_master
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials_master(name);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials_master(is_active);

-- Material Rate History Table
CREATE TABLE IF NOT EXISTS material_rate_history (
  id SERIAL PRIMARY KEY,
  material_id INT NOT NULL REFERENCES materials_master(id) ON DELETE CASCADE,
  old_rate DECIMAL(12, 2) NOT NULL,
  new_rate DECIMAL(12, 2) NOT NULL,
  effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255),
  changed_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for material_rate_history
CREATE INDEX IF NOT EXISTS idx_material_rate_history_material_id ON material_rate_history(material_id);
CREATE INDEX IF NOT EXISTS idx_material_rate_history_effective_from ON material_rate_history(effective_from);

-- Sample Materials Data
INSERT INTO materials_master (name, unit, default_rate, hsn_code, gst_rate) VALUES
('Steel Bars', 'kgs', 45.00, '7214', 5),
('Cement', 'kgs', 7.50, '2523', 5),
('Sand', 'nos', 500.00, '2505', 5),
('Bricks', 'nos', 8.00, '6904', 12),
('Wood', 'mtrs', 300.00, '4407', 5),
('Nails', 'kgs', 80.00, '7317', 5),
('Glass Sheets', 'pcs', 150.00, '7007', 12),
('Paint', 'ltrs', 350.00, '3208', 18),
('Plywood', 'pcs', 2500.00, '4412', 12),
('Copper Wire', 'kgs', 550.00, '7408', 5)
ON CONFLICT (name) DO NOTHING;
