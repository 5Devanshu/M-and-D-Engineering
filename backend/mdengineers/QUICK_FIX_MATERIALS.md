# 🔧 Quick Fix for Materials Master Table

## Problem
The `materials_master` table has the wrong column names. The code expects:
- `name` (not `material_name`)
- `unit` (not `uom`)
- `default_rate` (not `rate`)
- `hsn_code`, `gst_rate`

But the table created has different names.

## Solution (2 minutes)

### Step 1: Go to Railway PostgreSQL Console
1. Open Railway Dashboard
2. Select **M&D Backend** project
3. Click **PostgreSQL** plugin
4. Click **"Connect"** tab

### Step 2: Copy and Paste This SQL

```sql
DROP TABLE IF EXISTS materials_master CASCADE;

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

INSERT INTO materials_master (name, unit, default_rate, hsn_code, gst_rate) VALUES
  ('BK 67 A',           'ltr',  237.07,  '9988', 18.00),
  ('BK 67 B',           'ltr',  2333.34, '9988', 18.00),
  ('BL-15',             'kgs',  252.20,  '9988', 18.00),
  ('752',               'ltr',  0.00,    '9988', 18.00),
  ('862',               'ltr',  0.00,    '9988', 18.00),
  ('3000',              'ltr',  290.00,  '9988', 18.00),
  ('375-A',             'ltr',  277.12,  '9988', 18.00),
  ('375-C',             'ltr',  306.49,  '9988', 18.00),
  ('BR.1265',           'ltr',  185.00,  '9988', 18.00),
  ('846-B',             'kgs',  90.22,   '9988', 18.00),
  ('1085-M',            'ltr',  178.00,  '9988', 18.00),
  ('1085-R',            'ltr',  190.00,  '9988', 18.00),
  ('846-A',             'ltr',  109.00,  '9988', 18.00),
  ('DURA-601',          'kgs',  160.00,  '9988', 18.00),
  ('CYANIDE',           'kgs',  255.00,  '9988', 18.00),
  ('CK-1',              'kgs',  0.00,    '9988', 18.00),
  ('ZINK OXIDE',        'kgs',  295.00,  '9988', 18.00),
  ('LADI',              'Nos',  343.00,  '9988', 18.00),
  ('Costic',            'kgs',  52.00,   '9988', 18.00),
  ('HCL',               'kgs',  3.50,    '9988', 18.00),
  ('Nitric',            'kgs',  32.00,   '9988', 18.00),
  ('Hydrogen Peroxide', 'kgs',  0.00,    '9988', 18.00),
  ('Sulfuric Acid',     'kgs',  0.00,    '9988', 18.00),
  ('Urfolin EL 80',     'kgs',  0.00,    '9988', 18.00),
  ('Sulphide',          'kgs',  90.00,   '9988', 18.00),
  ('AZ-2085-R',         'kgs',  0.00,    '9988', 18.00);
```

### Step 3: Execute and Done ✅

Your logs will now show:
```
GET /api/masters/materials 200 ✅
```

---

## What Changed?
- ✅ Dropped old `materials_master` with wrong column names
- ✅ Created new table with correct column names matching the code
- ✅ Added 26 sample chemicals from your original schema
- ✅ Added proper indexes for performance

That's it! 🎉
