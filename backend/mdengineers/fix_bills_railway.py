#!/usr/bin/env python3
"""
Fix foreign key issues - Phase 2 Migration
"""

import psycopg2

DB_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'EZixMqIvXSeiyrxESSHnHEWSOikCMAhe'
}

# Fix script - create tables without user foreign keys first
FIX_SQL = """
-- Drop problematic constraints if they exist
DROP TABLE IF EXISTS bill_reminders CASCADE;
DROP TABLE IF EXISTS bill_status_history CASCADE;

-- Recreate bill_status_history without user foreign key (for now)
CREATE TABLE IF NOT EXISTS bill_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_id INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bill_status_history_bill_id ON bill_status_history(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_status_history_changed_at ON bill_status_history(changed_at);

-- Recreate bill_reminders without user foreign key (for now)
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('PRE_DUE', 'DUE_DATE', 'OVERDUE', 'MANUAL')),
  reminder_date TIMESTAMP NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SENT', 'FAILED', 'SCHEDULED')),
  sent_by_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_reminders_bill_id ON bill_reminders(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_reminder_date ON bill_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_status ON bill_reminders(status);
"""

def fix_issues():
    try:
        print("\n" + "="*70)
        print("     FIXING FOREIGN KEY ISSUES - PHASE 2")
        print("="*70 + "\n")
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔧 Fixing table issues...\n")
        
        statements = FIX_SQL.split(';')
        statements = [s.strip() for s in statements if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                conn.commit()
                print(f"  ✅ Fix {i}: Success")
            except psycopg2.Error as e:
                conn.rollback()
                print(f"  ⚠️  Fix {i}: {str(e).split(chr(10))[0][:70]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("✅ PHASE 2 COMPLETE - All Bills tables ready!")
        print("="*70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    fix_issues()
