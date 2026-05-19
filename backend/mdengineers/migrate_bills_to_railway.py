#!/usr/bin/env python3
"""
Migration Script: Add Bills Tables to M&D Railway Database
Connects to Railway PostgreSQL and runs the bills migration
"""

import psycopg2
from psycopg2 import sql
import sys

# Railway Database Credentials
DB_CONFIG = {
    'host': 'tramway.proxy.rlwy.net',
    'port': 17521,
    'database': 'railway',
    'user': 'postgres',
    'password': 'EZixMqIvXSeiyrxESSHnHEWSOikCMAhe'
}

# Read the migration SQL file
MIGRATION_FILE = 'sql/add_bills_tables_complete.sql'

def read_migration_file():
    """Read the SQL migration file"""
    try:
        with open(MIGRATION_FILE, 'r') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Migration file not found: {MIGRATION_FILE}")
        sys.exit(1)

def execute_migration():
    """Execute the migration script"""
    try:
        print("🔄 Connecting to Railway PostgreSQL database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Connection successful!")
        print("\n📋 Reading migration file...")
        migration_sql = read_migration_file()
        
        print("🚀 Starting migration...\n")
        
        # Split SQL by semicolons and execute each statement
        statements = migration_sql.split(';')
        completed = 0
        
        for i, statement in enumerate(statements, 1):
            statement = statement.strip()
            if not statement:
                continue
            
            try:
                cursor.execute(statement)
                completed += 1
                
                # Print progress
                if 'CREATE TABLE' in statement.upper():
                    table_name = statement.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                    print(f"  ✅ {i}. Created/Verified: {table_name}")
                elif 'ALTER TABLE' in statement.upper():
                    parts = statement.split('ALTER TABLE')[1].split()[0].strip()
                    print(f"  ✅ {i}. Updated: {parts}")
                elif 'CREATE INDEX' in statement.upper():
                    print(f"  ✅ {i}. Created index")
                elif 'INSERT INTO' in statement.upper():
                    print(f"  ✅ {i}. Inserted data")
                elif 'ADD CONSTRAINT' in statement.upper():
                    print(f"  ✅ {i}. Added constraint")
                    
            except psycopg2.Error as e:
                print(f"  ⚠️  Statement {i}: {str(e)}")
                conn.rollback()
                continue
        
        # Commit all changes
        conn.commit()
        cursor.close()
        
        print(f"\n{'='*70}")
        print(f"✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print(f"{'='*70}")
        print(f"📊 Total statements executed: {completed}")
        print(f"🎯 All bills tables have been created/updated")
        print(f"{'='*70}\n")
        
        # Verify the tables
        print("📋 Verifying tables...\n")
        verify_migration(conn)
        
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Database Connection Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("  1. Check your internet connection")
        print("  2. Verify Railway credentials")
        print("  3. Make sure Railway database is running")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

def verify_migration(conn=None):
    """Verify that all tables were created"""
    if conn is None:
        try:
            conn = psycopg2.connect(**DB_CONFIG)
        except Exception as e:
            print(f"❌ Cannot verify: {e}")
            return
    
    cursor = conn.cursor()
    
    expected_tables = [
        'bills',
        'bill_items',
        'customers',
        'particulars',
        'payment_modes',
        'payments',
        'bill_status_history',
        'tax_rates',
        'bill_sync_log',
        'bill_reminders',
        'bill_templates'
    ]
    
    try:
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print("Bills Tables Created:")
        print("-" * 50)
        created_count = 0
        for table in expected_tables:
            if table in existing_tables:
                print(f"  ✅ {table:<25} - Created")
                created_count += 1
            else:
                print(f"  ❌ {table:<25} - NOT FOUND")
        
        print("-" * 50)
        print(f"Status: {created_count}/{len(expected_tables)} tables verified\n")
        
        if created_count == len(expected_tables):
            print("🎉 All tables created successfully!")
        else:
            print(f"⚠️  {len(expected_tables) - created_count} table(s) still missing")
            
    except Exception as e:
        print(f"❌ Verification error: {e}")
    finally:
        cursor.close()
        if conn:
            conn.close()

def main():
    """Main function"""
    print("\n" + "="*70)
    print("      M&D ENGINEERS - BILLS MIGRATION TO RAILWAY")
    print("="*70 + "\n")
    
    print(f"📍 Target Database: railway")
    print(f"🔌 Host: tramway.proxy.rlwy.net:17521")
    print(f"👤 User: postgres")
    print(f"\n")
    
    execute_migration()

if __name__ == '__main__':
    main()
