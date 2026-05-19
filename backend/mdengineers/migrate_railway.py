#!/usr/bin/env python3
"""
Railway PostgreSQL Migration Script
Migrates Bills Module tables to Railway database
"""

import psycopg2
import sys
from pathlib import Path

# Railway Connection Details
RAILWAY_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'r9r3n1i7xg5eud53y5vp5pb4l74q059b'
}

def migrate_bills_tables():
    """Execute the bills migration on Railway database"""
    
    try:
        print("🔄 Connecting to Railway PostgreSQL...")
        conn = psycopg2.connect(**RAILWAY_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Connected successfully!\n")
        
        # Read migration SQL file
        sql_file = Path('/Users/devanshu/Desktop/M and D Engineering/backend/mdengineers/sql/add_bills_tables_complete.sql')
        if not sql_file.exists():
            print(f"❌ SQL file not found: {sql_file}")
            return False
            
        with open(sql_file, 'r') as f:
            migration_sql = f.read()
        
        print(f"📄 Executing migration from: {sql_file}")
        print(f"📊 SQL Size: {len(migration_sql)} characters\n")
        
        # Execute the migration
        cursor.execute(migration_sql)
        print("✅ Migration executed successfully!\n")
        
        # Verify migration
        print("🔍 Verifying migration...\n")
        
        # Check tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        print(f"📋 Tables created: {len(tables)}")
        for table in tables:
            print(f"   ✓ {table[0]}")
        print()
        
        # Check indexes
        cursor.execute("""
            SELECT COUNT(*) FROM pg_indexes 
            WHERE schemaname = 'public'
        """)
        index_count = cursor.fetchone()[0]
        print(f"🔑 Indexes created: {index_count}\n")
        
        # Check payment modes
        cursor.execute("SELECT COUNT(*) FROM payment_modes")
        payment_modes = cursor.fetchone()[0]
        print(f"💳 Payment modes inserted: {payment_modes}")
        
        # Check tax rates
        cursor.execute("SELECT COUNT(*) FROM tax_rates")
        tax_rates = cursor.fetchone()[0]
        print(f"📊 Tax rates inserted: {tax_rates}\n")
        
        print("=" * 60)
        print("✨ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📝 Next Steps:")
        print("1. Update backend .env with Railway DATABASE_URL")
        print("2. Restart backend server")
        print("3. Verify connection in server logs")
        print("4. Test Bills API endpoints")
        print("5. Test Bills frontend module")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   - Verify Railway database is running")
        print("   - Check credentials are correct")
        print("   - Verify network/firewall allows connection")
        return False
        
    except psycopg2.Error as e:
        print(f"❌ Database Error: {e}")
        print(f"   Error Code: {e.pgcode}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == '__main__':
    success = migrate_bills_tables()
    sys.exit(0 if success else 1)
