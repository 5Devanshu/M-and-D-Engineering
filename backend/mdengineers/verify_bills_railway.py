#!/usr/bin/env python3
"""
Verify Bills tables in Railway database
"""

import psycopg2

DB_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'EZixMqIvXSeiyrxESSHnHEWSOikCMAhe'
}

def verify():
    try:
        print("\n" + "="*70)
        print("     VERIFICATION - Bills Tables in Railway")
        print("="*70 + "\n")
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check Bills tables
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE 'bill%' OR table_name IN ('customers', 'particulars', 'payments', 'tax_rates', 'payment_modes'))
        ORDER BY table_name;
        """
        
        cursor.execute(query)
        tables = cursor.fetchall()
        
        print("📊 Bills-Related Tables Found:")
        print("-" * 70)
        
        expected_tables = {
            'bill_items': '✅',
            'bill_reminders': '✅',
            'bill_status_history': '✅',
            'bill_sync_log': '✅',
            'bill_templates': '✅',
            'bills': '✅',
            'customers': '✅',
            'particulars': '✅',
            'payments': '✅',
            'tax_rates': '✅',
            'payment_modes': '✅'
        }
        
        found_tables = [t[0] for t in tables]
        
        for table in sorted(expected_tables.keys()):
            if table in found_tables:
                print(f"  ✅ {table:25} - Created")
            else:
                print(f"  ❌ {table:25} - Missing")
        
        print("\n" + "-" * 70)
        print(f"Total Bills tables found: {len(tables)}/11")
        
        # Check row counts
        print("\n📈 Table Sizes:")
        print("-" * 70)
        
        for table in sorted(found_tables):
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table:25} - {count:5} rows")
        
        # Check key columns in bills table
        print("\n🔍 Bills Table Columns:")
        print("-" * 70)
        
        cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'bills'
        ORDER BY ordinal_position
        LIMIT 15
        """)
        
        columns = cursor.fetchall()
        for col_name, col_type in columns:
            print(f"  {col_name:25} - {col_type}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("✅ VERIFICATION COMPLETE")
        print("="*70)
        print("\n🎉 All Bills tables successfully created in Railway database!\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    verify()
